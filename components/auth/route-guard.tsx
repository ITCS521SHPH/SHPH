"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getCurrentUser, getCurrentUserFromStorage, canAccessRoute, getDefaultRoute, clearCurrentUser, type User } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RouteGuardProps {
  children: React.ReactNode
}

export function RouteGuard({ children }: RouteGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = async () => {
      // First check localStorage for cached user
      const cachedUser = getCurrentUserFromStorage()
      if (cachedUser) {
        setUser(cachedUser)
        
        // Check if user can access current route
        const canAccess = canAccessRoute(cachedUser.role, pathname)
        setHasAccess(canAccess)
        
        if (!canAccess) {
          console.log("[v0] Access denied for user:", cachedUser.email, "to route:", pathname)
        }
        
        setIsLoading(false)
        return
      }

      // No cached user, try to get current user from API
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          // Not authenticated, redirect to login
          router.push("/")
          return
        }

        setUser(currentUser)
        
        // Check if user can access current route
        const canAccess = canAccessRoute(currentUser.role, pathname)
        setHasAccess(canAccess)

        if (!canAccess) {
          console.log("[v0] Access denied for user:", currentUser.email, "to route:", pathname)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/")
        return
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [pathname, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">Please sign in to access this page.</p>
            <Button onClick={() => router.push("/")}>Go to Sign In</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
            <div className="space-y-2">
              <Button
                onClick={() => {
                  // Redirect to appropriate dashboard based on role
                  const defaultRoute = getDefaultRoute(user.role)
                  router.push(defaultRoute)
                }}
              >
                Go to My Dashboard
              </Button>
              <Button variant="outline" onClick={() => {
                clearCurrentUser()
                router.push("/")
              }}>
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
