export type UserRole = "admin" | "doctor" | "patient" | "caregiver" | "vhv"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  department?: string
  specialization?: string
  licenseNumber?: string
  phoneNumber?: string
  address?: string
  emergencyContact?: string
  assignedPatients?: string[]
  district?: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Mock authentication - in real app, this would connect to your auth provider
export const mockUsers: User[] = [
  {
    id: "1",
    email: "admin@healthcare.com",
    name: "System Administrator",
    role: "admin",
    avatar: "/admin-avatar.png",
  },
  {
    id: "2",
    email: "dr.smith@healthcare.com",
    name: "Dr. Sarah Smith",
    role: "doctor",
    avatar: "/doctor-avatar.png",
    department: "Internal Medicine",
    specialization: "Cardiology",
    licenseNumber: "MD-12345",
    phoneNumber: "+1-555-0123",
  },
  {
    id: "3",
    email: "patient@example.com",
    name: "John Doe",
    role: "patient",
    avatar: "/patient-avatar.png",
    phoneNumber: "+1-555-0456",
    address: "123 Main St, City, State",
    emergencyContact: "Jane Doe - +1-555-0789",
  },
  {
    id: "4",
    email: "caregiver@healthcare.com",
    name: "Maria Garcia",
    role: "caregiver",
    avatar: "/caregiver-avatar.jpg",
    phoneNumber: "+1-555-0321",
    assignedPatients: ["3", "5", "6"],
  },
  {
    id: "5",
    email: "vhv@community.com",
    name: "David Chen",
    role: "vhv",
    avatar: "/volunteer-avatar.png",
    phoneNumber: "+1-555-0654",
    district: "District A",
    assignedPatients: ["3", "7", "8"],
  },
]

export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
  // Mock authentication - replace with real auth logic
  await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call

  const user = mockUsers.find((u) => u.email === email)
  if (user && password === "password123") {
    return user
  }
  return null
}

export const getCurrentUser = (): User | null => {
  // In a real app, this would check JWT token, session, etc.
  if (typeof window !== "undefined") {
    const userData = localStorage.getItem("currentUser")
    return userData ? JSON.parse(userData) : null
  }
  return null
}

export const setCurrentUser = (user: User | null) => {
  if (typeof window !== "undefined") {
    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user))
    } else {
      localStorage.removeItem("currentUser")
    }
  }
}

export const logout = () => {
  setCurrentUser(null)
}

export const hasPermission = (user: User | null, requiredRoles: UserRole[]): boolean => {
  if (!user) return false
  return requiredRoles.includes(user.role)
}
