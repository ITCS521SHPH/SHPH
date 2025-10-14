import {
  type LoginRequest,
  type LoginResponse,
  type CreatePatient,
  type Patient,
  type IntakeSubmission,
  UserRole,
} from "./types"
import {
  demoUsers,
  demoPatients,
  demoIntakeSubmissions,
  demoDashboardStats,
  demoAssignments, // Added assignments import
  demoTasks, // Added tasks import
  validateCredentials,
  getUserById,
  getPatientById,
  getIntakeSubmissionById,
  getIntakesForReview,
  getTasksByVHV, // Added task helper imports
  getTasksByPatient,
  getAssignmentsByDoctor,
} from "./mock-data"

// Simulated API delays
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

// Mock token storage
let currentMockTokens: { accessToken: string; refreshToken: string } | null = null
let currentMockUser: any = null

// Generate mock tokens
const generateMockTokens = (userId: string) => ({
  accessToken: `mock_access_token_${userId}_${Date.now()}`,
  refreshToken: `mock_refresh_token_${userId}_${Date.now()}`,
})

// Mock Authentication API
export const mockAuthApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    await delay()

    const user = validateCredentials(credentials.email, credentials.password)
    if (!user) {
      throw new Error("Invalid credentials")
    }

    const tokens = generateMockTokens(user.id)
    currentMockTokens = tokens
    currentMockUser = user

    // Store tokens in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", tokens.accessToken)
      localStorage.setItem("refreshToken", tokens.refreshToken)
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.email, // Use email as name for now
          role: user.role,
        }),
      )
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      role: user.role,
    }
  },

  logout: async () => {
    await delay(100)
    currentMockTokens = null
    currentMockUser = null

    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      localStorage.removeItem("currentUser")
    }
  },

  getCurrentUser: async () => {
    await delay()

    if (!currentMockUser) {
      // Try to restore from localStorage
      if (typeof window !== "undefined") {
        const storedUser = localStorage.getItem("currentUser")
        if (storedUser) {
          currentMockUser = JSON.parse(storedUser)
          return currentMockUser
        }
      }
      throw new Error("No authenticated user")
    }

    return currentMockUser
  },
}

// Mock Patients API
export const mockPatientsApi = {
  getAll: async (): Promise<Patient[]> => {
    await delay()
    return [...demoPatients]
  },

  getById: async (id: string): Promise<Patient> => {
    await delay()
    const patient = getPatientById(id)
    if (!patient) {
      throw new Error("Patient not found")
    }
    return patient
  },

  create: async (patientData: CreatePatient): Promise<Patient> => {
    await delay()

    const newPatient: Patient = {
      id: `p${Date.now()}`,
      nationalId: patientData.nationalId,
      firstName: patientData.firstName,
      lastName: patientData.lastName,
      dob: new Date(patientData.dob),
      phone: patientData.phone,
      address: patientData.address,
      createdAt: new Date(),
    }

    demoPatients.push(newPatient)
    return newPatient
  },

  update: async (id: string, updateData: Partial<CreatePatient>): Promise<Patient> => {
    await delay()

    const patientIndex = demoPatients.findIndex((p) => p.id === id)
    if (patientIndex === -1) {
      throw new Error("Patient not found")
    }

    const updatedPatient = {
      ...demoPatients[patientIndex],
      ...updateData,
      dob: updateData.dob ? new Date(updateData.dob) : demoPatients[patientIndex].dob,
      updatedAt: new Date(),
    }

    demoPatients[patientIndex] = updatedPatient
    return updatedPatient
  },

  assignVHV: async (patientId: string, vhvId: string, tasks?: any[]) => {
    await delay()

    // Create or update assignment
    const existingAssignmentIndex = demoAssignments.findIndex((a) => a.patientId === patientId)

    const assignment = {
      id: existingAssignmentIndex >= 0 ? demoAssignments[existingAssignmentIndex].id : `a${Date.now()}`,
      patientId,
      vhvId,
      doctorId: currentMockUser?.id || "2", // Current doctor
      status: "ACTIVE" as const,
      assignedAt: new Date(),
      createdAt: existingAssignmentIndex >= 0 ? demoAssignments[existingAssignmentIndex].createdAt : new Date(),
    }

    if (existingAssignmentIndex >= 0) {
      demoAssignments[existingAssignmentIndex] = assignment
    } else {
      demoAssignments.push(assignment)
    }

    // Create tasks if provided
    if (tasks && tasks.length > 0) {
      tasks.forEach((taskData) => {
        const newTask = {
          id: `t${Date.now()}_${Math.random()}`,
          title: taskData.title,
          description: taskData.description,
          patientId,
          vhvId,
          doctorId: currentMockUser?.id || "2",
          priority: taskData.priority,
          status: "PENDING" as const,
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
          createdAt: new Date(),
        }
        demoTasks.push(newTask)
      })
    }

    console.log(`Assigned VHV ${vhvId} to patient ${patientId} with ${tasks?.length || 0} tasks`)
    return { success: true, assignment }
  },

  getAssignments: async (doctorId: string) => {
    await delay()
    const assignments = getAssignmentsByDoctor(doctorId)

    // Enhance assignments with patient and VHV details
    const enhancedAssignments = assignments.map((assignment) => {
      const patient = getPatientById(assignment.patientId)
      const vhv = getUserById(assignment.vhvId)
      const tasks = getTasksByPatient(assignment.patientId).filter((t) => t.vhvId === assignment.vhvId)

      return {
        ...assignment,
        patient,
        vhv,
        tasks,
      }
    })

    return enhancedAssignments
  },

  getAvailableVHVs: async () => {
    await delay()
    return demoUsers
      .filter((user) => user.role === UserRole.VHV)
      .map((user) => ({
        id: user.id,
        email: user.email,
        name: user.email.split("@")[0], // Use email prefix as name
        role: user.role,
      }))
  },
}

