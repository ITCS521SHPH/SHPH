import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

function getCategoryColor(type: string): string {
  const colorMap: Record<string, string> = {
    consultation: "#3b82f6",
    follow_up: "#10b981",
    emergency: "#ef4444",
    routine: "#f59e0b",
  }
  return colorMap[type] || "#3b82f6"
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { scheduledDate, scheduledTime, category, notes, status, duration, doctorId } = body

    const supabase = await createClient()

    // Get current appointment to check doctor_id if not provided
    const { data: currentAppointment } = await supabase
      .from("appointments")
      .select("doctor_id, scheduled_date, scheduled_time, duration_minutes")
      .eq("id", id)
      .single()

    const effectiveDoctorId = doctorId || currentAppointment?.doctor_id

    // If date or time is being updated, check for conflicts
    if ((scheduledDate || scheduledTime) && effectiveDoctorId) {
      const targetDate = scheduledDate || currentAppointment?.scheduled_date
      const targetTime = scheduledTime || currentAppointment?.scheduled_time
      const targetDuration = typeof duration !== "undefined" ? Number(duration) : (currentAppointment?.duration_minutes || 30)

      // Check for conflicting appointments - considering duration overlap
      const appointmentTime = new Date(`${targetDate}T${targetTime}`)
      const appointmentEndTime = new Date(appointmentTime.getTime() + targetDuration * 60000)

      // Query all appointments for this doctor on the same date that are not cancelled (excluding current appointment)
      const { data: existingAppointments, error: conflictError } = await supabase
        .from("appointments")
        .select("scheduled_time, duration_minutes, id")
        .eq("doctor_id", effectiveDoctorId)
        .eq("scheduled_date", targetDate)
        .neq("status", "cancelled")
        .neq("id", id) // Exclude the current appointment being updated

      if (conflictError) {
        console.error("[v0] Conflict check error:", conflictError)
        return NextResponse.json({ error: "Failed to check for conflicts" }, { status: 500 })
      }

      // Check for time overlaps
      if (existingAppointments && existingAppointments.length > 0) {
        for (const existing of existingAppointments) {
          const existingTime = new Date(`${targetDate}T${existing.scheduled_time}`)
          const existingDuration = existing.duration_minutes || 30
          const existingEndTime = new Date(existingTime.getTime() + existingDuration * 60000)

          // Check if the updated appointment overlaps with existing appointment
          const overlaps = appointmentTime < existingEndTime && appointmentEndTime > existingTime

          if (overlaps) {
            const existingTimeStr = existing.scheduled_time.toString().slice(0, 5) // HH:mm format
            return NextResponse.json({ 
              error: `Time slot conflicts with existing appointment at ${existingTimeStr}. Please choose a different time.` 
            }, { status: 409 })
          }
        }
      }
    }

    // Build update object with only existing columns
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (scheduledDate) updateData.scheduled_date = scheduledDate
    if (scheduledTime) updateData.scheduled_time = scheduledTime
    if (category) {
      updateData.appointment_type = category
      updateData.category = category === "routine" ? "routine_checkup" : category
      updateData.color = getCategoryColor(category)
    }
    if (typeof duration !== "undefined") updateData.duration_minutes = Number(duration)
    if (notes !== undefined) updateData.notes = notes
    if (status) updateData.status = status

    // Update the appointment
    const { data, error } = await supabase.from("appointments").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("[v0] Failed to update appointment:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    console.log("[v0] Appointment updated:", data.id)

    const toTimeHHmm = (t: any) => (typeof t === "string" ? t.slice(0, 5) : "")

    // Send notification to patient about reschedule/update and mark old reminders as read
    try {
      const uiCategory = (((data as any).category || data.appointment_type) === "routine_checkup")
        ? "routine"
        : ((data as any).category || data.appointment_type)

      // mark previous reminders as read
      await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("related_id", data.id)
        .eq("related_type", "appointment")
        .eq("notification_type", "appointment_reminder")

      await supabase.from("notifications").insert([
        {
          user_id: data.patient_id,
          user_type: "PATIENT",
          notification_type: "appointment_rescheduled",
          title: "Appointment Updated",
          message: `Your ${uiCategory} appointment has been updated to ${data.scheduled_date} at ${toTimeHHmm(data.scheduled_time)}.`,
          related_id: data.id,
          related_type: "appointment",
          is_read: false,
        },
      ])
    } catch (nerr) {
      console.error("[v0] Failed to insert update notification:", nerr)
    }

    const uiCategory = (((data as any).category || data.appointment_type) === "routine_checkup")
      ? "routine"
      : ((data as any).category || data.appointment_type)

    return NextResponse.json({
      id: data.id,
      patientId: data.patient_id,
      doctorId: data.doctor_id,
      scheduledDate: data.scheduled_date,
      scheduledTime: toTimeHHmm(data.scheduled_time),
      duration: (data as any).duration_minutes ?? 30,
      category: uiCategory,
      color: getCategoryColor(uiCategory),
      status: data.status,
      notes: data.notes,
      confirmedByPatient: (data as any).confirmed_by_patient === true,
    })
  } catch (error: any) {
    console.error("[v0] Appointment update error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const supabase = await createClient()

    // Soft delete by updating status to cancelled
    const { data, error } = await supabase
      .from("appointments")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Failed to cancel appointment:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    console.log("[v0] Appointment cancelled:", data.id)

    return NextResponse.json({ success: true, message: "Appointment cancelled successfully" })
  } catch (error: any) {
    console.error("[v0] Appointment cancellation error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
