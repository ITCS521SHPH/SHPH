import type { LoginRequest, LoginResponse } from "./types"
import { mockApi } from "./mock-api"

// Use environment variable to determine if we should use mock API
const USE_MOCK_API = process.env.NODE_ENV === "development" || !process.env.NEXT_PUBLIC_API_URL

// Token management functions for compatibility
export const setTokens = (newAccessToken: string, newRefreshToken: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("accessToken", newAccessToken)
    localStorage.setItem("refreshToken", newRefreshToken)
  }
}

export const clearTokens = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
  }
}

export const getAccessToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("accessToken")
  }
  return null
}

// API methods using mock API
export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return mockApi.auth.login(credentials)
  },

  logout: () => {
    mockApi.auth.logout()
    clearTokens()
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
  },

  getCurrentUser: async () => {
    return mockApi.auth.getCurrentUser()
  },
}

export const patientsApi = {
  getAll: async () => {
    return mockApi.patients.getAll()
  },

  getById: async (id: string) => {
    return mockApi.patients.getById(id)
  },

  create: async (patientData: any) => {
    return mockApi.patients.create(patientData)
  },

  update: async (id: string, updateData: any) => {
    return mockApi.patients.update(id, updateData)
  },

  assignVHV: async (patientId: string, vhvId: string, tasks?: any[]) => {
    return mockApi.patients.assignVHV(patientId, vhvId, tasks)
  },

  getAssignments: async (doctorId: string) => {
    return mockApi.patients.getAssignments(doctorId)
  },

  getAvailableVHVs: async () => {
    return mockApi.patients.getAvailableVHVs()
  },
}

export const intakesApi = {
  create: async (patientId: string) => {
    return mockApi.intakes.create(patientId)
  },

  update: async (id: string, payload: any) => {
    return mockApi.intakes.update(id, payload)
  },

  submit: async (id: string) => {
    return mockApi.intakes.submit(id)
  },

  getById: async (id: string) => {
    return mockApi.intakes.getById(id)
  },

  updateAttachments: async (id: string, attachments: string[]) => {
    return mockApi.intakes.updateAttachments(id, attachments)
  },
}

export const reviewsApi = {
  getQueue: async (status?: string, from?: string) => {
    return mockApi.reviews.getQueue(status, from)
  },

  approve: async (id: string) => {
    return mockApi.reviews.approve(id)
  },

  requestChanges: async (id: string, comment: string) => {
    return mockApi.reviews.requestChanges(id, comment)
  },

  reject: async (id: string, comment: string) => {
    return mockApi.reviews.reject(id, comment)
  },
}

export const uploadsApi = {
  upload: async (file: File) => {
    return mockApi.uploads.upload(file)
  },
}

export const adminApi = {
  createDoctor: async (doctorData: {
    email: string
    password: string
    firstName: string
    lastName: string
    licenseNumber: string
    specialization: string
    hospitalAffiliation: string
  }) => {
    return mockApi.admin.createDoctor(doctorData)
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
    return mockApi.admin.createVHV(vhvData)
  },

  getUsers: async () => {
    return mockApi.admin.getUsers()
  },

  getDashboardStats: async () => {
    return mockApi.admin.getDashboardStats()
  },

  assignDoctor: async (patientId: string, doctorId: string) => {
    return mockApi.admin.assignDoctor(patientId, doctorId)
  },

  getPatientDoctorAssignments: async () => {
    return mockApi.admin.getPatientDoctorAssignments()
  },
}

export const tasksApi = {
  getByVHV: async (vhvId: string) => {
    return mockApi.tasks.getByVHV(vhvId)
  },

  getByPatient: async (patientId: string) => {
    return mockApi.tasks.getByPatient(patientId)
  },

  create: async (taskData: any) => {
    return mockApi.tasks.create(taskData)
  },

  update: async (id: string, updateData: any) => {
    return mockApi.tasks.update(id, updateData)
  },

  complete: async (id: string) => {
    return mockApi.tasks.complete(id)
  },

  delete: async (id: string) => {
    return mockApi.tasks.delete(id)
  },
}

// Default export for compatibility
const apiClient = {
  // Mock axios-like interface for any remaining direct usage
  get: async (url: string) => {
    throw new Error("Use specific API methods instead")
  },
  post: async (url: string, data?: any) => {
    throw new Error("Use specific API methods instead")
  },
  put: async (url: string, data?: any) => {
    throw new Error("Use specific API methods instead")
  },
  patch: async (url: string, data?: any) => {
    throw new Error("Use specific API methods instead")
  },
  delete: async (url: string) => {
    throw new Error("Use specific API methods instead")
  },
}

export default apiClient
