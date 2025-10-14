import {
  UserRole,
  IntakeStatus,
  ChronicCondition,
  HealthWorkerType,
  type User,
  type Patient,
  type IntakeSubmission,
  type HealthWorker,
  type Assignment,
  type Task, // Added Task import
} from "./types" // Demo users for each role
export const demoUsers: User[] = [
  {
    id: "1",
    email: "admin@demo.com",
    passwordHash: "admin123", // Plain text for demo - would be hashed in real app
    role: UserRole.ADMIN,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "2",
    email: "doctor@demo.com",
    passwordHash: "doctor123",
    role: UserRole.DOCTOR,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "3",
    email: "vhv@demo.com",
    passwordHash: "vhv123",
    role: UserRole.VHV,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "4",
    email: "patient@demo.com",
    passwordHash: "patient123",
    role: UserRole.PATIENT,
    createdAt: new Date("2024-01-01"),
  },
  // Additional users for more realistic demo
  {
    id: "5",
    email: "dr.smith@demo.com",
    passwordHash: "smith123",
    role: UserRole.DOCTOR,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "6",
    email: "vhv.jane@demo.com",
    passwordHash: "jane123",
    role: UserRole.VHV,
    createdAt: new Date("2024-01-20"),
  },
]

// Demo health workers
export const demoHealthWorkers: HealthWorker[] = [
  {
    id: "hw1",
    userId: "2",
    type: HealthWorkerType.DOCTOR,
    licenseNumber: "MD-12345",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "hw2",
    userId: "3",
    type: HealthWorkerType.VHV,
    licenseNumber: "VHV-67890",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "hw3",
    userId: "5",
    type: HealthWorkerType.DOCTOR,
    licenseNumber: "MD-54321",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "hw4",
    userId: "6",
    type: HealthWorkerType.VHV,
    licenseNumber: "VHV-09876",
    createdAt: new Date("2024-01-20"),
  },
]

// Demo patients
export const demoPatients: Patient[] = [
  {
    id: "p1",
    userId: "4",
    nationalId: "NAT001",
    firstName: "John",
    lastName: "Doe",
    dob: new Date("1980-05-15"),
    phone: "+1234567890",
    address: "123 Main St, City, Country",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "p2",
    nationalId: "NAT002",
    firstName: "Jane",
    lastName: "Smith",
    dob: new Date("1975-08-22"),
    phone: "+1234567891",
    address: "456 Oak Ave, City, Country",
    createdAt: new Date("2024-01-10"),
  },
  {
    id: "p3",
    nationalId: "NAT003",
    firstName: "Bob",
    lastName: "Johnson",
    dob: new Date("1990-12-03"),
    phone: "+1234567892",
    address: "789 Pine Rd, City, Country",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "p4",
    nationalId: "NAT004",
    firstName: "Alice",
    lastName: "Brown",
    dob: new Date("1965-03-18"),
    phone: "+1234567893",
    address: "321 Elm St, City, Country",
    createdAt: new Date("2024-01-20"),
  },
  {
    id: "p5",
    nationalId: "NAT005",
    firstName: "Charlie",
    lastName: "Wilson",
    dob: new Date("1988-07-09"),
    phone: "+1234567894",
    address: "654 Maple Ave, City, Country",
    createdAt: new Date("2024-01-25"),
  },
]

// Demo assignments (VHV to patients)
export const demoAssignments: Assignment[] = [
  {
    id: "a1",
    patientId: "p1",
    vhvId: "3", // VHV user ID
    doctorId: "2", // Doctor user ID
    status: "ACTIVE",
    assignedAt: new Date("2024-01-01"),
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "a2",
    patientId: "p2",
    vhvId: "3",
    doctorId: "2",
    status: "ACTIVE",
    assignedAt: new Date("2024-01-10"),
    createdAt: new Date("2024-01-10"),
  },
  {
    id: "a3",
    patientId: "p3",
    vhvId: "6", // Second VHV user ID
    doctorId: "5", // Second doctor user ID
    status: "ACTIVE",
    assignedAt: new Date("2024-01-15"),
    createdAt: new Date("2024-01-15"),
  },
]

