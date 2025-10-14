// Local types to replace @healthcare/shared-types dependency
// This avoids browser loading issues with the package

// User roles
export enum UserRole {
  ADMIN = "ADMIN",
  DOCTOR = "DOCTOR",
  VHV = "VHV",
  PATIENT = "PATIENT",
}

// Health worker types
export enum HealthWorkerType {
  DOCTOR = "DOCTOR",
  VHV = "VHV",
}

// Intake submission status
export enum IntakeStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  APPROVED = "APPROVED",
  CHANGES_REQUESTED = "CHANGES_REQUESTED",
  REJECTED = "REJECTED",
}

// Review actions
export enum ReviewActionType {
  APPROVE = "APPROVE",
  REQUEST_CHANGES = "REQUEST_CHANGES",
  REJECT = "REJECT",
}

// Chronic conditions enum
export enum ChronicCondition {
  DIABETES = "DIABETES",
  HYPERTENSION = "HYPERTENSION",
  HEART_DISEASE = "HEART_DISEASE",
  ASTHMA = "ASTHMA",
  COPD = "COPD",
  ARTHRITIS = "ARTHRITIS",
  CANCER = "CANCER",
  KIDNEY_DISEASE = "KIDNEY_DISEASE",
  OTHER = "OTHER",
}

// Base entity interface
export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt?: Date
}

// User interface
export interface User extends BaseEntity {
  email: string
  passwordHash: string
  role: UserRole
}

// Patient interface
export interface Patient extends BaseEntity {
  userId?: string
  nationalId?: string
  firstName: string
  lastName: string
  dob: Date
  phone?: string
  address?: string
}

// Health worker interface
export interface HealthWorker extends BaseEntity {
  userId: string
  type: HealthWorkerType
  licenseNumber?: string
}

// Task interface for VHV assignments
export interface Task extends BaseEntity {
  title: string
  description: string
  patientId: string
  vhvId: string
  doctorId: string
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  dueDate?: Date
  completedAt?: Date
}

// Enhanced Assignment interface with task support
export interface Assignment extends BaseEntity {
  patientId: string
  vhvId: string
  doctorId: string
  status: "ACTIVE" | "COMPLETED" | "CANCELLED"
  assignedAt: Date
  tasks?: Task[]
}

// Visit meta interface
export interface VisitMeta {
  visitDateTime: string
  vhvId: string
  locationText?: string
}

// Patient basics interface
export interface PatientBasics {
  firstName: string
  lastName: string
  dob: string
  contactPhone?: string
}

// Symptoms interface
export interface Symptoms {
  chiefComplaint: string
  checklist: boolean[]
  onsetDays?: number
}

// Vitals interface
export interface Vitals {
  temp?: number
  systolic?: number
  diastolic?: number
  hr?: number
}

// Chronic conditions interface
export interface ChronicConditions {
  list: {
    condition: ChronicCondition
    freeText?: string
  }[]
}

// Risk flags interface
export interface RiskFlags {
  isAge60Plus: boolean
  isPregnant?: boolean
  hasChronic?: boolean
}

// Consent interface
export interface Consent {
  consentGiven: boolean
}

// Intake payload interface
export interface IntakePayload {
  visitMeta: VisitMeta
  patientBasics: PatientBasics
  symptoms: Symptoms
  vitals: Vitals
  chronicConditions: ChronicConditions
  riskFlags: RiskFlags
  consent: Consent
}

// Intake submission interface
export interface IntakeSubmission extends BaseEntity {
  patientId: string
  vhvId: string
  status: IntakeStatus
  payload: IntakePayload
  attachments: string[]
}

// Review action interface
export interface ReviewActionEntity extends BaseEntity {
  submissionId: string
  reviewerId: string
  action: ReviewActionType
  comment?: string
}

// DTOs for API requests/responses
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  role: UserRole
}

export interface RefreshRequest {
  refreshToken: string
}

export interface CreatePatient {
  nationalId?: string
  firstName: string
  lastName: string
  dob: string
  phone?: string
  address?: string
}

export interface ReviewComment {
  comment: string
}

export interface CreateDoctorRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  licenseNumber?: string
  specialization?: string
  hospitalAffiliation?: string
}

export interface CreateVHVRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  region: string
  phoneNumber?: string
  trainingLevel?: string
}

// DTOs for task management
export interface CreateTaskRequest {
  title: string
  description: string
  patientId: string
  vhvId: string
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate?: string
}

export interface AssignPatientRequest {
  patientId: string
  vhvId: string
  tasks?: CreateTaskRequest[]
}
