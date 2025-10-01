import { RouteGuard } from "@/components/auth/route-guard"
import { CaregiverDashboard } from "@/components/caregiver/caregiver-dashboard"

export default function CaregiverDashboardPage() {
  return (
    <RouteGuard>
      <CaregiverDashboard />
    </RouteGuard>
  )
}
