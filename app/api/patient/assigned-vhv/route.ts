import { NextRequest, NextResponse } from "next/server"
import { supabaseApi } from "@/lib/supabase-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")

    if (!patientId) {
      return NextResponse.json({ error: "patientId is required" }, { status: 400 })
    }

    const assignment = await supabaseApi.getAssignedVHVForPatient(patientId)

    return NextResponse.json(assignment)
  } catch (error) {
    console.error("Get assigned VHV error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get assigned VHV" },
      { status: 500 },
    )
  }
}