// Demo intake submissions
export const demoIntakeSubmissions: IntakeSubmission[] = [
  {
    id: "i1",
    patientId: "p1",
    vhvId: "3",
    status: IntakeStatus.SUBMITTED,
    payload: {
      visitMeta: {
        visitDateTime: "2024-09-27T10:00:00Z",
        vhvId: "3",
        locationText: "Patient Home",
      },
      patientBasics: {
        firstName: "John",
        lastName: "Doe",
        dob: "1980-05-15",
        contactPhone: "+1234567890",
      },
      symptoms: {
        chiefComplaint: "Persistent cough and fever",
        checklist: [true, false, true, false, false],
        onsetDays: 3,
      },
      vitals: {
        temp: 38.5,
        systolic: 140,
        diastolic: 90,
        hr: 85,
      },
      chronicConditions: {
        list: [
          {
            condition: ChronicCondition.DIABETES,
            freeText: "Type 2 diabetes, well controlled",
          },
        ],
      },
      riskFlags: {
        isAge60Plus: false,
        isPregnant: false,
        hasChronic: true,
      },
      consent: {
        consentGiven: true,
      },
    },
    attachments: [],
    createdAt: new Date("2024-09-27T10:30:00Z"),
  },
  {
    id: "i2",
    patientId: "p2",
    vhvId: "3",
    status: IntakeStatus.APPROVED,
    payload: {
      visitMeta: {
        visitDateTime: "2024-09-26T14:00:00Z",
        vhvId: "3",
        locationText: "Community Health Center",
      },
      patientBasics: {
        firstName: "Jane",
        lastName: "Smith",
        dob: "1975-08-22",
        contactPhone: "+1234567891",
      },
      symptoms: {
        chiefComplaint: "Chest pain and shortness of breath",
        checklist: [false, true, false, true, true],
        onsetDays: 1,
      },
      vitals: {
        temp: 37.2,
        systolic: 160,
        diastolic: 95,
        hr: 95,
      },
      chronicConditions: {
        list: [
          {
            condition: ChronicCondition.HYPERTENSION,
            freeText: "Hypertension diagnosed 5 years ago",
          },
        ],
      },
      riskFlags: {
        isAge60Plus: false,
        isPregnant: false,
        hasChronic: true,
      },
      consent: {
        consentGiven: true,
      },
    },
    attachments: [],
    createdAt: new Date("2024-09-26T14:30:00Z"),
  },
  {
    id: "i3",
    patientId: "p3",
    vhvId: "6",
    status: IntakeStatus.CHANGES_REQUESTED,
    payload: {
      visitMeta: {
        visitDateTime: "2024-09-25T09:00:00Z",
        vhvId: "6",
        locationText: "Village Health Post",
      },
      patientBasics: {
        firstName: "Bob",
        lastName: "Johnson",
        dob: "1990-12-03",
        contactPhone: "+1234567892",
      },
      symptoms: {
        chiefComplaint: "Severe headache and dizziness",
        checklist: [true, true, false, false, true],
        onsetDays: 2,
      },
      vitals: {
        temp: 36.8,
        systolic: 120,
        diastolic: 80,
        hr: 70,
      },
      chronicConditions: {
        list: [],
      },
      riskFlags: {
        isAge60Plus: false,
        isPregnant: false,
        hasChronic: false,
      },
      consent: {
        consentGiven: true,
      },
    },
    attachments: [],
    createdAt: new Date("2024-09-25T09:30:00Z"),
  },
  {
    id: "i4",
    patientId: "p4",
    vhvId: "3",
    status: IntakeStatus.DRAFT,
    payload: {
      visitMeta: {
        visitDateTime: "2024-09-27T16:00:00Z",
        vhvId: "3",
        locationText: "Patient Home",
      },
      patientBasics: {
        firstName: "Alice",
        lastName: "Brown",
        dob: "1965-03-18",
        contactPhone: "+1234567893",
      },
      symptoms: {
        chiefComplaint: "Joint pain and stiffness",
        checklist: [false, false, true, true, false],
        onsetDays: 14,
      },
      vitals: {
        temp: 37.0,
        systolic: 130,
        diastolic: 85,
        hr: 75,
      },
      chronicConditions: {
        list: [
          {
            condition: ChronicCondition.ARTHRITIS,
            freeText: "Rheumatoid arthritis, on medication",
          },
        ],
      },
      riskFlags: {
        isAge60Plus: true,
        isPregnant: false,
        hasChronic: true,
      },
      consent: {
        consentGiven: true,
      },
    },
    attachments: [],
    createdAt: new Date("2024-09-27T16:30:00Z"),
  },
]

// Dashboard statistics for admin
export const demoDashboardStats = {
  totalPatients: demoPatients.length,
  totalSubmissions: demoIntakeSubmissions.length,
  pendingReviews: demoIntakeSubmissions.filter((s) => s.status === IntakeStatus.SUBMITTED).length,
  totalDoctors: demoHealthWorkers.filter((hw) => hw.type === HealthWorkerType.DOCTOR).length,
  totalVHVs: demoHealthWorkers.filter((hw) => hw.type === HealthWorkerType.VHV).length,
  recentActivity: [
    {
      id: "1",
      message: "New intake submitted by VHV Jane",
      timestamp: new Date("2024-09-27T10:30:00Z"),
    },
    {
      id: "2",
      message: "Intake approved by Dr. Smith",
      timestamp: new Date("2024-09-26T15:00:00Z"),
    },
    {
      id: "3",
      message: "Changes requested for patient Bob Johnson",
      timestamp: new Date("2024-09-25T11:00:00Z"),
    },
  ],
}

// Helper functions for demo data lookup
export const getUserById = (id: string): User | undefined => demoUsers.find((user) => user.id === id)

