"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser, type User } from "@/lib/auth"
import { Users, Calendar, FileText, Activity, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setIsLoading(false)
  }, [])

  const handleLogin = (success: boolean) => {
    if (success) {
      const currentUser = getCurrentUser()
      setUser(currentUser)
    }
  }

  const handleLogout = () => {
    setUser(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />
  }

  const getQuickActions = () => {
    switch (user.role) {
      case "admin":
        return [
          { title: "Manage Users", description: "Add and manage system users", icon: Users, href: "/users" },
          { title: "System Settings", description: "Configure system preferences", icon: Activity, href: "/settings" },
          { title: "Reports", description: "View system reports and analytics", icon: FileText, href: "/reports" },
        ]
      case "doctor":
        return [
          {
            title: "Doctor Dashboard",
            description: "Monitor patients and treatments",
            icon: Activity,
            href: "/doctor",
          },
          { title: "Patient Registry", description: "View and manage patient records", icon: Users, href: "/patients" },
          {
            title: "Appointments",
            description: "Schedule and manage appointments",
            icon: Calendar,
            href: "/appointments",
          },
          {
            title: "Medical Records",
            description: "Access patient medical history",
            icon: FileText,
            href: "/medical-records",
          },
        ]
      case "patient":
        return [
          { title: "My Records", description: "View your medical history", icon: FileText, href: "/my-records" },
          {
            title: "Appointments",
            description: "View upcoming appointments",
            icon: Calendar,
            href: "/my-appointments",
          },
          { title: "Health Data", description: "Track your health metrics", icon: Activity, href: "/health-data" },
        ]
      case "caregiver":
        return [
          {
            title: "Assigned Patients",
            description: "View patients under your care",
            icon: Users,
            href: "/assigned-patients",
          },
          {
            title: "Care Activities",
            description: "Record daily care activities",
            icon: Activity,
            href: "/care-activities",
          },
          {
            title: "Medication Reminders",
            description: "Manage medication schedules",
            icon: Calendar,
            href: "/medications",
          },
        ]
      case "vhv":
        return [
          {
            title: "Community Visits",
            description: "Plan and track community visits",
            icon: Users,
            href: "/community-visits",
          },
          {
            title: "Data Collection",
            description: "Collect health data from visits",
            icon: FileText,
            href: "/data-collection",
          },
          {
            title: "Health Campaigns",
            description: "Manage health awareness campaigns",
            icon: Activity,
            href: "/campaigns",
          },
        ]
      default:
        return []
    }
  }

  const quickActions = getQuickActions()

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onLogout={handleLogout} />
      <main className="container mx-auto p-6">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-balance">Welcome back, {user.name}</h2>
            <p className="text-muted-foreground text-lg">
              {user.role === "admin" && "Manage the healthcare system and oversee all operations."}
              {user.role === "doctor" && "Review patients, manage treatments, and provide quality care."}
              {user.role === "patient" && "Access your health records and stay connected with your care team."}
              {user.role === "caregiver" && "Monitor assigned patients and provide compassionate care."}
              {user.role === "vhv" && "Support your community through health visits and education."}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Quick Actions</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {quickActions.map((action, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer group">
                  <Link href={action.href}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <action.icon className="w-8 h-8 text-primary" />
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardTitle className="text-lg mb-2">{action.title}</CardTitle>
                      <CardDescription>{action.description}</CardDescription>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Activity / Stats */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Overview</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                      <p className="text-2xl font-bold">2,847</p>
                    </div>
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Today's Appointments</p>
                      <p className="text-2xl font-bold">12</p>
                    </div>
                    <Calendar className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">High Risk Patients</p>
                      <p className="text-2xl font-bold">23</p>
                    </div>
                    <Activity className="w-8 h-8 text-destructive" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending Follow-ups</p>
                      <p className="text-2xl font-bold">8</p>
                    </div>
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
