import { createClient } from "@supabase/supabase-js"
import type { Database } from "./supabase"

// Create Supabase client with service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Debug logging
console.log("Supabase API initialization:", {
  supabaseUrl: supabaseUrl ? "Set" : "Not set",
  supabaseServiceKey: supabaseServiceKey ? "Set" : "Not set",
  isServer: typeof window === "undefined",
})

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null
import type {
  User,
  Patient,
  IntakeSubmission,
  HealthWorker,
  Assignment,
  Task,
  LoginRequest,
  LoginResponse,
  CreatePatient,
  CreateDoctorRequest,
  CreateVHVRequest,
  DoctorProfile,
  VHVProfile,
  UpdateVHVProfileRequest,
  UpdatePatientProfileRequest,
  CreateTaskRequest,
  AssignPatientRequest,
  CreateEmergencyAlertRequest,
  UpdateEmergencyAlertRequest,
  EmergencyAlert,
  Appointment,
  Visit,
  Medication,
  VitalSigns,
  RescheduleRequest,
} from "./types"

// Type definitions for Supabase responses
type PatientRow = Database["public"]["Tables"]["patients"]["Row"]
type IntakeRow = Database["public"]["Tables"]["intake_submissions"]["Row"]
type HealthWorkerRow = Database["public"]["Tables"]["health_workers"]["Row"]
type AssignmentRow = Database["public"]["Tables"]["assignments"]["Row"]
type TaskRow = Database["public"]["Tables"]["tasks"]["Row"]
type DoctorRow = Database["public"]["Tables"]["doctors"]["Row"]
type VhvRow = Database["public"]["Tables"]["vhvs"]["Row"]
type EmergencyAlertRow = Database["public"]["Tables"]["emergency_alerts"]["Row"] & {
  doctor_id?: string
  vhv_id?: string
  patient_name?: string
  triggered_by?: string
}

// Convert Supabase rows to our types

const convertPatientRow = (row: PatientRow): Patient => ({
  id: row.id,
  userId: row.user_id || undefined,
  nationalId: row.national_id || undefined,
  firstName: row.first_name,
  lastName: row.last_name,
  dob: new Date(row.dob),
  phone: row.phone || undefined,
  address: row.address || undefined,
  district: row.district || undefined,
  medicalCondition: (row as any).medical_condition ?? (row as any).medical_history ?? undefined, // Use medical_condition if exists, otherwise medical_history
  lastVisit: (row as any).last_visit ? new Date((row as any).last_visit) : undefined,
  createdAt: new Date(row.created_at),
  updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
})

const convertIntakeRow = (row: IntakeRow): IntakeSubmission => ({
  id: row.id,
  patientId: row.patient_id,
  vhvId: row.vhv_id,
  status: row.status as any,
  payload: row.payload,
  attachments: row.attachments,
  createdAt: new Date(row.created_at),
  updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
})

const convertHealthWorkerRow = (row: HealthWorkerRow): HealthWorker => ({
  id: row.id,
  userId: row.user_id,
  type: row.type as any,
  licenseNumber: row.license_number || undefined,
  createdAt: new Date(row.created_at),
  updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
})

const convertAssignmentRow = (row: AssignmentRow): Assignment => ({
  id: row.id,
  patientId: row.patient_id,
  vhvId: row.vhv_id,
  doctorId: row.doctor_id,
  status: row.status,
  assignedAt: new Date(row.assigned_at),
  createdAt: new Date(row.created_at),
  updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
})

const convertTaskRow = (row: TaskRow): Task => {
  const priorityMap: Record<string, Task["priority"]> = {
    low: "LOW",
    medium: "MEDIUM",
    high: "HIGH",
    urgent: "URGENT",
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    patientId: row.patient_id,
    vhvId: row.vhv_id,
    doctorId: row.doctor_id,
    priority: priorityMap[(row as any).priority] ?? "MEDIUM",
    status: row.status as Task["status"],
    dueDate: row.due_date ? new Date(row.due_date) : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    formResponse: (row as any).form_response || undefined,
  }
}

const convertDoctorRow = (row: DoctorRow): DoctorProfile => ({
  id: row.id,
  email: row.email,
  firstName: row.first_name,
  lastName: row.last_name,
  name: `${row.first_name} ${row.last_name}`.trim(),
  phone: row.phone || undefined,
  district: row.district || undefined,
  licenseNumber: row.license_number,
  specialization: row.specialization || undefined,
  experienceYears: typeof row.experience_years === "number" ? row.experience_years : undefined,
  status: row.is_active ? "active" : "inactive",
  isActive: row.is_active ?? true,
  createdAt: new Date(row.created_at),
  updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
})

const convertVHVRow = (row: VhvRow): VHVProfile => ({
  id: row.id,
  email: row.email,
  firstName: row.first_name,
  lastName: row.last_name,
  name: `${row.first_name} ${row.last_name}`.trim(),
  phone: row.phone || undefined,
  district: row.district || undefined,
  licenseNumber: row.license_number,
  specialization: row.specialization || undefined,
  experienceYears: typeof row.experience_years === "number" ? row.experience_years : undefined,
  status: row.is_active ? "active" : "inactive",
  isActive: row.is_active ?? true,
  createdAt: new Date(row.created_at),
  updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
})

const convertEmergencyAlertRow = (row: EmergencyAlertRow): EmergencyAlert => {
  // Map database status to frontend enum values
  const statusMap: { [key: string]: string } = {
    active: "ACTIVE",
    acknowledged: "ACKNOWLEDGED",
    resolved: "RESOLVED",
    cancelled: "CANCELLED",
  }

  // Map database priority to frontend enum values
  const priorityMap: { [key: string]: string } = {
    high: "HIGH",
    medium: "MEDIUM",
    low: "LOW",
  }

  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: row.patient_name,
    triggeredBy: row.triggered_by,
    priority: priorityMap[row.priority] || (row.priority as any),
    status: statusMap[row.status] || (row.status as any),
    description: row.description || undefined,
    location: row.location || undefined,
    assignedDoctorId: row.doctor_id || undefined,
    assignedVHVId: row.vhv_id || undefined,
    acknowledgedBy: row.doctor_id || row.vhv_id || undefined, // Use doctor_id or vhv_id as acknowledged_by
    acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at) : undefined,
    resolvedBy: row.doctor_id || row.vhv_id || undefined, // Use doctor_id or vhv_id as resolved_by
    resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
    responseTime: undefined, // Not available in current schema
    createdAt: new Date(row.created_at),
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  }
}

// Authentication API using separate role tables
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  try {
    console.log("[v0] Attempting login for:", credentials.email)

    // Use the authenticate_user function to check all role tables
    const { data: authResult, error: authError } = await supabase.rpc("authenticate_user", {
      input_email: credentials.email,
      input_password: credentials.password,
    })

    console.log("[v0] RPC authenticate_user result:", { authResult, authError })

    if (authError) {
      console.error("[v0] RPC error:", authError)
      throw new Error(authError.message)
    }

    if (!authResult || authResult.length === 0) {
      throw new Error("Invalid email or password")
    }

    const userData = authResult[0]
    console.log("[v0] User data from RPC:", userData)

    // Create a real Supabase session by signing in with email/password
    // This will create a proper JWT token
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    console.log("[v0] Supabase auth result:", { authData, signInError })

    if (signInError) {
      // If Supabase Auth fails, fall back to our custom authentication
      // but still return the user data from our database
      console.warn("[v0] Supabase Auth sign-in failed, using custom auth:", signInError.message)

      const customToken = `custom_auth_${userData.user_id}_${Date.now()}`

      return {
        accessToken: customToken,
        refreshToken: customToken,
        role: userData.user_type as any,
        userId: userData.user_id,
      }
    }

    // Return the real Supabase session data
    return {
      accessToken: authData.session?.access_token || "",
      refreshToken: authData.session?.refresh_token || "",
      role: userData.user_type as any,
      userId: userData.user_id,
    }
  } catch (error) {
    console.error("[v0] Login error in supabase-api:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error(String(error))
  }
}

export const logout = async (): Promise<void> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  const { error } = await supabase.auth.signOut()
  if (error) {
    throw new Error(error.message)
  }
}

