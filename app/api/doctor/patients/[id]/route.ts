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
    
    // Handle medicalCondition - convert empty string to null
    // Update both medical_condition and medical_history if provided
    // This ensures compatibility with both column names
    if (Object.prototype.hasOwnProperty.call(body, "medicalCondition")) {
      const medicalValue = body.medicalCondition === "" || body.medicalCondition === null ? null : body.medicalCondition
      // Try to update both columns - if a column doesn't exist, Supabase will ignore it
      // This allows the system to work with either medical_condition or medical_history
      updates["medical_condition"] = medicalValue
      updates["medical_history"] = medicalValue
    }
    
    mapIfPresent("lastVisit", "last_visit")

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    console.log("[v0] Update payload:", updates)

    const { data, error } = await supabase
      .from("patients")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Supabase update error:", error)
      // Check if it's a column that doesn't exist
      if (error.code === "42703" || error.message.includes("column") || error.message.includes("does not exist")) {
        // Try updating without the problematic column
        const safeUpdates = { ...updates }
        delete safeUpdates.medical_condition
        console.log("[v0] Retrying without medical_condition:", safeUpdates)
        
        const { data: retryData, error: retryError } = await supabase
          .from("patients")
          .update(safeUpdates)
          .eq("id", id)
          .select()
          .single()
          
        if (retryError) throw retryError
        
        console.log("[v0] Patient updated successfully (without medical_condition)")
        return NextResponse.json(retryData)
      }
      throw error
    }

    console.log("[v0] Patient updated successfully")
    
    // Convert database fields to frontend format
    const convertedData = {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      dob: data.dob,
      phone: data.phone,
      address: data.address,
      nationalId: data.national_id,
      district: data.district,
      medicalCondition: (data as any).medical_condition ?? (data as any).medical_history ?? null, // Use medical_condition if exists, fallback to medical_history
      medicalHistory: (data as any).medical_history ?? null, // Keep medicalHistory field for backward compatibility
      allergies: data.allergies,
      emergencyContactName: data.emergency_contact_name,
      emergencyContactPhone: data.emergency_contact_phone,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
    
    return NextResponse.json(convertedData)
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

    // Check for associated records that might prevent deletion
    const [appointmentsCheck, assignmentsCheck] = await Promise.all([
      supabase.from("appointments").select("id").eq("patient_id", id).limit(1),
      supabase.from("assignments").select("id").eq("patient_id", id).limit(1),
    ])

    const hasAppointments = appointmentsCheck.data && appointmentsCheck.data.length > 0
    const hasAssignments = assignmentsCheck.data && assignmentsCheck.data.length > 0

    if (hasAppointments || hasAssignments) {
      // Implement soft delete by setting is_active to false
      const { data, error } = await supabase
        .from("patients")
        .update({ is_active: false })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      console.log("[v0] Patient soft-deleted successfully (deactivated)")
      return NextResponse.json({ 
        success: true, 
        message: "Patient deactivated due to associated records",
        softDeleted: true 
      })
    }

    // If no associations, perform hard delete
    const { error } = await supabase.from("patients").delete().eq("id", id)

    if (error) {
      // If delete fails due to foreign key constraint, try soft delete instead
      if (error.code === "23503" || error.message.includes("foreign key")) {
        const { data, error: updateError } = await supabase
          .from("patients")
          .update({ is_active: false })
          .eq("id", id)
          .select()
          .single()

        if (updateError) throw updateError

        console.log("[v0] Patient soft-deleted due to foreign key constraint")
        return NextResponse.json({ 
          success: true, 
          message: "Patient deactivated due to associated records",
          softDeleted: true 
        })
      }
      throw error
    }

    console.log("[v0] Patient deleted successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting patient:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to delete patient"
    
    // Provide user-friendly error message
    if (errorMessage.includes("foreign key") || errorMessage.includes("constraint")) {
      return NextResponse.json({ 
        error: "Cannot delete patient because they have associated appointments or assignments. Patient has been deactivated instead.",
        code: "FOREIGN_KEY_CONSTRAINT"
      }, { status: 409 })
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
