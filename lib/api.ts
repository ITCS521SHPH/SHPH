import type {
  LoginRequest,
  LoginResponse,
  CreateEmergencyAlertRequest,
  UpdateEmergencyAlertRequest,
  UpdatePatientProfileRequest,
} from "./types"
import * as supabaseApi from "./supabase-api"

// Always use Supabase database
const USE_SUPABASE = true

// Debug logging
if (typeof window !== "undefined") {
  console.log("API Configuration:", {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    USE_SUPABASE,
  })
}

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

// API methods using mock API or Supabase
export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      console.log("[v0] Calling login API for:", credentials.email)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      console.log("[v0] Login API response status:", response.status)

      if (!response.ok) {
        let errorMessage = "Login failed"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          // If we can't parse the error response, try to get text
          console.error("[v0] Failed to parse error response as JSON:", parseError)
          const errorText = await response.text()
          console.error("[v0] Error response text:", errorText)
          errorMessage = errorText || errorMessage
        }
        throw new Error(errorMessage)
      }

      try {
        const data = await response.json()
        console.log("[v0] Login successful, received data")
        return data
      } catch (parseError) {
        console.error("[v0] Failed to parse success response as JSON:", parseError)
        const responseText = await response.text()
        console.error("[v0] Response text:", responseText)
        throw new Error("Invalid response from server")
      }
    } catch (error) {
      console.error("[v0] Login error in authApi:", error)
      throw error
    }
  },

  logout: async () => {
    // Clear localStorage and redirect
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUser")
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
    }
    clearTokens()
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
  },

  getCurrentUser: async () => {
    if (USE_SUPABASE) {
      // For now, get user from localStorage since we're not using Supabase Auth
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
  },
}

export const patientsApi = {
  getAll: async () => {
    // Always use Supabase API
    const response = await fetch("/api/admin/patients")
    if (!response.ok) {
      throw new Error("Failed to fetch patients")
    }
    return response.json()
  },

  getById: async (id: string) => {
    if (USE_SUPABASE) {
      // For now, return null since we don't have a specific API endpoint
      return null
    }
  },

  create: async (patientData: any) => {
    if (USE_SUPABASE) {
      // Always use the /api/patients endpoint
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patientData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create patient")
      }

      return response.json()
    }
  },

  update: async (id: string, updateData: any) => {
    if (USE_SUPABASE) {
      // Supabase update implementation would go here
      throw new Error("Update not implemented for Supabase yet")
    }
  },

  assignVHV: async (patientId: string, vhvId: string, doctorId: string, tasks?: any[]) => {
    // Always use Supabase API
    const response = await fetch("/api/patients/assign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ patientId, vhvId, doctorId, tasks }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to assign patient")
    }

    return response.json()
  },

  getAssignments: async (doctorId: string) => {
    // Always use Supabase API
    const response = await fetch(`/api/patients/assignments?doctorId=${doctorId}`)
    if (!response.ok) {
      throw new Error("Failed to fetch assignments")
    }
    return response.json()
  },

  getProfile: async (patientId: string) => {
    const response = await fetch(`/api/patient/profile?patientId=${patientId}`)
    if (response.status === 404) {
      return null
    }
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Failed to fetch patient profile")
    }
    return response.json()
  },

  updateProfile: async (patientId: string, updates: UpdatePatientProfileRequest) => {
    const response = await fetch("/api/patient/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ patientId, ...updates }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Failed to update patient profile")
    }

    return response.json()
  },

  getAvailableVHVs: async () => {
    // Always use Supabase API
    const response = await fetch("/api/admin/vhvs")
    if (!response.ok) {
      throw new Error("Failed to fetch VHVs")
    }
    return response.json()
  },

  getAssignmentsByVHV: async (vhvId: string) => {
    // Always use Supabase API
    const response = await fetch(`/api/vhv/assignments?vhvId=${vhvId}`)
    if (!response.ok) {
      throw new Error("Failed to fetch VHV assignments")
    }
    return response.json()
  },
}

