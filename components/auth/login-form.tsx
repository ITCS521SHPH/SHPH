"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { authenticateUser, getDefaultRoute } from "@/lib/auth"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const user = await authenticateUser(email, password)

      if (!user) {
        setError("Invalid email or password")
        setIsLoading(false)
        return
      }

      // Automatically redirect based on user's role from API
      const defaultRoute = getDefaultRoute(user.role)
      console.log("[v0] Login successful:", { email: user.email, role: user.role })
      router.push(defaultRoute)
    } catch (error) {
      console.error("[v0] Login error:", error)
      setError("An error occurred during login")
      setIsLoading(false)
    }
  }

  const fillCredentials = (email: string, password: string) => {
    setEmail(email)
    setPassword(password)
    setError("")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <span className="text-red-500 font-bold">⚠</span>
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

      <Button type="submit" className="w-full" disabled={isLoading || !email || !password}>
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        <p className="mb-3">Demo credentials for testing:</p>
        <div className="grid grid-cols-2 gap-3 mt-2 text-xs">
          <Card className="p-3 cursor-pointer hover:bg-blue-50 transition-colors" onClick={() => fillCredentials("admin@demo.com", "admin123")}>
            <CardContent className="p-0">
              <p className="font-medium text-blue-600">Admin</p>
              <p className="font-mono">admin@demo.com</p>
              <p className="font-mono">admin123</p>
            </CardContent>
          </Card>
          <Card className="p-3 cursor-pointer hover:bg-green-50 transition-colors" onClick={() => fillCredentials("doctor@demo.com", "doctor123")}>
            <CardContent className="p-0">
              <p className="font-medium text-green-600">Doctor</p>
              <p className="font-mono">doctor@demo.com</p>
              <p className="font-mono">doctor123</p>
            </CardContent>
          </Card>
          <Card className="p-3 cursor-pointer hover:bg-purple-50 transition-colors" onClick={() => fillCredentials("vhv@demo.com", "vhv123")}>
            <CardContent className="p-0">
              <p className="font-medium text-purple-600">VHV</p>
              <p className="font-mono">vhv@demo.com</p>
              <p className="font-mono">vhv123</p>
            </CardContent>
          </Card>
          <Card className="p-3 cursor-pointer hover:bg-orange-50 transition-colors" onClick={() => fillCredentials("patient@demo.com", "patient123")}>
            <CardContent className="p-0">
              <p className="font-medium text-orange-600">Patient</p>
              <p className="font-mono">patient@demo.com</p>
              <p className="font-mono">patient123</p>
            </CardContent>
          </Card>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Click on any card to auto-fill the login form
        </p>
      </div>
    </form>
  )
}
