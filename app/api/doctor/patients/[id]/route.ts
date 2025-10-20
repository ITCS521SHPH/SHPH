import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const body = await request.json()

    console.log("[v0] Updating patient:", params.id)

    const { data, error } = await supabase.from("patients").update(body).eq("id", params.id).select().single()

    if (error) throw error

    console.log("[v0] Patient updated successfully")
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error updating patient:", error)
    return NextResponse.json({ error: "Failed to update patient" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    console.log("[v0] Deleting patient:", params.id)

    const { error } = await supabase.from("patients").delete().eq("id", params.id)

    if (error) throw error

    console.log("[v0] Patient deleted successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting patient:", error)
    return NextResponse.json({ error: "Failed to delete patient" }, { status: 500 })
  }
}
