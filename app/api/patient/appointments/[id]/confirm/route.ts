import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const supabase = await createClient()

    // Update the appointment to mark as confirmed by patient
    const { data, error } = await supabase
      .from("appointments")
      .update({
        confirmed_by_patient: true,
        confirmed_at: new Date().toISOString(),
        status: "confirmed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Failed to confirm appointment:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    console.log("[v0] Appointment confirmed by patient:", data.id)

    // Fetch patient and doctor info for notifications
    const appointment = data as any
    const { data: patientRow } = await supabase
      .from("patients")
      .select("id, first_name, last_name")
      .eq("id", appointment.patient_id)
      .single()
    const { data: doctorRow } = await supabase
      .from("doctors")
      .select("id, first_name, last_name")
      .eq("id", appointment.doctor_id)
      .single()

    const patientName = patientRow ? `${patientRow.first_name} ${patientRow.last_name}` : "Patient"
    const doctorName = doctorRow ? `${doctorRow.first_name} ${doctorRow.last_name}` : "Doctor"

    const title = "Appointment Confirmed"
    const message = `${patientName} confirmed the appointment on ${appointment.scheduled_date} at ${String(appointment.scheduled_time).slice(0,5)}.`

    // Notify patient (ack) and doctor (info)
    await supabase.from("notifications").insert([
      {
        user_id: appointment.patient_id,
        user_type: "PATIENT",
        notification_type: "appointment_confirmed",
        title,
        message: `You confirmed your appointment with Dr. ${doctorName} on ${appointment.scheduled_date} at ${String(appointment.scheduled_time).slice(0,5)}.`,
        related_id: appointment.id,
        related_type: "appointment",
        is_read: false,
      },
      {
        user_id: appointment.doctor_id,
        user_type: "DOCTOR",
        notification_type: "appointment_confirmed",
        title,
        message,
        related_id: appointment.id,
        related_type: "appointment",
        is_read: false,
      },
    ])

    return NextResponse.json({
      success: true,
      message: "Appointment confirmed successfully",
      appointment: {
        id: data.id,
        confirmedByPatient: data.confirmed_by_patient,
      },
    })
  } catch (error: any) {
    console.error("[v0] Appointment confirmation error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
