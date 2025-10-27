import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { notifyAppointmentUpdated, notifyAppointmentCancelled } from "@/lib/notifications"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { scheduledDate, scheduledTime, duration, category, notes, status } = body

    const supabase = await createClient()

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (scheduledDate) updateData.scheduled_date = scheduledDate
    if (scheduledTime) updateData.scheduled_time = scheduledTime
    if (duration) updateData.duration = duration
    if (category) updateData.appointment_type = category
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

    // Send notification to patient about the update
    if (scheduledDate || scheduledTime) {
      await notifyAppointmentUpdated(data.patient_id, {
        type: data.appointment_type || "Consultation",
        date: data.scheduled_date,
        time: data.scheduled_time,
        appointmentId: data.id,
      })
    }

    console.log("[v0] Appointment updated and notification sent:", data.id)

    return NextResponse.json({
      id: data.id,
      patientId: data.patient_id,
      doctorId: data.doctor_id,
      scheduledDate: data.scheduled_date,
      scheduledTime: data.scheduled_time,
      duration: data.duration,
      category: data.appointment_type,
      color: data.color,
      status: data.status,
      notes: data.notes,
      confirmedByPatient: data.confirmed_by_patient,
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

    // Send cancellation notification to patient
    await notifyAppointmentCancelled(data.patient_id, {
      type: data.appointment_type || "Consultation",
      date: data.scheduled_date,
      appointmentId: data.id,
    })

    console.log("[v0] Appointment cancelled and notification sent:", data.id)

    return NextResponse.json({ success: true, message: "Appointment cancelled successfully" })
  } catch (error: any) {
    console.error("[v0] Appointment cancellation error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
