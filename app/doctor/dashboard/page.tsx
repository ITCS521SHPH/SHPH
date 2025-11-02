import { RouteGuard } from "@/components/auth/route-guard"
import { DoctorDashboard } from "@/components/doctor/doctor-dashboard"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default function DoctorDashboardPage() {
  return (
    <RouteGuard>
      <DoctorDashboard />
    </RouteGuard>
  )
}
