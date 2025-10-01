import { RouteGuard } from "@/components/auth/route-guard"
import { DoctorDashboard } from "@/components/doctor/doctor-dashboard"

export default function DoctorDashboardPage() {
  return (
    <RouteGuard>
      <DoctorDashboard />
    </RouteGuard>
  )
}
