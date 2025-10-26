"use client"

import { AppointmentReminders } from "@/components/patient/appointment-reminders"
import { getCurrentUserFromStorage, clearCurrentUser } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Bell, User, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PatientRemindersPage() {
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
            <div className="flex items-center gap-4">
              <Link href="/patient/appointments">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Appointments
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Bell className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">Appointment Reminders</h1>
                  <p className="text-sm text-muted-foreground">Stay on top of your upcoming appointments</p>
                </div>
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
        <AppointmentReminders />
      </main>
    </div>
  )
}
