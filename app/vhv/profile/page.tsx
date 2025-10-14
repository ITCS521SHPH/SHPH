import { RouteGuard } from "@/components/auth/route-guard"
import { VHVProfileSettings } from "@/components/vhv/vhv-profile-settings"

export default function VHVProfilePage() {
  return (
    <RouteGuard>
      <VHVProfileSettings />
    </RouteGuard>
  )
}
