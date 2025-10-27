import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const doctorId = searchParams.get("doctorId")
    const date = searchParams.get("date")
    const viewMode = searchParams.get("viewMode") || "week"

    console.log("[v0] Fetching appointments for doctor:", doctorId, "date:", date, "viewMode:", viewMode)

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

    console.log("[v0] Date range:", startDate, "to", endDate)

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

    console.log("[v0] Raw appointments from database:", data?.length || 0, "appointments")
    console.log("[v0] Raw data:", JSON.stringify(data, null, 2))

    const appointments = (data || []).map((apt: any) => ({
      id: apt.id,
      patientId: apt.patient_id,
      patientName: apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : "Unknown Patient",
      doctorId: apt.doctor_id,
      scheduledDate: apt.scheduled_date,
      scheduledTime: apt.scheduled_time,
      duration: 30, // Default duration since column doesn't exist
      category: apt.appointment_type || "consultation",
      color: getCategoryColor(apt.appointment_type || "consultation"),
      status: apt.status,
      notes: apt.notes,
      confirmedByPatient: false, // Default since column doesn't exist
    }))

    console.log("[v0] Mapped appointments:", appointments.length, "appointments")
    console.log("[v0] Returning appointments:", JSON.stringify(appointments, null, 2))

    return NextResponse.json(appointments)
  } catch (error: any) {
    console.error("[v0] Appointment fetch error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

function getCategoryColor(type: string): string {
  const colorMap: Record<string, string> = {
    consultation: "#3b82f6",
    follow_up: "#10b981",
    emergency: "#ef4444",
    routine: "#f59e0b",
  }
  return colorMap[type] || "#3b82f6"
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { doctorId, patientId, patientName, scheduledDate, scheduledTime, category, notes } = body

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

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        doctor_id: doctorId,
        patient_id: patientId,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        appointment_type: category || "consultation",
        status: "scheduled",
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Failed to create appointment:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Appointment created successfully:", data.id)

    return NextResponse.json({
      id: data.id,
      patientId: data.patient_id,
      patientName,
      doctorId: data.doctor_id,
      scheduledDate: data.scheduled_date,
      scheduledTime: data.scheduled_time,
      duration: 30,
      category: data.appointment_type,
      color: getCategoryColor(data.appointment_type),
      status: data.status,
      notes: data.notes,
      confirmedByPatient: false,
    })
  } catch (error: any) {
    console.error("[v0] Appointment creation error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