export const getCurrentUser = async (): Promise<User | null> => {
  // Since we're not using Supabase Auth anymore, we need to get user from localStorage
  // This is a temporary solution - in a real app, you'd store the user data after login
  if (typeof window === "undefined") {
    return null
  }

  const storedUser = localStorage.getItem("currentUser")
  if (!storedUser) {
    return null
  }

  try {
    const userData = JSON.parse(storedUser)
    return {
      id: userData.id,
      email: userData.email,
      passwordHash: "", // Not needed for client
      role: userData.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  } catch (error) {
    console.error("Error parsing stored user:", error)
    return null
  }
}

// Patients API
export const getPatients = async (): Promise<any[]> => {
  if (!supabase) {
    return []
  }

  try {
    const { data, error } = await supabase.from("patients").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Patients query error:", error)
      throw new Error(`Patients query failed: ${error.message}`)
    }

    return (
      data?.map((row) => ({
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        name: `${row.first_name} ${row.last_name}`,
        status: row.is_active ? "active" : "inactive",
        phone: row.phone,
        nationalId: row.national_id,
        dob: row.dob,
        address: row.address,
        district: row.district,
        emergencyContactName: row.emergency_contact_name,
        emergencyContactPhone: row.emergency_contact_phone,
        medicalCondition: (row as any).medical_condition ?? (row as any).medical_history ?? null, // Use medical_condition if exists, otherwise medical_history
        medicalHistory: (row as any).medical_history ?? null, // Keep medicalHistory for backward compatibility
        allergies: row.allergies,
        createdAt: new Date(row.created_at),
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
      })) || []
    )
  } catch (error) {
    console.error("Error fetching patients:", error)
    throw new Error("Failed to fetch patients")
  }
}

export const getPatientById = async (id: string): Promise<Patient | null> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  const { data, error } = await supabase.from("patients").select("*").eq("id", id).single()

  if (error) {
    return null
  }

  return convertPatientRow(data)
}

export const getPatientProfile = async (patientId: string): Promise<Patient | null> => {
  return getPatientById(patientId)
}

export const updatePatientProfile = async (
  patientId: string,
  updates: UpdatePatientProfileRequest,
): Promise<Patient> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  const payload: Record<string, any> = {}
  if (updates.phone !== undefined) {
    payload.phone = updates.phone ?? null
  }
  if (updates.district !== undefined) {
    payload.district = updates.district ?? null
  }
  if (updates.address !== undefined) {
    payload.address = updates.address ?? null
  }

  if (Object.keys(payload).length === 0) {
    const existing = await getPatientProfile(patientId)
    if (!existing) {
      throw new Error("Patient profile not found")
    }
    return existing
  }

  const { data, error } = await supabase
    .from("patients")
    .update(payload)
    .eq("id", patientId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }
  if (!data) {
    throw new Error("Patient profile not found")
  }

  return convertPatientRow(data as PatientRow)
}

export const createPatient = async (patientData: CreatePatient): Promise<Patient> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  // Generate a unique dummy email for patients without accounts to avoid constraint violation
  // This is a temporary workaround until the migration can be applied
  const dummyEmail = `noemail_${Date.now()}_${Math.random().toString(36).substring(7)}@temp.local`

  // Generate a placeholder password hash to satisfy NOT NULL constraints when present
  let computedHash: string | null = null
  try {
    const passwordToHash = patientData.password && `${patientData.password}`.trim().length > 0
      ? patientData.password
      : `Temp_${Math.random().toString(36).slice(2, 10)}!`
    const { data: hashed, error: hashErr } = await supabase.rpc("hash_password", { password: passwordToHash })
    if (!hashErr && typeof hashed === "string") {
      computedHash = hashed
    }
  } catch (_) {
    // ignore; we'll fallback to a static string if needed
  }

  // Attempt insert including optional columns; fall back to minimal payload if schema lacks columns
  const optionalPayload: any = {
    email: patientData.email || dummyEmail,
    national_id: patientData.nationalId || null,
    first_name: patientData.firstName,
    last_name: patientData.lastName,
    dob: patientData.dob,
    phone: patientData.phone || null,
    address: patientData.address || null,
    district: patientData.district || null,
    medical_condition: patientData.medicalCondition || null,
    medical_history: patientData.medicalCondition || null, // Also set medical_history for compatibility
    // Note: last_visit may not exist in schema, handle it separately
    password_hash: computedHash || "placeholder_password_hash",
  }

  // Only include last_visit if provided and we'll handle errors gracefully
  if (patientData.lastVisit) {
    optionalPayload.last_visit = patientData.lastVisit
  }

  const minimalPayload: any = {
    email: patientData.email || dummyEmail,
    first_name: patientData.firstName,
    last_name: patientData.lastName,
    dob: patientData.dob,
    password_hash: computedHash || "placeholder_password_hash",
  }

  // First try with optional fields
  let insertResp = await supabase.from("patients").insert(optionalPayload).select().single()

  // Track which fields caused errors so we can exclude them
  const problematicFields = new Set<string>()

  // If unknown column errors (42703) or schema cache messages, progressively fallback
  if (insertResp.error) {
    const code = (insertResp.error as any).code || ""
    const msg = (insertResp.error as any).message || ""

    if (code === "42703" || /schema cache/i.test(msg) || /column/i.test(msg)) {
      // Identify which fields are causing problems
      const errorMsg = msg.toLowerCase()
      if (errorMsg.includes("medical_condition")) {
        problematicFields.add("medical_condition")
      }
      if (errorMsg.includes("last_visit")) {
        problematicFields.add("last_visit")
      }

      // Retry without problematic columns
      // Also check for medical_history errors
      if (errorMsg.includes("medical_history")) {
        problematicFields.add("medical_history")
      }
      
      const reducedPayload = { ...optionalPayload }
      problematicFields.forEach(field => {
        delete (reducedPayload as any)[field]
      })

      insertResp = await supabase.from("patients").insert(reducedPayload).select().single()

      if (insertResp.error) {
        const code2 = (insertResp.error as any).code || ""
        const msg2 = (insertResp.error as any).message || ""
        
        // Check for additional problematic fields
        if (msg2.toLowerCase().includes("medical_condition")) {
          problematicFields.add("medical_condition")
        }
        if (msg2.toLowerCase().includes("medical_history")) {
          problematicFields.add("medical_history")
        }
        if (msg2.toLowerCase().includes("last_visit")) {
          problematicFields.add("last_visit")
        }
        
        if (code2 === "42703" || /column/i.test(msg2)) {
          // Final fallback: keep all known base columns, exclude problematic ones
          const basePayload: any = {
            email: (optionalPayload as any).email,
            first_name: (optionalPayload as any).first_name,
            last_name: (optionalPayload as any).last_name,
            dob: (optionalPayload as any).dob,
            phone: (optionalPayload as any).phone ?? null,
            address: (optionalPayload as any).address ?? null,
            national_id: (optionalPayload as any).national_id ?? null,
            district: (optionalPayload as any).district ?? null,
            password_hash: (optionalPayload as any).password_hash,
          }
          
          // Only add medical_condition and medical_history if they weren't problematic
          if (!problematicFields.has("medical_condition") && (optionalPayload as any).medical_condition != null) {
            basePayload.medical_condition = (optionalPayload as any).medical_condition
          }
          if (!problematicFields.has("medical_history") && (optionalPayload as any).medical_history != null) {
            basePayload.medical_history = (optionalPayload as any).medical_history
          }
          // Don't add last_visit in final fallback if it was problematic

          insertResp = await supabase.from("patients").insert(basePayload).select().single()
        }
      } else {
        // Success on reduced payload - try to update medical fields separately if they were excluded
        if (insertResp.data && (optionalPayload as any).medical_condition != null) {
          const medicalValue = (optionalPayload as any).medical_condition
          const updateData: any = {}
          
          // Try to update medical_condition if it wasn't problematic
          if (!problematicFields.has("medical_condition")) {
            updateData.medical_condition = medicalValue
          }
          
          // Try to update medical_history if it wasn't problematic
          if (!problematicFields.has("medical_history")) {
            updateData.medical_history = medicalValue
          }
          
          // Update both fields if available
          if (Object.keys(updateData).length > 0) {
            try {
              await supabase
                .from("patients")
                .update(updateData)
                .eq("id", insertResp.data.id)
            } catch (updateErr) {
              // If update fails (column doesn't exist), that's okay - we tried
              console.warn("Could not update medical fields after insert:", updateErr)
            }
          }
        }
        // Note: We don't try to update last_visit as it's likely not in the schema
      }
    }
  }

  if (insertResp.error) {
    throw new Error(insertResp.error.message)
  }

  return convertPatientRow(insertResp.data)
}

