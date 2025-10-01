import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export type UserRole = "doctor" | "vhv" | "patient" | "caregiver"

export interface AuthUser {
  id: string
  email: string
  full_name: string
  role: UserRole
  phone?: string
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    return null
  }

  // Get user profile from our users table
  const { data: profile, error: profileError } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (profileError || !profile) {
    return null
  }

  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    role: profile.role as UserRole,
    phone: profile.phone,
  }
}

export async function requireAuth(allowedRoles?: UserRole[]) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect("/unauthorized")
  }

  return user
}

export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case "doctor":
      return "Doctor"
    case "vhv":
      return "Village Health Volunteer"
    case "patient":
      return "Patient"
    case "caregiver":
      return "Caregiver"
    default:
      return "User"
  }
}

export function getRoleDashboardPath(role: UserRole): string {
  switch (role) {
    case "doctor":
      return "/doctor"
    case "vhv":
      return "/vhv"
    case "patient":
      return "/patient"
    case "caregiver":
      return "/caregiver"
    default:
      return "/"
  }
}
