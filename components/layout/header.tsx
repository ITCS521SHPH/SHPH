import { getCurrentUser, getRoleDisplayName } from "@/lib/auth"
import { LogoutButton } from "@/components/auth/logout-button"
import { Badge } from "@/components/ui/badge"
import { Heart } from "lucide-react"

export async function Header() {
  const user = await getCurrentUser()

  if (!user) return null

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Heart className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">SHPH</h1>
          </div>
          <Badge variant="secondary">{getRoleDisplayName(user.role)}</Badge>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <p className="font-medium">{user.full_name}</p>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
