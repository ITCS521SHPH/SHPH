export interface Patient {
  id: string
  // Personal Information
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: "male" | "female" | "other"
  phoneNumber: string
  email?: string
  address: string
  emergencyContact: {
    name: string
    relationship: string
    phoneNumber: string
  }

  // Medical Information
  bloodType?: string
  allergies: string[]
  chronicConditions: string[]
  currentMedications: string[]

  // System Information
  patientId: string // Unique patient identifier
  registrationDate: string
  lastVisit?: string
  assignedDoctor?: string
  assignedCaregiver?: string
  assignedVHV?: string

  // Risk Assessment
  riskLevel: "low" | "medium" | "high"
  priority: boolean

  // Location Information
  district?: string
  village?: string
  householdId?: string
}

export interface MedicalHistory {
  id: string
  patientId: string
  date: string
  type: "visit" | "treatment" | "diagnosis" | "prescription" | "test_result"
  title: string
  description: string
  doctorId: string
  doctorName: string
  attachments?: string[]
  followUpRequired?: boolean
  followUpDate?: string
}

export interface Appointment {
  id: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  date: string
  time: string
  type: "consultation" | "follow_up" | "emergency" | "routine_check"
  status: "scheduled" | "completed" | "cancelled" | "no_show"
  notes?: string
  priority: "low" | "medium" | "high"
}

export interface Treatment {
  id: string
  patientId: string
  doctorId: string
  date: string
  diagnosis: string
  treatment: string
  medications: {
    name: string
    dosage: string
    frequency: string
    duration: string
  }[]
  instructions: string
  followUpRequired: boolean
  followUpDate?: string
  status: "active" | "completed" | "discontinued"
}
