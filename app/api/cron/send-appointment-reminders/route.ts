import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { sendEmail } from "@/lib/mailer"
import { sendSMS } from "@/lib/sms"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()

    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(now.getDate() + 1)

    const yyyyMmDd = (d: Date) => d.toISOString().split("T")[0]

    // Find appointments for tomorrow that haven't been reminded yet
    const { data: appts, error } = await supabase
      .from("appointments")
      .select("*, patient:patients(*), doctor:doctors(*)")
      .eq("scheduled_date", yyyyMmDd(tomorrow))
      .eq("status", "scheduled")
      .or("reminder_sent.is.null,reminder_sent.eq.false")

    if (error) {
      console.error("[v0] Reminder query error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const sent: string[] = []

    for (const apt of appts || []) {
      const patient = (apt as any).patient
      const doctor = (apt as any).doctor
      const patientName = patient ? `${patient.first_name} ${patient.last_name}` : "Patient"
      const doctorName = doctor ? `${doctor.first_name} ${doctor.last_name}` : "Doctor"
      const time = typeof apt.scheduled_time === "string" ? apt.scheduled_time.slice(0, 5) : ""
      const location = (apt as any).location || "Medical Center"

      const title = "Appointment Reminder"
      const message = `Hello ${patientName}, this is a reminder for your appointment with Dr. ${doctorName} on ${apt.scheduled_date} at ${time}. Location: ${location}. Please confirm or cancel from your dashboard.`

      // In-app notification
      await supabase.from("notifications").insert({
        user_id: apt.patient_id,
        user_type: "PATIENT",
        notification_type: "appointment_reminder",
        title,
        message,
        related_id: apt.id,
        related_type: "appointment",
        is_read: false,
      })

      // Email (optional)
      if (patient?.email) {
        await sendEmail({
          to: patient.email,
          subject: title,
          text: message,
        })
      }

      // SMS (optional)
      if (patient?.phone) {
        await sendSMS({ to: patient.phone, body: message })
      }

      // Mark reminded
      await supabase
        .from("appointments")
        .update({ reminder_sent: true, reminder_sent_at: new Date().toISOString() })
        .eq("id", apt.id)

      sent.push(apt.id)
    }

    return NextResponse.json({ success: true, count: sent.length })
  } catch (error: any) {
    console.error("[v0] Send reminders error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