// Intake Submissions API
export const getIntakeSubmissions = async (): Promise<IntakeSubmission[]> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  const { data, error } = await supabase
    .from("intake_submissions")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data?.map(convertIntakeRow)
}

export const getIntakeSubmissionById = async (id: string): Promise<IntakeSubmission | null> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  const { data, error } = await supabase.from("intake_submissions").select("*").eq("id", id).single()

  if (error) {
    return null
  }

  return convertIntakeRow(data)
}

export const createIntakeSubmission = async (
  submission: Omit<IntakeSubmission, "id" | "createdAt" | "updatedAt">,
): Promise<IntakeSubmission> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  const { data, error } = await supabase
    .from("intake_submissions")
    .insert({
      patient_id: submission.patientId,
      vhv_id: submission.vhvId,
      status: submission.status,
      payload: submission.payload,
      attachments: submission.attachments,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return convertIntakeRow(data)
}

export const updateIntakeSubmission = async (
  id: string,
  updates: Partial<IntakeSubmission>,
): Promise<IntakeSubmission> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  const { data, error } = await supabase
    .from("intake_submissions")
    .update({
      status: updates.status,
      payload: updates.payload,
      attachments: updates.attachments,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return convertIntakeRow(data)
}

// Review Actions API
export const approveIntake = async (submissionId: string, reviewerId: string, comment?: string): Promise<void> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  const { error: reviewError } = await supabase.from("review_actions").insert({
    submission_id: submissionId,
    reviewer_id: reviewerId,
    action: "APPROVE",
    comment: comment,
  })

  if (reviewError) {
    throw new Error(reviewError.message)
  }

  const { error: updateError } = await supabase
    .from("intake_submissions")
    .update({ status: "APPROVED" })
    .eq("id", submissionId)

  if (updateError) {
    throw new Error(updateError.message)
  }
}

export const requestChanges = async (submissionId: string, reviewerId: string, comment: string): Promise<void> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  const { error: reviewError } = await supabase.from("review_actions").insert({
    submission_id: submissionId,
    reviewer_id: reviewerId,
    action: "REQUEST_CHANGES",
    comment: comment,
  })

  if (reviewError) {
    throw new Error(reviewError.message)
  }

  const { error: updateError } = await supabase
    .from("intake_submissions")
    .update({ status: "CHANGES_REQUESTED" })
    .eq("id", submissionId)

  if (updateError) {
    throw new Error(updateError.message)
  }
}

export const rejectIntake = async (submissionId: string, reviewerId: string, comment?: string): Promise<void> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  const { error: reviewError } = await supabase.from("review_actions").insert({
    submission_id: submissionId,
    reviewer_id: reviewerId,
    action: "REJECT",
    comment: comment,
  })

  if (reviewError) {
    throw new Error(reviewError.message)
  }

  const { error: updateError } = await supabase
    .from("intake_submissions")
    .update({ status: "REJECTED" })
    .eq("id", submissionId)

  if (updateError) {
    throw new Error(updateError.message)
  }
}

// Tasks API
export const getTasks = async (): Promise<Task[]> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data?.map(convertTaskRow)
}

export const getTasksByVHV = async (vhvId: string): Promise<Task[]> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("vhv_id", vhvId)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data?.map(convertTaskRow)
}

export const getTasksByPatient = async (patientId: string): Promise<Task[]> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data?.map(convertTaskRow)
}

export const createTask = async (taskData: CreateTaskRequest): Promise<Task> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: taskData.title,
      description: taskData.description,
      patient_id: taskData.patientId || null,
      vhv_id: taskData.vhvId,
      doctor_id: taskData.doctorId,
      priority: taskData.priority,
      due_date: taskData.dueDate && taskData.dueDate.trim() !== "" ? taskData.dueDate : null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return convertTaskRow(data)
}