export const getUserByEmail = (email: string): User | undefined => demoUsers.find((user) => user.email === email)

export const getPatientById = (id: string): Patient | undefined => demoPatients.find((patient) => patient.id === id)

export const getHealthWorkerByUserId = (userId: string): HealthWorker | undefined =>
  demoHealthWorkers.find((hw) => hw.userId === userId)

export const getIntakeSubmissionById = (id: string): IntakeSubmission | undefined =>
  demoIntakeSubmissions.find((intake) => intake.id === id)

// Helper function to validate login credentials
export const validateCredentials = (email: string, password: string): User | null => {
  const user = getUserByEmail(email)
  if (user && user.passwordHash === password) {
    return user
  }
  return null
}

// Get all intakes for review queue
export const getIntakesForReview = (status?: IntakeStatus): IntakeSubmission[] => {
  if (status) {
    return demoIntakeSubmissions.filter((intake) => intake.status === status)
  }
  return demoIntakeSubmissions.filter(
    (intake) => intake.status === IntakeStatus.SUBMITTED || intake.status === IntakeStatus.CHANGES_REQUESTED,
  )
}

// Get intakes by VHV
export const getIntakesByVHV = (vhvId: string): IntakeSubmission[] =>
  demoIntakeSubmissions.filter((intake) => intake.vhvId === vhvId)

// Get intakes by Doctor
export const getIntakesByDoctor = (doctorId: string): IntakeSubmission[] =>
  demoIntakeSubmissions.filter((intake) => intake.doctorId === doctorId)

// Get patients assigned to VHV
export const getPatientsByVHV = (vhvId: string): (Patient & { assignment?: Assignment; tasks?: Task[] })[] => {
  const assignments = demoAssignments.filter((assignment) => assignment.vhvId === vhvId)

  return assignments
    .map((assignment) => {
      const patient = demoPatients.find((p) => p.id === assignment.patientId)
      const tasks = demoTasks.filter((t) => t.patientId === assignment.patientId && t.vhvId === vhvId)

      return {
        ...patient!,
        assignment,
        tasks,
      }
    })
    .filter((p) => p.id) // Filter out any undefined patients
}

// Get patients assigned to Doctor
export const getPatientsByDoctor = (doctorId: string): (Patient & { assignment?: Assignment; tasks?: Task[] })[] => {
  const assignments = demoAssignments.filter((assignment) => assignment.doctorId === doctorId)

  return assignments
    .map((assignment) => {
      const patient = demoPatients.find((p) => p.id === assignment.patientId)
      const tasks = demoTasks.filter((t) => t.patientId === assignment.patientId && t.doctorId === doctorId)

      return {
        ...patient!,
        assignment,
        tasks,
      }
    })
    .filter((p) => p.id) // Filter out any undefined patients
}

// Get assignments by Doctor
export const getAssignmentsByDoctor = (doctorId: string): Assignment[] => {
  return demoAssignments.filter((assignment) => assignment.doctorId === doctorId)
}

// Demo tasks for VHV assignments
export const demoTasks: Task[] = [
  {
    id: "t1",
    title: "Initial Health Assessment",
    description: "Conduct comprehensive health assessment and collect vital signs",
    patientId: "p1",
    vhvId: "3",
    doctorId: "2",
    priority: "HIGH",
    status: "PENDING",
    dueDate: new Date("2024-09-30"),
    createdAt: new Date("2024-09-27"),
  },
  {
    id: "t2",
    title: "Follow-up Visit",
    description: "Check on patient progress and medication compliance",
    patientId: "p1",
    vhvId: "3",
    doctorId: "2",
    priority: "MEDIUM",
    status: "COMPLETED",
    dueDate: new Date("2024-09-28"),
    completedAt: new Date("2024-09-28"),
    createdAt: new Date("2024-09-25"),
  },
  {
    id: "t3",
    title: "Blood Pressure Monitoring",
    description: "Monitor blood pressure and record readings",
    patientId: "p2",
    vhvId: "3",
    doctorId: "2",
    priority: "HIGH",
    status: "IN_PROGRESS",
    dueDate: new Date("2024-09-29"),
    createdAt: new Date("2024-09-26"),
  },
  {
    id: "t4",
    title: "Medication Review",
    description: "Review current medications and check for side effects",
    patientId: "p3",
    vhvId: "6",
    doctorId: "5",
    priority: "MEDIUM",
    status: "PENDING",
    dueDate: new Date("2024-10-01"),
    createdAt: new Date("2024-09-27"),
  },
]

export const getTasksByVHV = (vhvId: string): Task[] => demoTasks.filter((task) => task.vhvId === vhvId)

export const getTasksByPatient = (patientId: string): Task[] => demoTasks.filter((task) => task.patientId === patientId)

export const getTasksByDoctor = (doctorId: string): Task[] => demoTasks.filter((task) => task.doctorId === doctorId)
