import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { notifyAppointmentCreated } from "@/lib/notifications"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const doctorId = searchParams.get("doctorId")
    const date = searchParams.get("date")
    const viewMode = searchParams.get("viewMode") || "week"

    if (!doctorId) {
      return NextResponse.json({ error: "Doctor ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Calculate date range based on view mode
    let startDate = date || new Date().toISOString().split("T")[0]
    let endDate = startDate

    if (viewMode === "week") {
      // Get the week range
      const start = new Date(startDate)
      const dayOfWeek = start.getDay()
      const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Adjust to Monday
      start.setDate(diff)
      startDate = start.toISOString().split("T")[0]

      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      endDate = end.toISOString().split("T")[0]
    }

    // Fetch appointments for the doctor within the date range
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        *,
        patient:patients!appointments_patient_id_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .eq("doctor_id", doctorId)
      .gte("scheduled_date", startDate)
      .lte("scheduled_date", endDate)
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true })

    if (error) {
      console.error("[v0] Failed to fetch appointments:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform the data to match the frontend format
    const appointments = (data || []).map((apt: any) => ({
      id: apt.id,
      patientId: apt.patient_id,
      patientName: apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : "Unknown Patient",
      doctorId: apt.doctor_id,
      scheduledDate: apt.scheduled_date,
      scheduledTime: apt.scheduled_time,
      duration: apt.duration || 30,
      category: apt.appointment_type || "general",
      color: apt.color || "#3b82f6",
      status: apt.status,
      notes: apt.notes,
      confirmedByPatient: apt.confirmed_by_patient || false,
    }))

    return NextResponse.json(appointments)
  } catch (error: any) {
    console.error("[v0] Appointment fetch error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { doctorId, patientId, patientName, scheduledDate, scheduledTime, duration, category, color, notes } = body

    if (!doctorId || !patientId || !scheduledDate || !scheduledTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check for conflicting appointments
    const { data: conflicts, error: conflictError } = await supabase
      .from("appointments")
      .select("*")
      .eq("doctor_id", doctorId)
      .eq("scheduled_date", scheduledDate)
      .eq("scheduled_time", scheduledTime)
      .neq("status", "cancelled")

    if (conflictError) {
      console.error("[v0] Conflict check error:", conflictError)
      return NextResponse.json({ error: "Failed to check for conflicts" }, { status: 500 })
    }

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({ error: "Time slot already booked. Please choose a different time." }, { status: 409 })
    }

    // Get doctor name for notification
    const { data: doctorData } = await supabase.from("users").select("name, email").eq("id", doctorId).single()

    const doctorName = doctorData?.name || doctorData?.email || "Your doctor"

    // Create the appointment
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        doctor_id: doctorId,
        patient_id: patientId,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        duration: duration || 30,
        appointment_type: category || "general",
        color: color || "#3b82f6",
        status: "scheduled",
        notes: notes || null,
        confirmed_by_patient: false,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Failed to create appointment:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send notification to patient
    await notifyAppointmentCreated(patientId, {
      type: category || "Consultation",
      date: scheduledDate,
      time: scheduledTime,
      providerName: doctorName,
      appointmentId: data.id,
    })

    console.log("[v0] Appointment created and notification sent:", data.id)

    return NextResponse.json({
      id: data.id,
      patientId: data.patient_id,
      patientName,
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
    console.error("[v0] Appointment creation error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
