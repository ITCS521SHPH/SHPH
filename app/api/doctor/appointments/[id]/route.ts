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
    const { scheduledDate, scheduledTime, category, notes, status } = body

    const supabase = await createClient()

    // Build update object with only existing columns
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (scheduledDate) updateData.scheduled_date = scheduledDate
    if (scheduledTime) updateData.scheduled_time = scheduledTime
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

    console.log("[v0] Appointment updated:", data.id)

    return NextResponse.json({
      id: data.id,
      patientId: data.patient_id,
      doctorId: data.doctor_id,
      scheduledDate: data.scheduled_date,
      scheduledTime: data.scheduled_time,
      duration: 30, // Default value
      category: data.appointment_type,
      color: getCategoryColor(data.appointment_type),
      status: data.status,
      notes: data.notes,
      confirmedByPatient: false, // Default value
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
