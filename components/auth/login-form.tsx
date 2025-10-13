"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Stethoscope, Users, Heart, User, AlertTriangle } from "lucide-react"
import { authenticateUser, setCurrentUser } from "@/lib/auth"

const userRoles = [
  { value: "doctor", label: "Doctor", icon: Stethoscope },
  { value: "vhv", label: "Village Health Volunteer", icon: Users },
  { value: "caregiver", label: "Caregiver", icon: Heart },
  { value: "patient", label: "Patient", icon: User },
]

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const user = authenticateUser(email, password)

      if (!user) {
        setError("Invalid email or password")
        setIsLoading(false)
        return
      }

      if (user.role !== role) {
        setError("Selected role does not match your account")
        setIsLoading(false)
        return
      }

      // Set current user in storage
      setCurrentUser(user)

      // Redirect based on role
      const dashboardRoutes = {
        doctor: "/doctor/dashboard",
        vhv: "/vhv/dashboard",
        caregiver: "/caregiver/dashboard",
        patient: "/patient/dashboard",
      }

      console.log("[v0] Login successful:", { email: user.email, role: user.role })
      router.push(dashboardRoutes[user.role])
    } catch (error) {
      console.error("[v0] Login error:", error)
      setError("An error occurred during login")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
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
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select value={role} onValueChange={setRole} required>
          <SelectTrigger>
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            {userRoles.map((userRole) => {
              const Icon = userRole.icon
              return (
                <SelectItem key={userRole.value} value={userRole.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {userRole.label}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading || !email || !password || !role}>
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        <p>Demo credentials for testing:</p>
        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
          {userRoles.map((userRole) => (
            <Card key={userRole.value} className="p-2">
              <CardContent className="p-0">
                <p className="font-medium">{userRole.label}</p>
                <p>demo@{userRole.value}.com</p>
                <p>password123</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </form>
  )
}
