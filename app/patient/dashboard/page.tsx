import { RouteGuard } from "@/components/auth/route-guard"
import { PatientDashboard } from "@/components/patient/patient-dashboard"

export default function PatientDashboardPage() {
  return (
    <RouteGuard>
      <PatientDashboard />
    </RouteGuard>
  )
}
