import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const supabase = await createClient()

    // Load appointment to know patient/doctor
    const { data: apt, error: fetchError } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !apt) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Update status to cancelled and set cancelled_by to patient
    const { data, error } = await supabase
      .from("appointments")
      .update({
        status: "cancelled",
        cancelled_by: apt.patient_id,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Failed to cancel appointment:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch names for message
    const { data: patientRow } = await supabase
      .from("patients")
      .select("first_name, last_name")
      .eq("id", apt.patient_id)
      .single()
    const { data: doctorRow } = await supabase
      .from("doctors")
      .select("first_name, last_name")
      .eq("id", apt.doctor_id)
      .single()

    const patientName = patientRow ? `${patientRow.first_name} ${patientRow.last_name}` : "Patient"
    const doctorName = doctorRow ? `${doctorRow.first_name} ${doctorRow.last_name}` : "Doctor"

    // Mark previous reminders for this appointment as read
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("related_id", id)
      .eq("related_type", "appointment")
      .eq("notification_type", "appointment_reminder")

    // Notify both parties about cancellation
    await supabase.from("notifications").insert([
      {
        user_id: apt.patient_id,
        user_type: "PATIENT",
        notification_type: "appointment_cancelled",
        title: "Appointment Cancelled",
        message: `You cancelled your appointment with Dr. ${doctorName} scheduled for ${apt.scheduled_date} at ${String(apt.scheduled_time).slice(0,5)}.`,
        related_id: id,
        related_type: "appointment",
        is_read: false,
      },
      {
        user_id: apt.doctor_id,
        user_type: "DOCTOR",
        notification_type: "appointment_cancelled",
        title: "Appointment Cancelled",
        message: `${patientName} cancelled the appointment scheduled for ${apt.scheduled_date} at ${String(apt.scheduled_time).slice(0,5)}.`,
        related_id: id,
        related_type: "appointment",
        is_read: false,
      },
    ])

    return NextResponse.json({ success: true, message: "Appointment cancelled" })
  } catch (error: any) {
    console.error("[v0] Appointment cancel error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