export const vhvApi = {
  getProfile: async (vhvId: string) => {
    if (USE_SUPABASE) {
      const response = await fetch(`/api/vhv/profile?vhvId=${vhvId}`)
      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to fetch VHV profile")
      }
      return response.json()
    }
    throw new Error("VHV profile API not implemented for mock data")
  },

  updateProfile: async (vhvId: string, updates: any) => {
    if (USE_SUPABASE) {
      const response = await fetch("/api/vhv/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vhvId, ...updates }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to update VHV profile")
      }

      return response.json()
    }
    throw new Error("VHV profile API not implemented for mock data")
  },
}

export const intakesApi = {
  create: async (patientId: string, vhvId?: string) => {
    if (USE_SUPABASE) {
      const response = await fetch("/api/intakes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ patientId, vhvId }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create intake")
      }
      return response.json()
    }
  },

  update: async (id: string, payload: any) => {
    if (USE_SUPABASE) {
      const response = await fetch("/api/intakes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...payload }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update intake")
      }
      return response.json()
    }
  },

  submit: async (id: string) => {
    if (USE_SUPABASE) {
      const response = await fetch("/api/intakes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status: "SUBMITTED" }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit intake")
      }
      return response.json()
    }
  },

  getById: async (id: string) => {
    if (USE_SUPABASE) {
      const response = await fetch(`/api/intakes?id=${id}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to get intake')
      }
      return response.json()
    }
  },

  // Fetch all intake submissions for a patient (used on patient dashboard)
  getByPatient: async (patientId: string) => {
    if (USE_SUPABASE) {
      const response = await fetch(`/api/intakes?patientId=${patientId}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to get patient intakes')
      }
      return response.json()
    }
  },

  updateAttachments: async (id: string, attachments: string[]) => {
    if (USE_SUPABASE) {
      // For now, return mock response
      return { id, attachments, updatedAt: new Date() }
    }
  },
}

