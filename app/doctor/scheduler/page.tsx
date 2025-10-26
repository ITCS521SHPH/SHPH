"use client"
import { DoctorScheduler } from "@/components/doctor/doctor-scheduler"
import { getCurrentUserFromStorage, clearCurrentUser } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calendar, User } from "lucide-react"

export default function DoctorSchedulerPage() {
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
                <h1 className="text-2xl font-bold">Appointment Scheduler</h1>
                <p className="text-sm text-muted-foreground">Manage your patient appointments</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Dr. {currentUser?.email?.split("@")[0]}</span>
              </div>
              <Button variant="outline" onClick={handleSignOut} size="sm">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <DoctorScheduler />
      </main>
    </div>
  )
}
