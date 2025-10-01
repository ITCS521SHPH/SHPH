"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { getRoleDashboardPath } from "@/lib/auth"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Get user role to redirect to appropriate dashboard
      const { data: userProfile } = await supabase.from("users").select("role").eq("id", data.user.id).single()

      if (userProfile) {
        const dashboardPath = getRoleDashboardPath(userProfile.role)
        router.push(dashboardPath)
      } else {
        router.push("/")
      }
    } catch (error: any) {
      setError(error.message || "An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">SHPH Login</CardTitle>
        <CardDescription>Sign in to access your healthcare dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Demo Accounts:</p>
          <div className="text-xs space-y-1">
            <p>
              <strong>Doctor:</strong> dr.smith@shph.com / password123
            </p>
            <p>
              <strong>VHV:</strong> vhv.anna@shph.com / password123
            </p>
            <p>
              <strong>Patient:</strong> patient1@example.com / password123
            </p>
            <p>
              <strong>Caregiver:</strong> caregiver1@example.com / password123
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