export const reviewsApi = {
  getQueue: async (status?: string, from?: string) => {
    if (USE_SUPABASE) {
      const params = new URLSearchParams()
      if (status) params.append("status", status)
      if (from) params.append("from", from)

      const response = await fetch(`/api/reviews?${params.toString()}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get review queue")
      }
      return response.json()
    }
  },

  approve: async (id: string) => {
    if (USE_SUPABASE) {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, action: "approve" }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to approve review")
      }
      return response.json()
    }
  },

  requestChanges: async (id: string, comment: string) => {
    if (USE_SUPABASE) {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, action: "request_changes", comment }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to request changes")
      }
      return response.json()
    }
  },

  reject: async (id: string, comment: string) => {
    if (USE_SUPABASE) {
      // For now, return mock response
      return { id, status: "REJECTED", comment, updatedAt: new Date() }
    }
  },
}

export const uploadsApi = {
  upload: async (file: File) => {},
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
    district: string
    phoneNumber: string
  }) => {
    if (USE_SUPABASE) {
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...doctorData,
          phoneNumber: doctorData.phoneNumber,
          role: "DOCTOR",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create doctor")
      }

      return await response.json()
    }
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
    if (USE_SUPABASE) {
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...vhvData,
          role: "VHV",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create VHV")
      }

      return await response.json()
    }
  },

  getUsers: async () => {
    if (USE_SUPABASE) {
      // This is handled by the admin dashboard component directly
      return []
    }
  },

  getDashboardStats: async () => {
    if (USE_SUPABASE) {
      const response = await fetch("/api/admin/stats")
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats")
      }
      return response.json()
    }
  },

  assignDoctor: async (patientId: string, doctorId: string) => {
    if (USE_SUPABASE) {
      // For now, return mock response
      return { id: "mock-assignment-id", patientId, doctorId, status: "ACTIVE" }
    }
  },

  getPatientDoctorAssignments: async () => {
    if (USE_SUPABASE) {
      // For now, return empty array
      return []
    }
  },
}

export const tasksApi = {
  getByVHV: async (vhvId: string) => {
    if (USE_SUPABASE) {
      const response = await fetch(`/api/tasks?vhvId=${vhvId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch tasks")
      }
      return response.json()
    }
  },

  getByPatient: async (patientId: string) => {
    if (USE_SUPABASE) {
      const response = await fetch(`/api/tasks?patientId=${patientId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch tasks")
      }
      return response.json()
    }
  },

  create: async (taskData: any) => {
    // Always use Supabase API
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to create task")
    }

    return response.json()
  },

  update: async (id: string, updateData: any) => {
    if (USE_SUPABASE) {
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...updateData }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update task")
      }
      return response.json()
    }
  },

  complete: async (id: string, formData?: Record<string, any>) => {
    if (USE_SUPABASE) {
      const response = await fetch(`/api/tasks?id=${id}&action=complete`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ formData }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to complete task")
      }
      return response.json()
    }
  },

  reopen: async (id: string) => {
    if (USE_SUPABASE) {
      const response = await fetch(`/api/tasks?id=${id}&action=reopen`, {
        method: "PATCH",
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to reopen task")
      }
      return response.json()
    }
    // Mock API doesn't have reopen, fall back to update
  },

  delete: async (id: string) => {
    if (USE_SUPABASE) {
      const response = await fetch(`/api/tasks?id=${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete task")
      }
      return response.json()
    }
  },

  getByDoctor: async (doctorId: string) => {
    if (USE_SUPABASE) {
      const response = await fetch(`/api/tasks?doctorId=${doctorId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch tasks")
      }
      return response.json()
    }
    // For mock API, return empty array for now
    return []
  },
}

export const emergencyApi = {
  // Create a new emergency alert
  create: async (alertData: CreateEmergencyAlertRequest) => {
    if (USE_SUPABASE) {
      const response = await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alertData),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create emergency alert")
      }
      return response.json()
    }
  },

  // Get all emergency alerts (for admin/monitoring)
  getAll: async (status?: string, priority?: string) => {
    if (USE_SUPABASE) {
      const params = new URLSearchParams()
      if (status) params.append("status", status)
      if (priority) params.append("priority", priority)

      const response = await fetch(`/api/emergency?${params.toString()}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get emergency alerts")
      }
      return response.json()
    }
  },

  // Get emergency alerts for a specific patient
  getByPatient: async (patientId: string) => {
    if (USE_SUPABASE) {
      const response = await fetch(`/api/emergency?patientId=${patientId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get patient emergency alerts")
      }
      return response.json()
    }
  },

  // Get emergency alerts assigned to a doctor
  getByDoctor: async (doctorId: string, status?: string) => {
    if (USE_SUPABASE) {
      const params = new URLSearchParams()
      params.append("doctorId", doctorId)
      if (status) params.append("status", status)

      const response = await fetch(`/api/emergency?${params.toString()}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get doctor emergency alerts")
      }
      return response.json()
    }
  },

  // Get emergency alerts assigned to a VHV
  getByVHV: async (vhvId: string, status?: string) => {
    if (USE_SUPABASE) {
      const params = new URLSearchParams()
      params.append("vhvId", vhvId)
      if (status) params.append("status", status)

      const response = await fetch(`/api/emergency?${params.toString()}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get VHV emergency alerts")
      }
      return response.json()
    }
  },

  // Update an emergency alert (acknowledge, resolve, etc.)
  update: async (alertId: string, updateData: UpdateEmergencyAlertRequest) => {
    if (USE_SUPABASE) {
      const response = await fetch(`/api/emergency/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update emergency alert")
      }
      return response.json()
    }
  },

  // Acknowledge an emergency alert
  acknowledge: async (alertId: string, responderId: string, notes?: string) => {
    if (USE_SUPABASE) {
      const response = await fetch(`/api/emergency/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "acknowledge",
          userId: responderId,
          notes,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to acknowledge emergency alert")
      }
      return response.json()
    }
  },

  // Resolve an emergency alert
  resolve: async (alertId: string, responderId: string, notes?: string) => {
    if (USE_SUPABASE) {
      const response = await fetch(`/api/emergency/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resolve",
          userId: responderId,
          notes,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to resolve emergency alert")
      }
      return response.json()
    }
  },

  // Cancel an emergency alert
  cancel: async (alertId: string, responderId: string, reason?: string) => {
    if (USE_SUPABASE) {
      const response = await fetch(`/api/emergency/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          userId: responderId,
          notes: reason,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to cancel emergency alert")
      }
      return response.json()
    }
  },

  // Get emergency statistics
  getStats: async (timeframe?: string) => {
    if (USE_SUPABASE) {
      return await supabaseApi.getEmergencyStats()
    }
  },

  // Get active emergency alerts count for real-time notifications
  getActiveCount: async (userId: string, userRole: string) => {
    if (USE_SUPABASE) {
      const alerts = await emergencyApi.getAll("ACTIVE")
      return alerts.length
    }
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

export const patientDataApi = {
  getAppointments: async (patientId: string) => {
    if (USE_SUPABASE) {
      const response = await fetch(`/api/patient/appointments?patientId=${patientId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get appointments")
      }
      return response.json()
    }
    return Promise.resolve([])
  },
  getVisits: async (patientId: string) => {
    if (USE_SUPABASE) {
      const response = await fetch(`/api/patient/visits?patientId=${patientId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get visits")
      }
      return response.json()
    }
    return Promise.resolve([])
  },
  getMedications: async (patientId: string) => {
    if (USE_SUPABASE) {
      const response = await fetch(`/api/patient/medications?patientId=${patientId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get medications")
      }
      return response.json()
    }
    return Promise.resolve([])
  },
  getVitalSigns: async (patientId: string) => {
    if (USE_SUPABASE) {
      const response = await fetch(`/api/patient/vital-signs?patientId=${patientId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get vital signs")
      }
      return response.json()
    }
    return Promise.resolve([])
  },
  createRescheduleRequest: async (requestData: {
    appointmentId: string
    patientId: string
    requestedDate: string
    requestedTime: string
    reason?: string
    preferredAlternatives?: string
  }) => {
    // Always use Supabase API
    const response = await fetch("/api/patient/reschedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to create reschedule request")
    }

    return response.json()
  },
}

export default apiClient

export const areaTasksApi = {
  getByVHV: async (vhvId: string) => {
    const resp = await fetch(`/api/area-tasks?vhvId=${vhvId}`)
    if (!resp.ok) throw new Error("Failed to fetch area tasks")
    return resp.json()
  },
  getByDoctor: async (doctorId: string) => {
    const resp = await fetch(`/api/area-tasks?doctorId=${doctorId}`)
    if (!resp.ok) throw new Error("Failed to fetch area tasks")
    return resp.json()
  },
  create: async (payload: any) => {
    const resp = await fetch("/api/area-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!resp.ok) {
      const e = await resp.json().catch(() => ({}))
      throw new Error(e.error || "Failed to create area task")
    }
    return resp.json()
  },
  update: async (id: string, data: any) => {
    const resp = await fetch("/api/area-tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    })
    if (!resp.ok) throw new Error((await resp.json()).error || "Failed to update area task")
    return resp.json()
  },
  complete: async (id: string, formData?: Record<string, any>) => {
    const resp = await fetch(`/api/area-tasks?id=${id}&action=complete`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formData }),
    })
    if (!resp.ok) throw new Error((await resp.json()).error || "Failed to complete area task")
    return resp.json()
  },
  reopen: async (id: string) => {
    const resp = await fetch(`/api/area-tasks?id=${id}&action=reopen`, { method: "PATCH" })
    if (!resp.ok) throw new Error((await resp.json()).error || "Failed to reopen area task")
    return resp.json()
  },
  delete: async (id: string) => {
    const resp = await fetch(`/api/area-tasks?id=${id}`, { method: "DELETE" })
    if (!resp.ok) throw new Error((await resp.json()).error || "Failed to delete area task")
    return resp.json()
  },
}
