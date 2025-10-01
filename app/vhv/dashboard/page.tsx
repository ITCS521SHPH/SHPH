import { RouteGuard } from "@/components/auth/route-guard"
import { VHVDashboard } from "@/components/vhv/vhv-dashboard"

export default function VHVDashboardPage() {
  return (
    <RouteGuard>
      <VHVDashboard />
    </RouteGuard>
  )
}
