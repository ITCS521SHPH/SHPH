"use client"

import { useState, useEffect } from "react"
import { DoctorDashboard } from "@/components/doctor/doctor-dashboard"
import { Header } from "@/components/layout/header"
import { getCurrentUser, hasPermission, type User } from "@/lib/auth"
import { LoginForm } from "@/components/auth/login-form"

export default function DoctorPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setIsLoading(false)
  }, [])

  const handleLogin = (success: boolean) => {
    if (success) {
      const currentUser = getCurrentUser()
      setUser(currentUser)
    }
  }

  const handleLogout = () => {
    setUser(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />
  }

  // Check permissions - only doctors and admins can access doctor dashboard
  if (!hasPermission(user, ["doctor", "admin"])) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} onLogout={handleLogout} />
        <main className="container mx-auto p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access the doctor dashboard.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onLogout={handleLogout} />
      <main className="container mx-auto p-6">
        <DoctorDashboard />
      </main>
    </div>
  )
}
