"use client"

import { useState, useEffect } from "react"
import { PatientList } from "@/components/patients/patient-list"
import { PatientRegistrationForm } from "@/components/patients/patient-registration-form"
import { Header } from "@/components/layout/header"
import { getCurrentUser, hasPermission, type User } from "@/lib/auth"
import type { Patient } from "@/lib/types"
import { LoginForm } from "@/components/auth/login-form"

type ViewMode = "list" | "add" | "edit"

export default function PatientsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

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

  const handleAddPatient = () => {
    setSelectedPatient(null)
    setViewMode("add")
  }

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setViewMode("edit")
  }

  const handleViewPatient = (patient: Patient) => {
    // TODO: Implement patient detail view
    console.log("View patient:", patient)
  }

  const handleSubmitPatient = (patientData: Omit<Patient, "id">) => {
    // TODO: Implement patient save logic
    console.log("Save patient:", patientData)
    setViewMode("list")
  }

  const handleCancel = () => {
    setViewMode("list")
    setSelectedPatient(null)
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

  // Check permissions - only admin, doctors, caregivers, and VHVs can access patient management
  if (!hasPermission(user, ["admin", "doctor", "caregiver", "vhv"])) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} onLogout={handleLogout} />
        <main className="container mx-auto p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access patient management.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onLogout={handleLogout} />
      <main className="container mx-auto p-6">
        {viewMode === "list" && (
          <PatientList
            onAddPatient={handleAddPatient}
            onEditPatient={handleEditPatient}
            onViewPatient={handleViewPatient}
          />
        )}

        {(viewMode === "add" || viewMode === "edit") && (
          <PatientRegistrationForm
            onSubmit={handleSubmitPatient}
            onCancel={handleCancel}
            initialData={selectedPatient || undefined}
          />
        )}
      </main>
    </div>
  )
}
