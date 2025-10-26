"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Calendar, Clock, MapPin, Check, X, AlertTriangle } from "lucide-react"
import { supabaseApi } from "@/lib/supabase-api"
import { getCurrentUserFromStorage } from "@/lib/auth"

interface Reminder {
  id: string
  appointmentId: string
  providerName: string
  type: string
  scheduledDate: string
  scheduledTime: string
  location: string
  daysUntil: number
  hoursUntil: number
  urgency: "urgent" | "soon" | "upcoming"
  needsConfirmation: boolean
}

export function AppointmentReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const currentUser = getCurrentUserFromStorage()

  useEffect(() => {
    loadReminders()
    // Refresh reminders every 5 minutes
    const interval = setInterval(loadReminders, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadReminders = async () => {
    if (!currentUser?.id) return

    try {
      setLoading(true)
      const appointments = await supabaseApi.getPatientAppointments(currentUser.id)

      const now = new Date()
      const upcomingReminders: Reminder[] = []

      for (const apt of appointments) {
        if (apt.status !== "scheduled") continue

        const aptDateTime = new Date(`${apt.scheduledDate}T${apt.scheduledTime}`)
        const diffMs = aptDateTime.getTime() - now.getTime()
        const diffHours = diffMs / (1000 * 60 * 60)
        const diffDays = diffMs / (1000 * 60 * 60 * 24)

        // Only show reminders for appointments within the next 7 days
        if (diffDays > 0 && diffDays <= 7) {
          let urgency: "urgent" | "soon" | "upcoming" = "upcoming"
          if (diffHours <= 24) urgency = "urgent"
          else if (diffDays <= 3) urgency = "soon"

          upcomingReminders.push({
            id: `reminder-${apt.id}`,
            appointmentId: apt.id,
            providerName: apt.providerName || "Healthcare Provider",
            type: apt.type,
            scheduledDate: apt.scheduledDate,
            scheduledTime: apt.scheduledTime,
            location: apt.location || "Medical Center",
            daysUntil: Math.ceil(diffDays),
            hoursUntil: Math.ceil(diffHours),
            urgency,
            needsConfirmation: diffDays <= 2, // Need confirmation if within 2 days
          })
        }
      }

      // Sort by urgency and time
      upcomingReminders.sort((a, b) => {
        const urgencyOrder = { urgent: 0, soon: 1, upcoming: 2 }
        if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
          return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
        }
        return a.hoursUntil - b.hoursUntil
      })

      setReminders(upcomingReminders)
    } catch (error) {
      console.error("[v0] Error loading reminders:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (reminder: Reminder) => {
    setProcessingId(reminder.appointmentId)
    try {
      await supabaseApi.updateAppointmentStatus(reminder.appointmentId, "scheduled", "Patient confirmed attendance")
      await loadReminders()
    } catch (error) {
      console.error("[v0] Error confirming appointment:", error)
      alert("Failed to confirm appointment. Please try again.")
    } finally {
      setProcessingId(null)
    }
  }

  const handleDismiss = (reminderId: string) => {
    // Remove reminder from local state (in real app, would mark as dismissed in DB)
    setReminders(reminders.filter((r) => r.id !== reminderId))
  }

  const urgentReminders = useMemo(() => reminders.filter((r) => r.urgency === "urgent"), [reminders])
  const soonReminders = useMemo(() => reminders.filter((r) => r.urgency === "soon"), [reminders])
  const upcomingReminders = useMemo(() => reminders.filter((r) => r.urgency === "upcoming"), [reminders])

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (reminders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Appointment Reminders
          </CardTitle>
          <CardDescription>Stay on top of your upcoming appointments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No upcoming appointments in the next 7 days</p>
            <p className="text-sm mt-2">You're all caught up!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Urgent Reminders (within 24 hours) */}
      {urgentReminders.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Urgent - Appointment Soon!
            </CardTitle>
            <CardDescription>These appointments are within the next 24 hours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {urgentReminders.map((reminder) => (
              <Card key={reminder.id} className="bg-white dark:bg-gray-900">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="destructive">
                          {reminder.hoursUntil <= 1
                            ? "In less than 1 hour"
                            : `In ${reminder.hoursUntil} ${reminder.hoursUntil === 1 ? "hour" : "hours"}`}
                        </Badge>
                        {reminder.needsConfirmation && <Badge variant="outline">Needs Confirmation</Badge>}
                      </div>
                      <h4 className="font-semibold text-lg">{reminder.type}</h4>
                      <p className="text-sm text-muted-foreground">{reminder.providerName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(reminder.scheduledDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{reminder.scheduledTime}</span>
                    </div>
                    <div className="flex items-center gap-2 md:col-span-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{reminder.location}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {reminder.needsConfirmation && (
                      <Button
                        size="sm"
                        onClick={() => handleConfirm(reminder)}
                        disabled={processingId === reminder.appointmentId}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        {processingId === reminder.appointmentId ? "Confirming..." : "Confirm Attendance"}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleDismiss(reminder.id)}>
                      <X className="h-4 w-4 mr-2" />
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Soon Reminders (2-3 days) */}
      {soonReminders.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <Bell className="h-5 w-5" />
              Coming Up Soon
            </CardTitle>
            <CardDescription>Appointments in the next 2-3 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {soonReminders.map((reminder) => (
              <Card key={reminder.id} className="bg-white dark:bg-gray-900">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">
                          In {reminder.daysUntil} {reminder.daysUntil === 1 ? "day" : "days"}
                        </Badge>
                        {reminder.needsConfirmation && <Badge variant="outline">Needs Confirmation</Badge>}
                      </div>
                      <h4 className="font-semibold">{reminder.type}</h4>
                      <p className="text-sm text-muted-foreground">{reminder.providerName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(reminder.scheduledDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{reminder.scheduledTime}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {reminder.needsConfirmation && (
                      <Button
                        size="sm"
                        onClick={() => handleConfirm(reminder)}
                        disabled={processingId === reminder.appointmentId}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Confirm
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleDismiss(reminder.id)}>
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Reminders (4-7 days) */}
      {upcomingReminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Upcoming This Week
            </CardTitle>
            <CardDescription>Appointments in 4-7 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingReminders.map((reminder) => (
              <Card key={reminder.id} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">
                          In {reminder.daysUntil} {reminder.daysUntil === 1 ? "day" : "days"}
                        </Badge>
                      </div>
                      <h4 className="font-medium">{reminder.type}</h4>
                      <p className="text-sm text-muted-foreground">{reminder.providerName}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{new Date(reminder.scheduledDate).toLocaleDateString()}</span>
                        <span>{reminder.scheduledTime}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleDismiss(reminder.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
