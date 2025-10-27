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
