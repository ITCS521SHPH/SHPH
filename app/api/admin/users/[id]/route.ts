import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { role, ...updateData } = body

    console.log("[v0] Updating user:", params.id, "Role:", role)

    // Update the appropriate table based on role
    let result
    if (role === "DOCTOR") {
      const { data, error } = await supabase.from("doctors").update(updateData).eq("id", params.id).select().single()

      if (error) throw error
      result = data
    } else if (role === "VHV") {
      const { data, error } = await supabase.from("vhvs").update(updateData).eq("id", params.id).select().single()

      if (error) throw error
      result = data
    } else if (role === "PATIENT") {
      const { data, error } = await supabase.from("patients").update(updateData).eq("id", params.id).select().single()

      if (error) throw error
      result = data
    } else {
      return NextResponse.json({ error: "Invalid role or role cannot be updated" }, { status: 400 })
    }

    console.log("[v0] User updated successfully")
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")

    console.log("[v0] Deleting user:", params.id, "Role:", role)

    // Delete from the appropriate table based on role
    if (role === "DOCTOR") {
      const { error } = await supabase.from("doctors").delete().eq("id", params.id)

      if (error) throw error
    } else if (role === "VHV") {
      const { error } = await supabase.from("vhvs").delete().eq("id", params.id)

      if (error) throw error
    } else if (role === "PATIENT") {
      const { error } = await supabase.from("patients").delete().eq("id", params.id)

      if (error) throw error
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    console.log("[v0] User deleted successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
