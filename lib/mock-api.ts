import {
  type LoginRequest,
  type LoginResponse,
  type CreatePatient,
  type Patient,
  type IntakeSubmission,
  type CreateEmergencyAlertRequest,
  type UpdateEmergencyAlertRequest,
  type EmergencyAlert,
  UserRole,
  EmergencyStatus,
  EmergencyPriority,
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

// Mock emergency alerts storage
const demoEmergencyAlerts: EmergencyAlert[] = [
  {
    id: "ea1",
    patientId: "p1",
    patientName: "John Doe",
    triggeredBy: "1", // patient user ID
    priority: EmergencyPriority.HIGH,
    status: EmergencyStatus.ACTIVE,
    description: "Severe chest pain and difficulty breathing",
    location: "Home - 123 Main St",
    assignedDoctorId: "2",
    assignedVHVId: "3",
    createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
  },
  {
    id: "ea2",
    patientId: "p2",
    patientName: "Jane Smith",
    triggeredBy: "4", // patient user ID
    priority: EmergencyPriority.CRITICAL,
    status: EmergencyStatus.ACKNOWLEDGED,
    description: "Fell down stairs, possible head injury",
    location: "Village Health Center",
    assignedDoctorId: "2",
    assignedVHVId: "3",
    acknowledgedBy: "2",
    acknowledgedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    createdAt: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
  },
]

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
      district: patientData.district || undefined,
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
          status: "pending" as const,
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
    district: string
    phoneNumber: string
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
      status: "pending" as const,
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

    demoTasks[taskIndex].status = "completed"
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

// Mock Emergency API
export const mockEmergencyApi = {
  create: async (alertData: CreateEmergencyAlertRequest): Promise<EmergencyAlert> => {
    await delay()

    const patient = getPatientById(alertData.patientId)
    if (!patient) {
      throw new Error("Patient not found")
    }

    // Find assigned doctor and VHV for this patient
    const assignment = demoAssignments.find((a) => a.patientId === alertData.patientId && a.status === "ACTIVE")

    const newAlert: EmergencyAlert = {
      id: `ea${Date.now()}`,
      patientId: alertData.patientId,
      patientName: `${patient.firstName} ${patient.lastName}`,
      triggeredBy: currentMockUser?.id || "1",
      priority: alertData.priority,
      status: EmergencyStatus.ACTIVE,
      description: alertData.description,
      location: alertData.location,
      assignedDoctorId: assignment?.doctorId,
      assignedVHVId: assignment?.vhvId,
      createdAt: new Date(),
    }

    demoEmergencyAlerts.push(newAlert)
    console.log("[v0] Emergency alert created:", newAlert)
    return newAlert
  },

  getAll: async (status?: string, priority?: string): Promise<EmergencyAlert[]> => {
    await delay()

    let alerts = [...demoEmergencyAlerts]

    if (status) {
      alerts = alerts.filter((alert) => alert.status === status)
    }

    if (priority) {
      alerts = alerts.filter((alert) => alert.priority === priority)
    }

    return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  getByPatient: async (patientId: string): Promise<EmergencyAlert[]> => {
    await delay()
    return demoEmergencyAlerts
      .filter((alert) => alert.patientId === patientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  getByDoctor: async (doctorId: string, status?: string): Promise<EmergencyAlert[]> => {
    await delay()

    let alerts = demoEmergencyAlerts.filter((alert) => alert.assignedDoctorId === doctorId)

    if (status) {
      alerts = alerts.filter((alert) => alert.status === status)
    }

    return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  getByVHV: async (vhvId: string, status?: string): Promise<EmergencyAlert[]> => {
    await delay()

    let alerts = demoEmergencyAlerts.filter((alert) => alert.assignedVHVId === vhvId)

    if (status) {
      alerts = alerts.filter((alert) => alert.status === status)
    }

    return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  update: async (alertId: string, updateData: UpdateEmergencyAlertRequest): Promise<EmergencyAlert> => {
    await delay()

    const alertIndex = demoEmergencyAlerts.findIndex((alert) => alert.id === alertId)
    if (alertIndex === -1) {
      throw new Error("Emergency alert not found")
    }

    const updatedAlert = {
      ...demoEmergencyAlerts[alertIndex],
      ...updateData,
      updatedAt: new Date(),
    }

    demoEmergencyAlerts[alertIndex] = updatedAlert
    return updatedAlert
  },

  acknowledge: async (alertId: string, responderId: string): Promise<EmergencyAlert> => {
    await delay()

    const alertIndex = demoEmergencyAlerts.findIndex((alert) => alert.id === alertId)
    if (alertIndex === -1) {
      throw new Error("Emergency alert not found")
    }

    demoEmergencyAlerts[alertIndex] = {
      ...demoEmergencyAlerts[alertIndex],
      status: EmergencyStatus.ACKNOWLEDGED,
      acknowledgedBy: responderId,
      acknowledgedAt: new Date(),
      updatedAt: new Date(),
    }

    console.log(`[v0] Emergency alert ${alertId} acknowledged by ${responderId}`)
    return demoEmergencyAlerts[alertIndex]
  },

  resolve: async (alertId: string, responderId: string, notes?: string): Promise<EmergencyAlert> => {
    await delay()

    const alertIndex = demoEmergencyAlerts.findIndex((alert) => alert.id === alertId)
    if (alertIndex === -1) {
      throw new Error("Emergency alert not found")
    }

    const alert = demoEmergencyAlerts[alertIndex]
    const responseTime = alert.acknowledgedAt
      ? Math.round((new Date().getTime() - new Date(alert.createdAt).getTime()) / (1000 * 60))
      : undefined

    demoEmergencyAlerts[alertIndex] = {
      ...alert,
      status: EmergencyStatus.RESOLVED,
      resolvedBy: responderId,
      resolvedAt: new Date(),
      responseTime,
      updatedAt: new Date(),
    }

    console.log(`[v0] Emergency alert ${alertId} resolved by ${responderId}`, notes ? `Notes: ${notes}` : "")
    return demoEmergencyAlerts[alertIndex]
  },

  cancel: async (alertId: string, reason?: string): Promise<EmergencyAlert> => {
    await delay()

    const alertIndex = demoEmergencyAlerts.findIndex((alert) => alert.id === alertId)
    if (alertIndex === -1) {
      throw new Error("Emergency alert not found")
    }

    demoEmergencyAlerts[alertIndex] = {
      ...demoEmergencyAlerts[alertIndex],
      status: EmergencyStatus.CANCELLED,
      updatedAt: new Date(),
    }

    console.log(`[v0] Emergency alert ${alertId} cancelled`, reason ? `Reason: ${reason}` : "")
    return demoEmergencyAlerts[alertIndex]
  },

  getStats: async (timeframe?: string) => {
    await delay()

    const now = new Date()
    let fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours by default

    if (timeframe === "week") {
      fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (timeframe === "month") {
      fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    const relevantAlerts = demoEmergencyAlerts.filter((alert) => new Date(alert.createdAt) >= fromDate)

    const activeAlerts = relevantAlerts.filter(
      (alert) => alert.status === EmergencyStatus.ACTIVE || alert.status === EmergencyStatus.ACKNOWLEDGED,
    ).length

    const resolvedAlerts = relevantAlerts.filter(
      (alert) => alert.status === EmergencyStatus.RESOLVED && alert.responseTime,
    )

    const averageResponseTime =
      resolvedAlerts.length > 0
        ? Math.round(resolvedAlerts.reduce((sum, alert) => sum + (alert.responseTime || 0), 0) / resolvedAlerts.length)
        : 0

    return {
      totalAlerts: relevantAlerts.length,
      activeAlerts,
      averageResponseTime,
      alertsByPriority: {
        critical: relevantAlerts.filter((a) => a.priority === EmergencyPriority.CRITICAL).length,
        high: relevantAlerts.filter((a) => a.priority === EmergencyPriority.HIGH).length,
        medium: relevantAlerts.filter((a) => a.priority === EmergencyPriority.MEDIUM).length,
      },
    }
  },

  getActiveCount: async (userId: string, userRole: string): Promise<number> => {
    await delay(100) // Faster for real-time updates

    const activeStatuses = [EmergencyStatus.ACTIVE, EmergencyStatus.ACKNOWLEDGED]

    if (userRole === UserRole.DOCTOR) {
      return demoEmergencyAlerts.filter(
        (alert) => alert.assignedDoctorId === userId && activeStatuses.includes(alert.status),
      ).length
    } else if (userRole === UserRole.VHV) {
      return demoEmergencyAlerts.filter(
        (alert) => alert.assignedVHVId === userId && activeStatuses.includes(alert.status),
      ).length
    } else if (userRole === UserRole.PATIENT) {
      return demoEmergencyAlerts.filter(
        (alert) => alert.triggeredBy === userId && activeStatuses.includes(alert.status),
      ).length
    }

    return 0
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
  emergency: mockEmergencyApi, // Added emergency API
}
