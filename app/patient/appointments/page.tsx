"use client"

import { PatientAppointmentDashboard } from "@/components/patient/patient-appointment-dashboard"
import { getCurrentUserFromStorage, clearCurrentUser } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calendar, User } from "lucide-react"

export default function PatientAppointmentsPage() {
  const router = useRouter()
  const currentUser = getCurrentUserFromStorage()

  const handleSignOut = () => {
    clearCurrentUser()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">My Appointments</h1>
                <p className="text-sm text-muted-foreground">View and manage your healthcare appointments</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">{currentUser?.email?.split("@")[0]}</span>
              </div>
              <Button variant="outline" onClick={handleSignOut} size="sm">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <PatientAppointmentDashboard />
      </main>
    </div>
  )
}