// Mock Intakes API
export const mockIntakesApi = {
  create: async (patientId: string): Promise<IntakeSubmission> => {
    await delay()

    const newIntake: IntakeSubmission = {
      id: `i${Date.now()}`,
      patientId,
      vhvId: currentMockUser?.id || "3", // Default to VHV demo user
      status: "DRAFT" as any,
      payload: {
        visitMeta: {
          visitDateTime: new Date().toISOString(),
          vhvId: currentMockUser?.id || "3",
          locationText: "",
        },
        patientBasics: {
          firstName: "",
          lastName: "",
          dob: "",
          contactPhone: "",
        },
        symptoms: {
          chiefComplaint: "",
          checklist: [],
          onsetDays: 0,
        },
        vitals: {
          temp: undefined,
          systolic: undefined,
          diastolic: undefined,
          hr: undefined,
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
          consentGiven: false,
        },
      },
      attachments: [],
      createdAt: new Date(),
    }

    demoIntakeSubmissions.push(newIntake)
    return newIntake
  },

  update: async (id: string, payload: any): Promise<IntakeSubmission> => {
    await delay()

    const intakeIndex = demoIntakeSubmissions.findIndex((i) => i.id === id)
    if (intakeIndex === -1) {
      throw new Error("Intake not found")
    }

    const updatedIntake = {
      ...demoIntakeSubmissions[intakeIndex],
      payload: { ...demoIntakeSubmissions[intakeIndex].payload, ...payload },
      updatedAt: new Date(),
    }

    demoIntakeSubmissions[intakeIndex] = updatedIntake
    return updatedIntake
  },

  submit: async (id: string): Promise<IntakeSubmission> => {
    await delay()

    const intakeIndex = demoIntakeSubmissions.findIndex((i) => i.id === id)
    if (intakeIndex === -1) {
      throw new Error("Intake not found")
    }

    demoIntakeSubmissions[intakeIndex].status = "SUBMITTED" as any
    demoIntakeSubmissions[intakeIndex].updatedAt = new Date()

    return demoIntakeSubmissions[intakeIndex]
  },

  getById: async (id: string): Promise<IntakeSubmission> => {
    await delay()
    const intake = getIntakeSubmissionById(id)
    if (!intake) {
      throw new Error("Intake not found")
    }
    return intake
  },

  updateAttachments: async (id: string, attachments: string[]): Promise<IntakeSubmission> => {
    await delay()

    const intakeIndex = demoIntakeSubmissions.findIndex((i) => i.id === id)
    if (intakeIndex === -1) {
      throw new Error("Intake not found")
    }

    demoIntakeSubmissions[intakeIndex].attachments = attachments
    demoIntakeSubmissions[intakeIndex].updatedAt = new Date()

    return demoIntakeSubmissions[intakeIndex]
  },
}

// Mock Reviews API
export const mockReviewsApi = {
  getQueue: async (status?: string, from?: string): Promise<IntakeSubmission[]> => {
    await delay()

    let intakes = getIntakesForReview()

    if (status) {
      intakes = intakes.filter((intake) => intake.status === status)
    }

    if (from) {
      const fromDate = new Date(from)
      intakes = intakes.filter((intake) => intake.createdAt >= fromDate)
    }

    return intakes
  },

  approve: async (id: string) => {
    await delay()

    const intakeIndex = demoIntakeSubmissions.findIndex((i) => i.id === id)
    if (intakeIndex === -1) {
      throw new Error("Intake not found")
    }

    demoIntakeSubmissions[intakeIndex].status = "APPROVED" as any
    demoIntakeSubmissions[intakeIndex].updatedAt = new Date()

    return { success: true }
  },

  requestChanges: async (id: string, comment: string) => {
    await delay()

    const intakeIndex = demoIntakeSubmissions.findIndex((i) => i.id === id)
    if (intakeIndex === -1) {
      throw new Error("Intake not found")
    }

    demoIntakeSubmissions[intakeIndex].status = "CHANGES_REQUESTED" as any
    demoIntakeSubmissions[intakeIndex].updatedAt = new Date()

    console.log(`Changes requested for intake ${id}: ${comment}`)
    return { success: true }
  },

  reject: async (id: string, comment: string) => {
    await delay()

    const intakeIndex = demoIntakeSubmissions.findIndex((i) => i.id === id)
    if (intakeIndex === -1) {
      throw new Error("Intake not found")
    }

    demoIntakeSubmissions[intakeIndex].status = "REJECTED" as any
    demoIntakeSubmissions[intakeIndex].updatedAt = new Date()

    console.log(`Intake ${id} rejected: ${comment}`)
    return { success: true }
  },
}

