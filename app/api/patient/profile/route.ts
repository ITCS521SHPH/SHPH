import { NextRequest, NextResponse } from "next/server"
import { supabaseApi } from "@/lib/supabase-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")

    if (!patientId) {
      return NextResponse.json({ error: "patientId is required" }, { status: 400 })
    }

    const profile = await supabaseApi.getPatientProfile(patientId)

    if (!profile) {
      return NextResponse.json({ error: "Patient profile not found" }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Get patient profile error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get patient profile" },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, phone, district, address } = body

    if (!patientId) {
      return NextResponse.json({ error: "patientId is required" }, { status: 400 })
    }

    const updates: { phone?: string | null; district?: string | null; address?: string | null } = {}

    if (phone !== undefined) {
      if (phone !== null && typeof phone !== "string") {
        return NextResponse.json({ error: "phone must be a string" }, { status: 400 })
      }
      updates.phone = phone
    }

    if (district !== undefined) {
      if (district !== null && typeof district !== "string") {
        return NextResponse.json({ error: "district must be a string" }, { status: 400 })
      }
      updates.district = district
    }

    if (address !== undefined) {
      if (address !== null && typeof address !== "string") {
        return NextResponse.json({ error: "address must be a string" }, { status: 400 })
      }
      updates.address = address
    }

    const result = await supabaseApi.updatePatientProfile(patientId, updates)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Update patient profile error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update patient profile" },
      { status: 500 },
    )
  }
}
