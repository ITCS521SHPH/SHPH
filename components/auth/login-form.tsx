"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Heart, Shield, User, Users, Stethoscope } from "lucide-react"
import { authenticateUser, setCurrentUser, type UserRole } from "@/lib/auth"

interface LoginFormProps {
  onLogin: (success: boolean) => void
}

const roleIcons = {
  admin: Shield,
  doctor: Stethoscope,
  patient: User,
  caregiver: Heart,
  vhv: Users,
}

const roleLabels = {
  admin: "Administrator",
  doctor: "Doctor",
  patient: "Patient",
  caregiver: "Caregiver",
  vhv: "Village Health Volunteer",
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [selectedRole, setSelectedRole] = useState<UserRole>("doctor")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const user = await authenticateUser(email, password)
      if (user && user.role === selectedRole) {
        setCurrentUser(user)
        onLogin(true)
      } else {
        setError("Invalid credentials or role mismatch")
        onLogin(false)
      }
    } catch (err) {
      setError("Login failed. Please try again.")
      onLogin(false)
    } finally {
      setIsLoading(false)
    }
  }

  const quickLogin = (role: UserRole) => {
    const roleEmails = {
      admin: "admin@healthcare.com",
      doctor: "dr.smith@healthcare.com",
      patient: "patient@example.com",
      caregiver: "caregiver@healthcare.com",
      vhv: "vhv@community.com",
    }

    setEmail(roleEmails[role])
    setPassword("password123")
    setSelectedRole(role)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-balance">HealthCare EMR</CardTitle>
            <CardDescription className="text-muted-foreground">Electronic Medical Records System</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Login as</Label>
              <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([role, label]) => {
                    const Icon = roleIcons[role as UserRole]
                    return (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
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
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="space-y-3">
            <div className="text-sm text-muted-foreground text-center">Quick login for demo:</div>
            <div className="grid grid-cols-2 gap-2 rounded-xl">
              {Object.entries(roleLabels).map(([role, label]) => {
                const Icon = roleIcons[role as UserRole]
                return (
                  <Button
                    key={role}
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin(role as UserRole)}
                    className="text-xs"
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {label}
                  </Button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
