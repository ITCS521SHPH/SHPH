import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

function buildUpdatePayload(role: string, updateData: Record<string, any>) {
  const mapped: Record<string, any> = {}

  const setIfPresent = (key: string, value: any) => {
    if (value !== undefined) mapped[key] = value
  }

  // Common fields across roles (snake_case in DB)
  setIfPresent("first_name", updateData.firstName ?? updateData.first_name)
  setIfPresent("last_name", updateData.lastName ?? updateData.last_name)
  setIfPresent("phone", updateData.phoneNumber ?? updateData.phone)
  setIfPresent("district", updateData.district)
  setIfPresent("is_active", updateData.isActive ?? updateData.is_active)

  if (role === "DOCTOR" || role === "VHV") {
    setIfPresent("license_number", updateData.licenseNumber ?? updateData.license_number)
    setIfPresent("specialization", updateData.specialization)
    setIfPresent("experience_years", updateData.experienceYears ?? updateData.experience_years)
  }

  if (role === "PATIENT") {
    setIfPresent("national_id", updateData.nationalId ?? updateData.national_id)
    setIfPresent("dob", updateData.dob)
    setIfPresent("address", updateData.address)
    setIfPresent("emergency_contact_name", updateData.emergencyContactName ?? updateData.emergency_contact_name)
    setIfPresent("emergency_contact_phone", updateData.emergencyContactPhone ?? updateData.emergency_contact_phone)
    setIfPresent("medical_history", updateData.medicalHistory ?? updateData.medical_history)
    setIfPresent("allergies", updateData.allergies)
  }

  return mapped
}

export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { role, ...updateData } = body
    const { id } = await ctx.params

    console.log("[v0] Updating user:", id, "Role:", role)

    // Update the appropriate table based on role
    let result
    if (role === "DOCTOR") {
      const payload = buildUpdatePayload("DOCTOR", updateData)
      const { data, error } = await supabase.from("doctors").update(payload).eq("id", id).select().single()

      if (error) throw error
      result = data
    } else if (role === "VHV") {
      const payload = buildUpdatePayload("VHV", updateData)
      const { data, error } = await supabase.from("vhvs").update(payload).eq("id", id).select().single()

      if (error) throw error
      result = data
    } else if (role === "PATIENT") {
      const payload = buildUpdatePayload("PATIENT", updateData)
      const { data, error } = await supabase.from("patients").update(payload).eq("id", id).select().single()

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

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")

    const { id } = await ctx.params
    console.log("[v0] Deleting user:", id, "Role:", role)

    // Delete from the appropriate table based on role
    if (role === "DOCTOR") {
      const { error } = await supabase.from("doctors").delete().eq("id", id)

      if (error) throw error
    } else if (role === "VHV") {
      const { error } = await supabase.from("vhvs").delete().eq("id", id)

      if (error) throw error
    } else if (role === "PATIENT") {
      const { error } = await supabase.from("patients").delete().eq("id", id)

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
