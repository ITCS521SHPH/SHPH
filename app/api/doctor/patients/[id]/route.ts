import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } },
) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { id } = await (context as any).params
    console.log("[v0] Updating patient:", id)

    // Whitelist and map camelCase fields to DB columns
    const updates: Record<string, any> = {}
    const mapIfPresent = (srcKey: string, dstKey: string = srcKey) => {
      if (Object.prototype.hasOwnProperty.call(body, srcKey)) {
        updates[dstKey] = body[srcKey]
      }
    }

    mapIfPresent("email", "email")
    mapIfPresent("firstName", "first_name")
    mapIfPresent("lastName", "last_name")
    mapIfPresent("dob", "dob")
    mapIfPresent("address", "address")
    mapIfPresent("phone", "phone")
    mapIfPresent("district", "district")
    mapIfPresent("nationalId", "national_id")
    mapIfPresent("medicalCondition", "medical_condition")
    mapIfPresent("lastVisit", "last_visit")

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("patients")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    console.log("[v0] Patient updated successfully")
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error updating patient:", error)
    const message = error instanceof Error ? error.message : "Failed to update patient"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } },
) {
  try {
    const supabase = createClient()

    const { id } = await (context as any).params
    console.log("[v0] Deleting patient:", id)

    const { error } = await supabase.from("patients").delete().eq("id", id)

    if (error) throw error

    console.log("[v0] Patient deleted successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting patient:", error)
    return NextResponse.json({ error: "Failed to delete patient" }, { status: 500 })
  }
}
