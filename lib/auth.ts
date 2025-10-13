export type UserRole = "doctor" | "vhv" | "caregiver" | "patient"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
}

// Mock authentication - in a real app, this would integrate with your auth provider
export const mockUsers: Record<string, User> = {
  "demo@doctor.com": {
    id: "1",
    email: "demo@doctor.com",
    name: "Dr. Michael Chen",
    role: "doctor",
  },
  "demo@vhv.com": {
    id: "2",
    email: "demo@vhv.com",
    name: "Maria Santos",
    role: "vhv",
  },
  "demo@caregiver.com": {
    id: "3",
    email: "demo@caregiver.com",
    name: "Jennifer Martinez",
    role: "caregiver",
  },
  "demo@patient.com": {
    id: "4",
    email: "demo@patient.com",
    name: "Sarah Johnson",
    role: "patient",
  },
}

export function authenticateUser(email: string, password: string): User | null {
  // Simple demo authentication
  if (password === "password123" && mockUsers[email]) {
    return mockUsers[email]
  }
  return null
}

export function getCurrentUser(): User | null {
  // In a real app, this would get the user from session/token
  if (typeof window !== "undefined") {
    const userData = localStorage.getItem("currentUser")
    return userData ? JSON.parse(userData) : null
  }
  return null
}

export function setCurrentUser(user: User): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("currentUser", JSON.stringify(user))
  }
}

export function clearCurrentUser(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("currentUser")
  }
}

export function hasRole(user: User | null, allowedRoles: UserRole[]): boolean {
  return user ? allowedRoles.includes(user.role) : false
}

export function canAccessRoute(user: User | null, route: string): boolean {
  if (!user) return false

  const roleRoutes: Record<UserRole, string[]> = {
    doctor: ["/doctor"],
    vhv: ["/vhv"],
    caregiver: ["/caregiver"],
    patient: ["/patient"],
  }

  const userRoutes = roleRoutes[user.role] || []
  return userRoutes.some((allowedRoute) => route.startsWith(allowedRoute))
}