export const getTasksByDoctor = async (doctorId: string): Promise<Task[]> => {
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("doctor_id", doctorId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data?.map(convertTaskRow) || []
}

// Patient data API functions
export const getPatientAppointments = async (patientId: string): Promise<Appointment[]> => {
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", patientId)
    .order("scheduled_date", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data?.map(convertAppointmentRow) || []
}

export const getPatientVisits = async (patientId: string): Promise<Visit[]> => {
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from("visits")
    .select("*")
    .eq("patient_id", patientId)
    .order("visit_date", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data?.map(convertVisitRow) || []
}

export const getPatientMedications = async (patientId: string): Promise<Medication[]> => {
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from("medications")
    .select("*")
    .eq("patient_id", patientId)
    .order("start_date", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data?.map(convertMedicationRow) || []
}

export const getPatientVitalSigns = async (patientId: string): Promise<VitalSigns[]> => {
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from("vital_signs")
    .select("*")
    .eq("patient_id", patientId)
    .order("recorded_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data?.map(convertVitalSignsRow) || []
}

export const createRescheduleRequest = async (requestData: {
  appointmentId: string
  patientId: string
  requestedDate: string
  requestedTime: string
  reason?: string
  preferredAlternatives?: string
}): Promise<RescheduleRequest> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  // First check if a reschedule request already exists for this appointment
  const { data: existingRequest, error: checkError } = await supabase
    .from("reschedule_requests")
    .select("*")
    .eq("appointment_id", requestData.appointmentId)
    .eq("patient_id", requestData.patientId)
    .single()

  if (checkError && checkError.code !== "PGRST116") {
    // PGRST116 = no rows found
    throw new Error(checkError.message)
  }

  let result
  if (existingRequest) {
    // Update existing request
    const { data, error } = await supabase
      .from("reschedule_requests")
      .update({
        new_date: requestData.requestedDate,
        new_time: requestData.requestedTime,
        reason: requestData.reason,
        status: "approved", // Auto-approve for testing
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingRequest.id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }
    result = data
  } else {
    // Insert new request
    const { data, error } = await supabase
      .from("reschedule_requests")
      .insert({
        appointment_id: requestData.appointmentId,
        patient_id: requestData.patientId,
        new_date: requestData.requestedDate,
        new_time: requestData.requestedTime,
        reason: requestData.reason,
        status: "approved", // Auto-approve for testing
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }
    result = data
  }

  // Immediately update the appointment with the new date and time
  const { error: updateError } = await supabase
    .from("appointments")
    .update({
      scheduled_date: requestData.requestedDate,
      scheduled_time: requestData.requestedTime,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestData.appointmentId)

  if (updateError) {
    console.error("Failed to update appointment:", updateError.message)
    // Don't throw error here, just log it
  }

  return convertRescheduleRequestRow(result)
}

// Conversion functions
const convertAppointmentRow = (row: any): Appointment & { confirmedByPatient?: boolean } => {
  const toTimeHHmm = (t: any) => (typeof t === "string" ? t.slice(0, 5) : "")
  return {
    id: row.id,
    patientId: row.patient_id,
    providerId: row.doctor_id || row.provider_id, // Use doctor_id if available
    providerName: row.provider_name || "Dr. Provider", // Default provider name
    type: row.appointment_type || row.type || "Consultation", // Use appointment_type if available
    scheduledDate: row.scheduled_date,
    scheduledTime: toTimeHHmm(row.scheduled_time),
    location: row.location || "Medical Center", // Default location
    status: row.status as any,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    // Extra field used by patient UI to show confirmation badge
    confirmedByPatient: row.confirmed_by_patient === true,
  }
}

const convertVisitRow = (row: any): Visit => ({
  id: row.id,
  patientId: row.patient_id,
  providerId: row.provider_id,
  providerName: row.provider_name,
  visitDate: row.visit_date,
  diagnosis: row.diagnosis,
  treatment: row.treatment,
  notes: row.notes,
  status: row.status as any,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
})

const convertMedicationRow = (row: any): Medication => ({
  id: row.id,
  patientId: row.patient_id,
  name: row.name,
  dosage: row.dosage,
  frequency: row.frequency,
  duration: row.end_date
    ? `${Math.ceil((new Date(row.end_date).getTime() - new Date(row.start_date).getTime()) / (1000 * 60 * 60 * 24))} days`
    : "Ongoing",
  prescribedBy: row.prescribed_by,
  prescribedDate: row.start_date,
  remainingDays: row.end_date
    ? Math.max(0, Math.ceil((new Date(row.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 30,
  isActive: !row.end_date || new Date(row.end_date) > new Date(),
  notes: row.notes,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
})

const convertVitalSignsRow = (row: any): VitalSigns => ({
  id: row.id,
  patientId: row.patient_id,
  recordedDate: row.recorded_at
    ? new Date(row.recorded_at).toISOString().split("T")[0]
    : new Date(row.created_at).toISOString().split("T")[0],
  temperature: row.temperature,
  bloodPressureSystolic: row.blood_pressure_systolic,
  bloodPressureDiastolic: row.blood_pressure_diastolic,
  heartRate: row.heart_rate,
  weight: row.weight,
  height: row.height,
  notes: row.notes,
  recordedBy: row.recorded_by,
  createdAt: new Date(row.created_at),
})

const convertRescheduleRequestRow = (row: any): RescheduleRequest => ({
  id: row.id,
  appointmentId: row.appointment_id,
  patientId: row.patient_id,
  requestedDate: row.new_date,
  requestedTime: row.new_time,
  reason: row.reason,
  preferredAlternatives: row.preferred_alternatives || "", // Handle missing column
  status: row.status as any,
  reviewedBy: row.reviewed_by,
  reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
  createdAt: new Date(row.created_at),
})

export const updateTask = async (id: string, updateData: Partial<Task>): Promise<Task> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({
      title: updateData.title,
      description: updateData.description,
      priority: updateData.priority,
      status: updateData.status,
      due_date: updateData.dueDate ? updateData.dueDate.toISOString() : null,
      completed_at: updateData.completedAt ? updateData.completedAt.toISOString() : null,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return convertTaskRow(data)
}

export const completeTask = async (id: string, formData?: Record<string, any>): Promise<Task> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  const updateData: any = {
    status: "completed",
    completed_at: new Date().toISOString(),
  }

  // Add form_response if formData is provided
  if (formData) {
    updateData.form_response = formData
  }

  const { data, error } = await supabase.from("tasks").update(updateData).eq("id", id).select().single()

  if (error) {
    throw new Error(error.message)
  }

  return convertTaskRow(data)
}

export const reopenTask = async (id: string): Promise<Task> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({
      status: "pending",
      completed_at: null,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return convertTaskRow(data)
}

export const deleteTask = async (id: string): Promise<void> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  const { error } = await supabase.from("tasks").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }
}

export const getTaskById = async (id: string): Promise<Task> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }
  const { data, error } = await supabase.from("tasks").select("*").eq("id", id).single()
  if (error) {
    throw new Error(error.message)
  }
  return convertTaskRow(data as any)
}

// Assignments API
export const getAssignments = async (): Promise<Assignment[]> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  const { data, error } = await supabase.from("assignments").select("*").order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data?.map(convertAssignmentRow)
}

export const getAssignmentsWithDetails = async (doctorId: string) => {
  if (!supabase) {
    return []
  }

  // Fetch assignments with joined patient and VHV data in one round-trip
  const { data: joined, error: joinError } = await supabase
    .from("assignments")
    .select(`
      *,
      patients:patient_id (*),
      vhvs:vhv_id (*)
    `)
    .eq("doctor_id", doctorId)
    .order("created_at", { ascending: false })

  if (joinError) {
    throw new Error(joinError.message)
  }

  const assignments = joined || []
  if (assignments.length === 0) return []

  // Build OR filter for tasks by (patient_id, vhv_id) pairs to avoid N+1
  const pairs = assignments.map((a: any) => ({ p: a.patient_id, v: a.vhv_id }))
  const uniquePairs: Array<{ p: string; v: string }> = []
  const seen = new Set<string>()
  for (const pair of pairs) {
    const key = `${pair.p}|${pair.v}`
    if (!seen.has(key)) {
      seen.add(key)
      uniquePairs.push(pair)
    }
  }

  const tasksByKey = new Map<string, any[]>()
  if (uniquePairs.length > 0) {
    // Construct OR filter string like: and(patient_id.eq.X,vhv_id.eq.Y),and(...)
    const orClauses = uniquePairs.map(({ p, v }) => `and(patient_id.eq.${p},vhv_id.eq.${v})`).join(",")
    const { data: tasksData, error: tasksError } = await supabase.from("tasks").select("*").or(orClauses)

    if (!tasksError && tasksData) {
      for (const t of tasksData) {
        const key = `${t.patient_id}|${t.vhv_id}`
        if (!tasksByKey.has(key)) tasksByKey.set(key, [])
        tasksByKey.get(key)!.push(t)
      }
    }
  }

  // Map joined results into expected shape
  return assignments.map((a: any) => {
    const key = `${a.patient_id}|${a.vhv_id}`
    const tasks = (tasksByKey.get(key) || []).map(convertTaskRow)
    const patient = a.patients ? convertPatientRow(a.patients) : null
    const vhv = a.vhvs
      ? {
          id: a.vhvs.id,
          email: a.vhvs.email,
          passwordHash: "",
          role: "VHV" as any,
          firstName: a.vhvs.first_name,
          lastName: a.vhvs.last_name,
          name: `${a.vhvs.first_name} ${a.vhvs.last_name}`.trim(),
          district: a.vhvs.district || undefined,
          createdAt: new Date(a.vhvs.created_at),
          updatedAt: a.vhvs.updated_at ? new Date(a.vhvs.updated_at) : undefined,
        }
      : null

    return {
      ...convertAssignmentRow(a),
      patient,
      vhv,
      tasks,
    }
  })
}

export const getAssignmentsByVHV = async (vhvId: string) => {
  if (!supabase) {
    return []
  }

  const baseSelect = `
      *,
      patients:patient_id (
        id,
        first_name,
        last_name,
        email,
        phone,
        address,
        district,
        national_id,
        dob,
        is_active
      )
    `

  let assignments: any[] | null = null
  let assignmentsError: any = null

  const { data: withDistrict, error: withDistrictError } = await supabase
    .from("assignments")
    .select(baseSelect)
    .eq("vhv_id", vhvId)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (withDistrictError && withDistrictError.code === "42703") {
    console.warn("[v0] District column missing in patients table, falling back without district field.")
    const fallbackSelect = `
      *,
      patients:patient_id (
        id,
        user_id,
        patient_id,
        date_of_birth,
        gender,
        address,
        emergency_contact,
        emergency_phone
      )
    `
    const { data: withoutDistrict, error: fallbackError } = await supabase
      .from("assignments")
      .select(fallbackSelect)
      .eq("vhv_id", vhvId)
      .eq("status", "active")
      .order("created_at", { ascending: false })

    assignments = withoutDistrict
    assignmentsError = fallbackError
  } else {
    assignments = withDistrict
    assignmentsError = withDistrictError
  }

  if (assignmentsError) {
    throw new Error(assignmentsError.message)
  }

  if (!assignments || assignments.length === 0) {
    return []
  }

  // Get tasks and intakes for each assignment
  const enhancedAssignments = await Promise.all(
    assignments.map(async (assignment) => {
      // Get patient user details from auth.users
      const { data: userData } = await supabase!
        .from("users")
        .select("full_name, email, phone")
        .eq("id", assignment.patients.user_id)
        .single()

      // Get tasks for this assignment
      const { data: tasksData } = await supabase!
        .from("tasks")
        .select("*")
        .eq("patient_id", assignment.patient_id)
        .eq("vhv_id", assignment.vhv_id)

      // Get intake submissions for this patient
      const { data: intakesData } = await supabase!
        .from("intake_submissions")
        .select("*")
        .eq("patient_id", assignment.patient_id)
        .eq("vhv_id", assignment.vhv_id)
        .order("created_at", { ascending: false })

      // Split full_name into first and last name
      const fullName = userData?.full_name || ""
      const nameParts = fullName.split(" ")
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(" ") || ""

      return {
        ...convertAssignmentRow(assignment),
        patient: assignment.patients
          ? {
              id: assignment.patients.id,
              firstName: assignment.patients.first_name,
              lastName: assignment.patients.last_name,
              email: assignment.patients.email,
              phone: assignment.patients.phone,
              address: assignment.patients.address,
              district: assignment.patients.district,
              nationalId: assignment.patients.national_id,
              dob: assignment.patients.dob,
              isActive: assignment.patients.is_active,
              createdAt: new Date(),
              updatedAt: new Date(),
              intakeSubmissions:
                intakesData?.map((intake) => ({
                  id: intake.id,
                  patientId: intake.patient_id,
                  vhvId: intake.vhv_id,
                  status: intake.status,
                  payload: intake.payload,
                  attachments: intake.attachments,
                  createdAt: new Date(intake.created_at),
                  updatedAt: new Date(intake.updated_at),
                })) || [],
            }
          : null,
        tasks: tasksData?.map(convertTaskRow) || [],
      }
    }),
  )

  return enhancedAssignments
}

export const createIntake = async (patientId: string, vhvId?: string) => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  const { data, error } = await supabase
    .from("intake_submissions")
    .insert({
      patient_id: patientId,
      vhv_id: vhvId,
      status: "DRAFT",
      payload: {
        visitMeta: {
          visitDateTime: new Date().toISOString(),
          vhvId: vhvId || "",
          locationText: "",
        },
        patientBasics: {
          firstName: "",
          lastName: "",
          dob: "",
          contactPhone: "",
        },
      },
      attachments: [],
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return {
    id: data.id,
    patientId: data.patient_id,
    vhvId: data.vhv_id,
    status: data.status,
    payload: data.payload,
    attachments: data.attachments,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  }
}

export const getIntakes = async (patientId?: string, vhvId?: string) => {
  if (!supabase) {
    return []
  }

  let query = supabase.from("intake_submissions").select("*").order("created_at", { ascending: false })

  if (patientId) {
    query = query.eq("patient_id", patientId)
  }
  if (vhvId) {
    query = query.eq("vhv_id", vhvId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (
    data?.map((intake) => ({
      id: intake.id,
      patientId: intake.patient_id,
      vhvId: intake.vhv_id,
      status: intake.status,
      payload: intake.payload,
      attachments: intake.attachments,
      createdAt: new Date(intake.created_at),
      updatedAt: new Date(intake.updated_at),
    })) || []
  )
}

export const getIntakeById = async (id: string) => {
  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from("intake_submissions")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
    ? {
        id: data.id,
        patientId: data.patient_id,
        vhvId: data.vhv_id,
        status: data.status,
        payload: data.payload,
        attachments: data.attachments,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }
    : null
}

export const updateIntake = async (id: string, updateData: any) => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  // Build patch object only with provided fields to avoid wiping JSON with undefined/null
  const patch: any = { updated_at: new Date().toISOString() }
  if (typeof updateData.status !== 'undefined') patch.status = updateData.status
  if (typeof updateData.payload !== 'undefined') patch.payload = updateData.payload
  if (typeof updateData.attachments !== 'undefined') patch.attachments = updateData.attachments

  const { data, error } = await supabase
    .from("intake_submissions")
    .update(patch)
    .eq("id", id)
    .select()

  if (error) {
    throw new Error(error.message)
  }

  // Handle both single and multiple results
  const result = Array.isArray(data) ? data[0] : data

  if (!result) {
    throw new Error("No intake found with the given ID")
  }

  return {
    id: result.id,
    patientId: result.patient_id,
    vhvId: result.vhv_id,
    status: result.status,
    payload: result.payload,
    attachments: result.attachments,
    createdAt: new Date(result.created_at),
    updatedAt: new Date(result.updated_at),
  }
}

export const getReviewQueue = async (status?: string, from?: string) => {
  if (!supabase) {
    return []
  }

  // First get the intake submissions
  let query = supabase.from("intake_submissions").select("*").order("created_at", { ascending: false })

  if (status) {
    query = query.eq("status", status)
  } else {
    // Default to SUBMITTED status for pending reviews
    query = query.eq("status", "SUBMITTED")
  }

  const { data: intakes, error: intakesError } = await query

  if (intakesError) {
    throw new Error(intakesError.message)
  }

  if (!intakes || intakes.length === 0) {
    return []
  }

  // Get unique patient and VHV IDs
  const patientIds = [...new Set(intakes.map((i) => i.patient_id))]
  const vhvIds = [...new Set(intakes.map((i) => i.vhv_id))]

  // Fetch patients and VHVs separately
  const { data: patients, error: patientsError } = await supabase
    .from("patients")
    .select("id, first_name, last_name, email, phone, address, national_id, dob")
    .in("id", patientIds)

  const { data: vhvs, error: vhvsError } = await supabase
    .from("vhvs")
    .select("id, first_name, last_name, email")
    .in("id", vhvIds)

  if (patientsError) {
    console.error("Error fetching patients:", patientsError)
  }
  if (vhvsError) {
    console.error("Error fetching VHVs:", vhvsError)
  }

  // Create lookup maps
  const patientMap = new Map()
  const vhvMap = new Map()

  patients?.forEach((patient) => {
    patientMap.set(patient.id, patient)
  })

  vhvs?.forEach((vhv) => {
    vhvMap.set(vhv.id, vhv)
  })

  // Combine the data
  return intakes.map((intake) => ({
    id: intake.id,
    patientId: intake.patient_id,
    vhvId: intake.vhv_id,
    status: intake.status,
    payload: intake.payload,
    attachments: intake.attachments,
    createdAt: new Date(intake.created_at),
    updatedAt: new Date(intake.updated_at),
    patient: patientMap.get(intake.patient_id)
      ? {
          id: patientMap.get(intake.patient_id).id,
          firstName: patientMap.get(intake.patient_id).first_name,
          lastName: patientMap.get(intake.patient_id).last_name,
          email: patientMap.get(intake.patient_id).email,
          phone: patientMap.get(intake.patient_id).phone,
          address: patientMap.get(intake.patient_id).address,
          nationalId: patientMap.get(intake.patient_id).national_id,
          dob: patientMap.get(intake.patient_id).dob,
        }
      : null,
    vhv: vhvMap.get(intake.vhv_id)
      ? {
          id: vhvMap.get(intake.vhv_id).id,
          firstName: vhvMap.get(intake.vhv_id).first_name,
          lastName: vhvMap.get(intake.vhv_id).last_name,
          email: vhvMap.get(intake.vhv_id).email,
        }
      : null,
  }))
}

export const approveReview = async (id: string) => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  const { data, error } = await supabase
    .from("intake_submissions")
    .update({
      status: "APPROVED",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return {
    id: data.id,
    status: data.status,
    updatedAt: new Date(data.updated_at),
  }
}

export const requestChangesReview = async (id: string, comment: string) => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  const { data, error } = await supabase
    .from("intake_submissions")
    .update({
      status: "CHANGES_REQUESTED",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return {
    id: data.id,
    status: data.status,
    comment,
    updatedAt: new Date(data.updated_at),
  }
}

export const markReviewInProgress = async (id: string) => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  // Set status to IN_REVIEW (now allowed by DB constraint)
  const { data, error } = await supabase
    .from("intake_submissions")
    .update({
      status: "IN_REVIEW",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return {
    id: data.id,
    status: data.status,
    updatedAt: new Date(data.updated_at),
  }
}

export const assignPatient = async (assignmentData: AssignPatientRequest): Promise<Assignment> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  if (!assignmentData.doctorId) {
    throw new Error("Doctor ID is required for assignment")
  }

  // Use upsert to handle duplicate assignments gracefully
  const { data, error } = await supabase
    .from("assignments")
    .upsert(
      {
        patient_id: assignmentData.patientId,
        vhv_id: assignmentData.vhvId,
        doctor_id: assignmentData.doctorId,
        status: "active",
        assigned_at: new Date().toISOString(),
      },
      {
        onConflict: "patient_id,vhv_id",
        ignoreDuplicates: false,
      },
    )
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return convertAssignmentRow(data)
}

// Emergency Alerts API
export const getEmergencyAlerts = async (status?: string, priority?: string): Promise<EmergencyAlert[]> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  let query = supabase.from("emergency_alerts").select("*").order("created_at", { ascending: false })

  if (status) {
    query = query.eq("status", status)
  }
  if (priority) {
    query = query.eq("priority", priority)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return data?.map(convertEmergencyAlertRow) || []
}

export const getEmergencyAlertsByPatient = async (patientId: string): Promise<EmergencyAlert[]> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  const { data, error } = await supabase
    .from("emergency_alerts")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data?.map(convertEmergencyAlertRow) || []
}

export const getEmergencyAlertsByDoctor = async (doctorId: string, status?: string): Promise<EmergencyAlert[]> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  // First get all patients assigned to this doctor
  const { data: assignments, error: assignmentsError } = await supabase
    .from("assignments")
    .select("patient_id")
    .eq("doctor_id", doctorId)

  if (assignmentsError) {
    throw new Error(`Failed to get doctor assignments: ${assignmentsError.message}`)
  }

  const patientIds = assignments?.map((a) => a.patient_id) || []

  if (patientIds.length === 0) {
    return []
  }

  // Then get all emergency alerts for these patients
  let query = supabase
    .from("emergency_alerts")
    .select("*")
    .in("patient_id", patientIds)
    .order("created_at", { ascending: false })

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return data?.map(convertEmergencyAlertRow) || []
}

export const getEmergencyAlertsByVHV = async (vhvId: string, status?: string): Promise<EmergencyAlert[]> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  // First get all patients assigned to this VHV
  const { data: assignments, error: assignmentsError } = await supabase
    .from("assignments")
    .select("patient_id")
    .eq("vhv_id", vhvId)

  if (assignmentsError) {
    throw new Error(`Failed to get VHV assignments: ${assignmentsError.message}`)
  }

  const patientIds = assignments?.map((a) => a.patient_id) || []

  if (patientIds.length === 0) {
    return []
  }

  // Then get all emergency alerts for these patients
  let query = supabase
    .from("emergency_alerts")
    .select("*")
    .in("patient_id", patientIds)
    .order("created_at", { ascending: false })

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return data?.map(convertEmergencyAlertRow) || []
}

export const createEmergencyAlert = async (alertData: CreateEmergencyAlertRequest): Promise<EmergencyAlert> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  // Convert priority to lowercase to match database constraints
  const priorityMap: { [key: string]: string } = {
    CRITICAL: "high", // Map CRITICAL to high since database doesn't have critical
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low",
  }

  const dbPriority = priorityMap[alertData.priority] || alertData.priority.toLowerCase()

  // Find the doctor and VHV assigned to this patient
  let assignedDoctorId: string | null = null
  let assignedVHVId: string | null = null

  try {
    const { data: assignment, error: assignmentError } = await supabase
      .from("assignments")
      .select("doctor_id, vhv_id")
      .eq("patient_id", alertData.patientId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (!assignmentError && assignment) {
      assignedDoctorId = assignment.doctor_id
      assignedVHVId = assignment.vhv_id
      console.log(
        `[v0] Found assignment for patient ${alertData.patientId}: doctor=${assignedDoctorId}, vhv=${assignedVHVId}`,
      )
    } else {
      console.log(`[v0] No active assignment found for patient ${alertData.patientId}`)
    }
  } catch (error) {
    console.log(`[v0] Error finding assignment for patient ${alertData.patientId}:`, error)
  }

  const { data: patientRecord, error: patientError } = await supabase
    .from("patients")
    .select("id")
    .eq("id", alertData.patientId)
    .single()

  if (patientError || !patientRecord) {
    throw new Error("Patient not found. Please ensure the patient record exists before creating an emergency alert.")
  }

  const safeDescription =
    typeof alertData.description === "string" && alertData.description.trim()
      ? alertData.description.trim()
      : "No description provided."

  const safeLocation =
    typeof alertData.location === "string" && alertData.location.trim() ? alertData.location.trim() : null

  const { data, error } = await supabase
    .from("emergency_alerts")
    .insert({
      patient_id: alertData.patientId,
      doctor_id: assignedDoctorId,
      vhv_id: assignedVHVId,
      priority: dbPriority,
      status: "active", // Default status
      description: safeDescription,
      location: safeLocation,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return convertEmergencyAlertRow(data)
}

export const updateEmergencyAlert = async (
  id: string,
  updateData: UpdateEmergencyAlertRequest,
): Promise<EmergencyAlert> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  const { data, error } = await supabase
    .from("emergency_alerts")
    .update({
      priority: updateData.priority,
      status: updateData.status,
      description: updateData.description,
      location: updateData.location,
      doctor_id: updateData.assignedDoctorId,
      vhv_id: updateData.assignedVHVId,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return convertEmergencyAlertRow(data)
}

export const acknowledgeEmergencyAlert = async (id: string, responderId: string): Promise<EmergencyAlert> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  // Check if responderId is a doctor or VHV
  const { data: doctor, error: doctorError } = await supabase
    .from("doctors")
    .select("id")
    .eq("id", responderId)
    .single()

  const { data: vhv, error: vhvError } = await supabase.from("vhvs").select("id").eq("id", responderId).single()

  const updateData: any = {
    status: "acknowledged", // Use lowercase for database
    acknowledged_at: new Date().toISOString(),
  }

  if (doctor && !doctorError) {
    // Responder is a doctor
    updateData.doctor_id = responderId
  } else if (vhv && !vhvError) {
    // Responder is a VHV
    updateData.vhv_id = responderId
  } else {
    throw new Error("Invalid responder ID - not found in doctors or VHVs table")
  }

  const { data, error } = await supabase.from("emergency_alerts").update(updateData).eq("id", id).select().single()

  if (error) {
    throw new Error(error.message)
  }

  return convertEmergencyAlertRow(data)
}

export const resolveEmergencyAlert = async (
  id: string,
  responderId: string,
  notes?: string,
): Promise<EmergencyAlert> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  // Check if responderId is a doctor or VHV
  const { data: doctor, error: doctorError } = await supabase
    .from("doctors")
    .select("id")
    .eq("id", responderId)
    .single()

  const { data: vhv, error: vhvError } = await supabase.from("vhvs").select("id").eq("id", responderId).single()

  // First get the current alert to preserve description
  const { data: currentAlert } = await supabase.from("emergency_alerts").select("description").eq("id", id).single()

  const updateData: any = {
    status: "resolved", // Use lowercase for database
    resolved_at: new Date().toISOString(),
    description: notes ? `${currentAlert?.description || ""}\n\nResolution Notes: ${notes}` : currentAlert?.description,
  }

  if (doctor && !doctorError) {
    // Responder is a doctor
    updateData.doctor_id = responderId
  } else if (vhv && !vhvError) {
    // Responder is a VHV
    updateData.vhv_id = responderId
  } else {
    throw new Error("Invalid responder ID - not found in doctors or VHVs table")
  }

  const { data, error } = await supabase.from("emergency_alerts").update(updateData).eq("id", id).select().single()

  if (error) {
    throw new Error(error.message)
  }

  return convertEmergencyAlertRow(data)
}

export const cancelEmergencyAlert = async (id: string, reason?: string): Promise<EmergencyAlert> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  // First get the current alert to preserve description
  const { data: currentAlert } = await supabase.from("emergency_alerts").select("description").eq("id", id).single()

  const { data, error } = await supabase
    .from("emergency_alerts")
    .update({
      status: "cancelled", // Use lowercase for database
      description: reason
        ? `${currentAlert?.description || ""}\n\nCancellation Reason: ${reason}`
        : currentAlert?.description,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return convertEmergencyAlertRow(data)
}

export const getEmergencyStats = async (timeframe?: string) => {
  if (!supabase) {
    return {
      totalAlerts: 0,
      activeAlerts: 0,
      averageResponseTime: 0,
      alertsByPriority: { critical: 0, high: 0, medium: 0 },
    }
  }

  const { data, error } = await supabase.from("emergency_alerts").select("*")

  if (error) {
    throw new Error(error.message)
  }

  const alerts = data || []
  const activeAlerts = alerts.filter((alert) => alert.status === "ACTIVE").length
  const criticalAlerts = alerts.filter((alert) => alert.priority === "CRITICAL").length
  const highAlerts = alerts.filter((alert) => alert.priority === "HIGH").length
  const mediumAlerts = alerts.filter((alert) => alert.priority === "MEDIUM").length

  return {
    totalAlerts: alerts.length,
    activeAlerts,
    averageResponseTime: 0, // Would need to calculate from response times
    alertsByPriority: {
      critical: criticalAlerts,
      high: highAlerts,
      medium: mediumAlerts,
    },
  }
}

// Admin API - Note: These functions require server-side implementation
// For now, we'll provide placeholder implementations that throw errors
export const createDoctor = async (doctorData: CreateDoctorRequest): Promise<User> => {
  throw new Error(
    "createDoctor requires server-side implementation with service role key. Please create users manually in Supabase Dashboard.",
  )
}

export const createVHV = async (vhvData: CreateVHVRequest): Promise<User> => {
  throw new Error(
    "createVHV requires server-side implementation with service role key. Please create users manually in Supabase Dashboard.",
  )
}

// Get admins
export const getAdmins = async (): Promise<any[]> => {
  if (!supabase) {
    return []
  }

  try {
    const { data, error } = await supabase.from("admins").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Admins query error:", error)
      throw new Error(`Admins query failed: ${error.message}`)
    }

    return (
      data?.map((row) => ({
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        name: `${row.first_name} ${row.last_name}`,
        status: row.is_active ? "active" : "inactive",
        phone: row.phone,
        createdAt: new Date(row.created_at),
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
      })) || []
    )
  } catch (error) {
    console.error("Error fetching admins:", error)
    throw new Error("Failed to fetch admins")
  }
}

// Get doctors
export const getDoctors = async (): Promise<DoctorProfile[]> => {
  if (!supabase) {
    return []
  }

  try {
    const { data, error } = await supabase.from("doctors").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Doctors query error:", error)
      throw new Error(`Doctors query failed: ${error.message}`)
    }

    return data?.map(convertDoctorRow) || []
  } catch (error) {
    console.error("Error fetching doctors:", error)
    throw new Error("Failed to fetch doctors")
  }
}

// Get VHVs
export const getVHVs = async (): Promise<VHVProfile[]> => {
  if (!supabase) {
    return []
  }

  try {
    const { data, error } = await supabase.from("vhvs").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("VHVs query error:", error)
      throw new Error(`VHVs query failed: ${error.message}`)
    }

    return data?.map(convertVHVRow) || []
  } catch (error) {
    console.error("Error fetching VHVs:", error)
    throw new Error("Failed to fetch VHVs")
  }
}

export const getVHVProfile = async (vhvId: string): Promise<VHVProfile | null> => {
  if (!supabase) {
    return null
  }

  const { data, error } = await supabase.from("vhvs").select("*").eq("id", vhvId).single()

  if (error) {
    if ((error as any).code === "PGRST116") {
      return null
    }
    throw new Error(error.message)
  }

  return convertVHVRow(data)
}

export const updateVHVProfile = async (vhvId: string, updates: UpdateVHVProfileRequest): Promise<VHVProfile> => {
  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  const payload: Partial<VhvRow> = {}

  if (Object.prototype.hasOwnProperty.call(updates, "phone")) {
    const phoneValue = updates.phone ?? ""
    payload.phone = phoneValue && phoneValue.trim() !== "" ? phoneValue.trim() : null
  }

  if (Object.prototype.hasOwnProperty.call(updates, "district")) {
    const districtValue = updates.district ?? ""
    payload.district = districtValue && districtValue.trim() !== "" ? districtValue.trim() : null
  }

  if (Object.keys(payload).length === 0) {
    const current = await getVHVProfile(vhvId)
    if (!current) {
      throw new Error("VHV profile not found")
    }
    return current
  }

  const { data, error } = await supabase.from("vhvs").update(payload).eq("id", vhvId).select("*").single()

  if (error) {
    throw new Error(error.message)
  }

  return convertVHVRow(data)
}

// Get all users from all role tables (deprecated - use individual functions instead)
export const getUsers = async (): Promise<User[]> => {
  if (!supabase) {
    return []
  }

  try {
    console.log("Getting users from all role tables...")

    // Get users from all role tables
    const [adminsResult, doctorsResult, vhvsResult, patientsResult] = await Promise.all([
      supabase.from("admins").select("*").order("created_at", { ascending: false }),
      supabase.from("doctors").select("*").order("created_at", { ascending: false }),
      supabase.from("vhvs").select("*").order("created_at", { ascending: false }),
      supabase.from("patients").select("*").order("created_at", { ascending: false }),
    ])

    console.log("Query results:", {
      admins: { data: adminsResult.data?.length, error: adminsResult.error },
      doctors: { data: doctorsResult.data?.length, error: doctorsResult.error },
      vhvs: { data: vhvsResult.data?.length, error: vhvsResult.error },
      patients: { data: patientsResult.data?.length, error: patientsResult.error },
    })

    // Check for errors in any of the queries
    if (adminsResult.error) {
      console.error("Admins query error:", adminsResult.error)
      throw new Error(`Admins query failed: ${adminsResult.error.message}`)
    }
    if (doctorsResult.error) {
      console.error("Doctors query error:", doctorsResult.error)
      throw new Error(`Doctors query failed: ${doctorsResult.error.message}`)
    }
    if (vhvsResult.error) {
      console.error("VHVs query error:", vhvsResult.error)
      throw new Error(`VHVs query failed: ${vhvsResult.error.message}`)
    }
    if (patientsResult.error) {
      console.error("Patients query error:", patientsResult.error)
      throw new Error(`Patients query failed: ${patientsResult.error.message}`)
    }

    const allUsers: User[] = []

    // Convert each role type to User format with additional fields for display
    if (adminsResult.data) {
      allUsers.push(
        ...adminsResult.data.map((row) => ({
          id: row.id,
          email: row.email,
          passwordHash: "",
          role: "ADMIN" as any,
          firstName: row.first_name,
          lastName: row.last_name,
          name: `${row.first_name} ${row.last_name}`,
          status: row.is_active ? "active" : "inactive",
          createdAt: new Date(row.created_at),
          updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
        })),
      )
    }

    if (doctorsResult.data) {
      allUsers.push(
        ...doctorsResult.data.map((row) => {
          const doctor = convertDoctorRow(row)
          return {
            id: doctor.id,
            email: doctor.email,
            passwordHash: "",
            role: "DOCTOR" as any,
            firstName: doctor.firstName,
            lastName: doctor.lastName,
            name: doctor.name,
            status: doctor.status,
            licenseNumber: doctor.licenseNumber,
            specialization: doctor.specialization,
            district: doctor.district,
            phone: doctor.phone,
            createdAt: doctor.createdAt,
            updatedAt: doctor.updatedAt,
          }
        }),
      )
    }

    if (vhvsResult.data) {
      allUsers.push(
        ...vhvsResult.data.map((row) => {
          const vhv = convertVHVRow(row)
          return {
            id: vhv.id,
            email: vhv.email,
            passwordHash: "",
            role: "VHV" as any,
            firstName: vhv.firstName,
            lastName: vhv.lastName,
            name: vhv.name,
            status: vhv.status,
            licenseNumber: vhv.licenseNumber,
            specialization: vhv.specialization,
            createdAt: vhv.createdAt,
            updatedAt: vhv.updatedAt,
          }
        }),
      )
    }

    if (patientsResult.data) {
      allUsers.push(
        ...patientsResult.data.map((row) => ({
          id: row.id,
          email: row.email,
          passwordHash: "",
          role: "PATIENT" as any,
          firstName: row.first_name,
          lastName: row.last_name,
          name: `${row.first_name} ${row.last_name}`,
          status: row.is_active ? "active" : "inactive",
          nationalId: row.national_id,
          dob: row.dob,
          createdAt: new Date(row.created_at),
          updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
        })),
      )
    }

    return allUsers
  } catch (error) {
    console.error("Error fetching users:", error)
    throw new Error("Failed to fetch users")
  }
}

// Get available VHVs for task assignment
export const getAvailableVHVs = async (): Promise<User[]> => {
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from("vhvs")
    .select("*")
    .eq("is_active", true)
    .order("email", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (
    data?.map((row) => ({
      id: row.id,
      email: row.email,
      passwordHash: "",
      role: "VHV" as any,
      firstName: row.first_name,
      lastName: row.last_name,
      name: `${row.first_name} ${row.last_name}`.trim(),
      district: row.district || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    })) || []
  )
}

// Dashboard statistics
export const getDashboardStats = async () => {
  if (!supabase) {
    return {
      totalUsers: 0,
      totalDoctors: 0,
      totalVHVs: 0,
      totalPatients: 0,
      pendingReviews: 0,
    }
  }

  try {
    console.log("Getting dashboard stats from all tables...")

    // Get counts from all role tables
    const [adminsResult, doctorsResult, vhvsResult, patientsResult, tasksResult, alertsResult] = await Promise.all([
      supabase.from("admins").select("id", { count: "exact" }),
      supabase.from("doctors").select("id", { count: "exact" }),
      supabase.from("vhvs").select("id", { count: "exact" }),
      supabase.from("patients").select("id", { count: "exact" }),
      supabase.from("tasks").select("id", { count: "exact" }),
      supabase.from("emergency_alerts").select("id", { count: "exact" }),
    ])

    console.log("Stats query results:", {
      admins: { count: adminsResult.count, error: adminsResult.error },
      doctors: { count: doctorsResult.count, error: doctorsResult.error },
      vhvs: { count: vhvsResult.count, error: vhvsResult.error },
      patients: { count: patientsResult.count, error: patientsResult.error },
      tasks: { count: tasksResult.count, error: tasksResult.error },
      alerts: { count: alertsResult.count, error: alertsResult.error },
    })

    // Check for errors in any of the queries
    const errors = []
    if (adminsResult.error) errors.push(`Admins: ${adminsResult.error.message}`)
    if (doctorsResult.error) errors.push(`Doctors: ${doctorsResult.error.message}`)
    if (vhvsResult.error) errors.push(`VHVs: ${vhvsResult.error.message}`)
    if (patientsResult.error) errors.push(`Patients: ${patientsResult.error.message}`)
    if (tasksResult.error) errors.push(`Tasks: ${tasksResult.error.message}`)
    if (alertsResult.error) errors.push(`Alerts: ${alertsResult.error.message}`)

    if (errors.length > 0) {
      console.error("Stats query errors:", errors)
      throw new Error(`Stats queries failed: ${errors.join(", ")}`)
    }

    const totalAdmins = adminsResult.count || 0
    const totalDoctors = doctorsResult.count || 0
    const totalVHVs = vhvsResult.count || 0
    const totalPatients = patientsResult.count || 0
    const totalUsers = totalAdmins + totalDoctors + totalVHVs + totalPatients

    const stats = {
      totalUsers,
      totalDoctors,
      totalVHVs,
      totalPatients,
      totalTasks: tasksResult.count || 0,
      totalAlerts: alertsResult.count || 0,
      pendingReviews: 0, // Could be calculated from tasks with pending status
    }

    console.log("Dashboard stats calculated:", stats)
    return stats
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return {
      totalUsers: 0,
      totalDoctors: 0,
      totalVHVs: 0,
      totalPatients: 0,
      pendingReviews: 0,
    }
  }
}

const convertAreaTaskRow = (row: any) => ({
  id: row.id,
  title: row.title,
  description: row.description || "",
  doctorId: row.doctor_id,
  vhvId: row.vhv_id,
  district: row.district || undefined,
  priority: row.priority,
  status: row.status,
  dueDate: row.due_date ? new Date(row.due_date) : undefined,
  completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  createdAt: new Date(row.created_at),
  updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  formResponse: (row as any).form_response || undefined,
})

export const getAreaTasksByVHV = async (vhvId: string) => {
  if (!supabase) throw new Error("Supabase not configured")
  const { data, error } = await supabase
    .from("area_tasks")
    .select("*")
    .eq("vhv_id", vhvId)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map(convertAreaTaskRow)
}

export const getAreaTaskById = async (id: string) => {
  if (!supabase) throw new Error("Supabase not configured")
  const { data, error } = await supabase
    .from("area_tasks")
    .select("*")
    .eq("id", id)
    .single()
  if (error) throw new Error(error.message)
  return convertAreaTaskRow(data)
}

export const getAreaTasksByDoctor = async (doctorId: string) => {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("area_tasks")
    .select("*")
    .eq("doctor_id", doctorId)
    .order("created_at", { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map(convertAreaTaskRow)
}

export const createAreaTask = async (taskData: any) => {
  if (!supabase) throw new Error("Supabase not configured")
  const { data, error } = await supabase
    .from("area_tasks")
    .insert({
      title: taskData.title,
      description: taskData.description,
      doctor_id: taskData.doctorId,
      vhv_id: taskData.vhvId,
      district: taskData.district || taskData.areaDistrict || null,
      priority: taskData.priority,
      due_date: taskData.dueDate && `${taskData.dueDate}`.trim() !== "" ? taskData.dueDate : null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return convertAreaTaskRow(data)
}

export const updateAreaTask = async (id: string, updateData: any) => {
  if (!supabase) throw new Error("Supabase not configured")
  const { data, error } = await supabase
    .from("area_tasks")
    .update({
      title: updateData.title,
      description: updateData.description,
      priority: updateData.priority,
      status: updateData.status,
      due_date: updateData.dueDate ? new Date(updateData.dueDate).toISOString() : null,
      completed_at: updateData.completedAt ? new Date(updateData.completedAt).toISOString() : null,
    })
    .eq("id", id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return convertAreaTaskRow(data)
}

export const completeAreaTask = async (id: string, formData?: Record<string, any>) => {
  if (!supabase) throw new Error("Supabase not configured")

  const updateData: any = {
    status: "completed",
    completed_at: new Date().toISOString(),
  }

  // Add form_response if formData is provided
  if (formData) {
    updateData.form_response = formData
  }

  const { data, error } = await supabase.from("area_tasks").update(updateData).eq("id", id).select().single()

  if (error) throw new Error(error.message)
  return convertAreaTaskRow(data)
}

export const reopenAreaTask = async (id: string) => {
  if (!supabase) throw new Error("Supabase not configured")
  const { data, error } = await supabase
    .from("area_tasks")
    .update({ status: "pending", completed_at: null })
    .eq("id", id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return convertAreaTaskRow(data)
}

export const deleteAreaTask = async (id: string) => {
  if (!supabase) throw new Error("Supabase not configured")
  const { error } = await supabase.from("area_tasks").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

// Export all functions as supabaseApi object
export const supabaseApi = {
  // Authentication
  login,
  getCurrentUser,

  // Patient management
  getPatients,
  getPatientById,
  getPatientProfile,
  updatePatientProfile,
  createPatient,
  assignPatient,
  getAssignments,
  getAssignmentsWithDetails,
  getAssignmentsByVHV,

  // Intake management
  createIntake,
  getIntakes,
  getIntakeById,
  updateIntake,

  // Review management
  getReviewQueue,
  approveReview,
  requestChangesReview,
  markReviewInProgress,

  // Task management
  getTasks,
  getTasksByVHV,
  getTasksByPatient,
  getTasksByDoctor,
  createTask,
  updateTask,
  completeTask,
  reopenTask,
  deleteTask,
  getAreaTasksByVHV,
  getAreaTasksByDoctor,
  createAreaTask,
  updateAreaTask,
  completeAreaTask,
  reopenAreaTask,
  deleteAreaTask,

  // Emergency alerts
  createEmergencyAlert,
  getEmergencyAlerts,
  getEmergencyAlertsByPatient,
  getEmergencyAlertsByDoctor,
  getEmergencyAlertsByVHV,
  updateEmergencyAlert,
  acknowledgeEmergencyAlert,
  resolveEmergencyAlert,
  cancelEmergencyAlert,
  getEmergencyStats,

  // User management
  getUsers,
  getAdmins,
  getDoctors,
  getVHVs,
  getVHVProfile,
  updateVHVProfile,
  getAvailableVHVs,

  // Dashboard stats
  getDashboardStats,

  // Patient data
  getPatientAppointments,
  getPatientVisits,
  getPatientMedications,
  getPatientVitalSigns,
  createRescheduleRequest,

  // User creation (placeholder functions)
  createDoctor,
  createVHV,
}