// Mock Uploads API
export const mockUploadsApi = {
  upload: async (file: File) => {
    await delay(1000) // Simulate longer upload time

    // Generate a mock file URL
    const mockUrl = `https://mock-storage.com/files/${file.name}-${Date.now()}`

    return {
      url: mockUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
    }
  },
}

// Mock Admin API
export const mockAdminApi = {
  createDoctor: async (doctorData: {
    email: string
    password: string
    firstName: string
    lastName: string
    licenseNumber: string
    specialization: string
    hospitalAffiliation: string
  }) => {
    await delay()

    const newUser = {
      id: `u${Date.now()}`,
      email: doctorData.email,
      passwordHash: doctorData.password,
      role: UserRole.DOCTOR,
      createdAt: new Date(),
    }

    demoUsers.push(newUser)
    console.log("Created doctor:", doctorData)
    return { success: true, userId: newUser.id }
  },

  createVHV: async (vhvData: {
    email: string
    password: string
    firstName: string
    lastName: string
    region: string
    phoneNumber: string
    trainingLevel: string
  }) => {
    await delay()

    const newUser = {
      id: `u${Date.now()}`,
      email: vhvData.email,
      passwordHash: vhvData.password,
      role: UserRole.VHV,
      createdAt: new Date(),
    }

    demoUsers.push(newUser)
    console.log("Created VHV:", vhvData)
    return { success: true, userId: newUser.id }
  },

  getUsers: async () => {
    await delay()
    return demoUsers.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    }))
  },

  getDashboardStats: async () => {
    await delay()
    return demoDashboardStats
  },

  assignDoctor: async (patientId: string, doctorId: string) => {
    await delay()
    console.log(`Assigning doctor ${doctorId} to patient ${patientId}`)
    return { success: true }
  },

  getPatientDoctorAssignments: async () => {
    await delay()
    // Return mock assignments
    return [
      { patientId: "p1", doctorId: "2", assignedAt: new Date() },
      { patientId: "p2", doctorId: "5", assignedAt: new Date() },
    ]
  },
}

// Mock Tasks API
export const mockTasksApi = {
  getByVHV: async (vhvId: string) => {
    await delay()
    return getTasksByVHV(vhvId)
  },

  getByPatient: async (patientId: string) => {
    await delay()
    return getTasksByPatient(patientId)
  },

  create: async (taskData: any) => {
    await delay()

    const newTask = {
      id: `t${Date.now()}`,
      title: taskData.title,
      description: taskData.description,
      patientId: taskData.patientId,
      vhvId: taskData.vhvId,
      doctorId: currentMockUser?.id || taskData.doctorId,
      priority: taskData.priority,
      status: "PENDING" as const,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
      createdAt: new Date(),
    }

    demoTasks.push(newTask)
    return newTask
  },

  update: async (id: string, updateData: any) => {
    await delay()

    const taskIndex = demoTasks.findIndex((t) => t.id === id)
    if (taskIndex === -1) {
      throw new Error("Task not found")
    }

    const updatedTask = {
      ...demoTasks[taskIndex],
      ...updateData,
      dueDate: updateData.dueDate ? new Date(updateData.dueDate) : demoTasks[taskIndex].dueDate,
      updatedAt: new Date(),
    }

    demoTasks[taskIndex] = updatedTask
    return updatedTask
  },

  complete: async (id: string) => {
    await delay()

    const taskIndex = demoTasks.findIndex((t) => t.id === id)
    if (taskIndex === -1) {
      throw new Error("Task not found")
    }

    demoTasks[taskIndex].status = "COMPLETED"
    demoTasks[taskIndex].completedAt = new Date()
    demoTasks[taskIndex].updatedAt = new Date()

    return demoTasks[taskIndex]
  },

  delete: async (id: string) => {
    await delay()

    const taskIndex = demoTasks.findIndex((t) => t.id === id)
    if (taskIndex === -1) {
      throw new Error("Task not found")
    }

    demoTasks.splice(taskIndex, 1)
    return { success: true }
  },
}

// Export a unified mock API object
export const mockApi = {
  auth: mockAuthApi,
  patients: mockPatientsApi,
  intakes: mockIntakesApi,
  reviews: mockReviewsApi,
  uploads: mockUploadsApi,
  admin: mockAdminApi,
  tasks: mockTasksApi, // Added tasks API
}
