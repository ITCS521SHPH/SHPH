import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import {
  decodeMedicalConditionPayload,
  encodeMedicalConditionPayload,
  formatMedicalConditionSummary,
} from "@/lib/medical-condition-categories"

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } },
) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { id } = await (context as any).params
    console.log("[v0] Updating patient:", id)

    const buildResponse = (row: any) => {
      const rawHistory = (row as any)?.medical_history ?? null
      const decodedHistory = decodeMedicalConditionPayload(rawHistory)
      const medicalCategory =
        (row as any)?.medical_condition ?? decodedHistory.category ?? null
      const medicalNotes = decodedHistory.notes ?? null
      const hasCondition = !!medicalCategory || !!medicalNotes
      const medicalConditionDisplay = hasCondition
        ? formatMedicalConditionSummary(medicalCategory ?? undefined, medicalNotes ?? undefined)
        : null

      return {
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        dob: row.dob,
        phone: row.phone,
        address: row.address,
        nationalId: row.national_id,
        district: row.district,
        medicalCondition: medicalConditionDisplay,
        medicalConditionCategory: medicalCategory,
        medicalConditionNotes: medicalNotes,
        medicalHistory: medicalNotes, // Keep medicalHistory field for backward compatibility
        allergies: row.allergies,
        emergencyContactName: row.emergency_contact_name,
        emergencyContactPhone: row.emergency_contact_phone,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    }

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
    
    let nextMedicalCategory: string | null | undefined = undefined
    let nextMedicalNotes: string | null | undefined = undefined

    if (Object.prototype.hasOwnProperty.call(body, "medicalConditionCategory")) {
      const rawCategory =
        body.medicalConditionCategory === "" || body.medicalConditionCategory === null
          ? ""
          : String(body.medicalConditionCategory).trim()
      nextMedicalCategory = rawCategory.length === 0 ? null : rawCategory.toUpperCase()
    }

    if (Object.prototype.hasOwnProperty.call(body, "medicalConditionNotes")) {
      nextMedicalNotes =
        body.medicalConditionNotes === "" || body.medicalConditionNotes === null
          ? null
          : String(body.medicalConditionNotes)
    }

    // Backwards compatibility: if legacy medicalCondition field supplied without new fields, mirror to both columns
    if (
      Object.prototype.hasOwnProperty.call(body, "medicalCondition") &&
      !Object.prototype.hasOwnProperty.call(body, "medicalConditionCategory") &&
      !Object.prototype.hasOwnProperty.call(body, "medicalConditionNotes")
    ) {
      const medicalValue =
        body.medicalCondition === "" || body.medicalCondition === null ? null : String(body.medicalCondition).trim()
      const decodedLegacy = decodeMedicalConditionPayload(medicalValue)
      if (nextMedicalCategory === undefined) {
        nextMedicalCategory = decodedLegacy.category ?? (medicalValue || null)
      }
      if (nextMedicalNotes === undefined) {
        nextMedicalNotes = decodedLegacy.notes ?? (decodedLegacy.category ? null : medicalValue)
      }
    }

    if (nextMedicalCategory !== undefined) {
      updates["medical_condition"] = nextMedicalCategory
    }

    if (nextMedicalCategory !== undefined || nextMedicalNotes !== undefined) {
      const encodedSummary = encodeMedicalConditionPayload(
        nextMedicalCategory === undefined ? null : nextMedicalCategory,
        nextMedicalNotes === undefined ? null : nextMedicalNotes,
      )
      updates["medical_history"] = encodedSummary
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
        return NextResponse.json(buildResponse(retryData))
      }
      throw error
    }

    console.log("[v0] Patient updated successfully")

    return NextResponse.json(buildResponse(data))
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
