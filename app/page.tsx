import { getCurrentUser, getRoleDashboardPath } from "@/lib/auth"
import { redirect } from "next/navigation"
import { registerServiceWorker } from "@/lib/register-sw"

export default async function HomePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  if (typeof window !== "undefined") {
    registerServiceWorker()
  }

  // Redirect to role-specific dashboard
  redirect(getRoleDashboardPath(user.role))
}
