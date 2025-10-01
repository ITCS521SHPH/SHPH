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
  IN_REVIEW = "IN_REVIEW",
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

// Emergency alert types
export enum EmergencyStatus {
  ACTIVE = "ACTIVE",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  RESOLVED = "RESOLVED",
  CANCELLED = "CANCELLED",
}

export enum EmergencyPriority {
  CRITICAL = "CRITICAL",
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
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
  medicalCondition?: string
  lastVisit?: Date
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
  status: "pending" | "in_progress" | "completed" | "cancelled"
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

// Emergency alert interface
export interface EmergencyAlert extends BaseEntity {
  patientId: string
  patientName: string
  triggeredBy: string // patient user ID
  priority: EmergencyPriority
  status: EmergencyStatus
  description?: string
  location?: string
  assignedDoctorId?: string
  assignedVHVId?: string
  acknowledgedBy?: string
  acknowledgedAt?: Date
  resolvedBy?: string
  resolvedAt?: Date
  responseTime?: number // in minutes
}

// Emergency response interface
export interface EmergencyResponse extends BaseEntity {
  alertId: string
  responderId: string
  responderRole: UserRole
  responseType: "ACKNOWLEDGED" | "EN_ROUTE" | "ON_SCENE" | "RESOLVED"
  notes?: string
  estimatedArrival?: Date
}

// Emergency contact interface
export interface EmergencyContact extends BaseEntity {
  patientId: string
  name: string
  relationship: string
  phone: string
  isPrimary: boolean
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
  userId?: string
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
  email?: string
  password?: string
  medicalCondition?: string
  lastVisit?: string | null
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
  doctorId: string
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate?: string
}

export interface AssignPatientRequest {
  patientId: string
  vhvId: string
  doctorId?: string
  tasks?: CreateTaskRequest[]
}

// Emergency DTOs
export interface CreateEmergencyAlertRequest {
  patientId: string
  priority: EmergencyPriority
  description?: string
  location?: string
}

export interface UpdateEmergencyAlertRequest {
  status?: EmergencyStatus
  priority?: EmergencyPriority
  description?: string
  location?: string
  assignedDoctorId?: string
  assignedVHVId?: string
  acknowledgedBy?: string
  resolvedBy?: string
  notes?: string
}

export interface EmergencyStatsResponse {
  totalAlerts: number
  activeAlerts: number
  averageResponseTime: number
  alertsByPriority: {
    critical: number
    high: number
    medium: number
  }
}

// Patient-specific types
export interface Appointment {
  id: string
  patientId: string
  providerId: string
  providerName: string
  type: string
  scheduledDate: string
  scheduledTime: string
  location: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Visit {
  id: string
  patientId: string
  providerId: string
  providerName: string
  visitDate: string
  diagnosis?: string
  treatment?: string
  notes?: string
  status: 'completed' | 'in_progress' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

export interface Medication {
  id: string
  patientId: string
  name: string
  dosage: string
  frequency: string
  duration: string
  prescribedBy?: string
  prescribedDate: string
  remainingDays: number
  isActive: boolean
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface VitalSigns {
  id: string
  patientId: string
  recordedDate: string
  temperature?: number
  bloodPressureSystolic?: number
  bloodPressureDiastolic?: number
  heartRate?: number
  weight?: number
  height?: number
  notes?: string
  recordedBy?: string
  createdAt: Date
}

export interface RescheduleRequest {
  id: string
  appointmentId: string
  patientId: string
  requestedDate: string
  requestedTime: string
  reason?: string
  preferredAlternatives?: string
  status: 'pending' | 'approved' | 'rejected'
  reviewedBy?: string
  reviewedAt?: Date
  createdAt: Date
}

// Notification interface
export interface Notification extends BaseEntity {
  userId: string
  userRole: UserRole
  title: string
  message: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
  entityType?: 'INTAKE' | 'TASK' | 'EMERGENCY' | 'APPOINTMENT'
  entityId?: string
  readAt?: Date
}

// Audit log interface  
export interface AuditLog extends BaseEntity {
  userId: string
  userRole: UserRole
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'APPROVE' | 'REJECT' | 'RESOLVE'
  entityType: 'PATIENT' | 'TASK' | 'INTAKE' | 'EMERGENCY' | 'APPOINTMENT' | 'ASSIGNMENT' | 'NOTIFICATION'
  entityId: string
  beforeSnapshot?: any
  afterSnapshot?: any
  description?: string
  ipAddress?: string
  userAgent?: string
}

// Enhanced IntakeSubmission interface
export interface EnhancedIntakeSubmission extends IntakeSubmission {
  vhvValidated: boolean
  doctorNotes?: string
  statusChangedAt: Date
}
