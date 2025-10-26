"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, MapPin, Bell, Check, X, AlertCircle, Video, ArrowRight } from "lucide-react"
import { supabaseApi } from "@/lib/supabase-api"
import { getCurrentUserFromStorage } from "@/lib/auth"
import Link from "next/link"

interface Appointment {
  id: string
  providerId: string
  providerName: string
  type: string
  scheduledDate: string
  scheduledTime: string
  location: string
  status: string
  notes?: string
  canJoinCall: boolean
}

export function PatientAppointmentDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [rescheduleForm, setRescheduleForm] = useState({
    newDate: "",
    newTime: "",
    reason: "",
  })

  const currentUser = getCurrentUserFromStorage()

  // Load appointments from database
  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    if (!currentUser?.id) return

    try {
      setLoading(true)
      const data = await supabaseApi.getPatientAppointments(currentUser.id)

      // Transform data to match component interface
      const transformedAppointments = data.map((apt) => ({
        id: apt.id,
        providerId: apt.providerId,
        providerName: apt.providerName || "Dr. Provider",
        type: apt.type,
        scheduledDate: apt.scheduledDate,
        scheduledTime: apt.scheduledTime,
        location: apt.location || "Medical Center",
        status: apt.status,
        notes: apt.notes,
        canJoinCall: apt.type.toLowerCase().includes("telemedicine") || apt.type.toLowerCase().includes("virtual"),
      }))

      setAppointments(transformedAppointments)
    } catch (error) {
      console.error("[v0] Error loading appointments:", error)
    } finally {
      setLoading(false)
    }
  }

  // Categorize appointments
  const upcomingAppointments = useMemo(() => {
    const today = new Date().toISOString().split("T")[0]
    return appointments
      .filter((apt) => apt.status === "scheduled" && apt.scheduledDate >= today)
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate) || a.scheduledTime.localeCompare(b.scheduledTime))
  }, [appointments])

  const pastAppointments = useMemo(() => {
    const today = new Date().toISOString().split("T")[0]
    return appointments
      .filter((apt) => apt.scheduledDate < today || apt.status === "completed")
      .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate) || b.scheduledTime.localeCompare(a.scheduledTime))
  }, [appointments])

  // Count reminders (appointments within 7 days)
  const reminderCount = useMemo(() => {
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return upcomingAppointments.filter((apt) => {
      const aptDate = new Date(apt.scheduledDate)
      return aptDate <= sevenDaysFromNow
    }).length
  }, [upcomingAppointments])

  // Handle confirming appointment
  const handleConfirmAppointment = async () => {
    if (!selectedAppointment) return

    try {
      await supabaseApi.updateAppointmentStatus(selectedAppointment.id, "scheduled", "Patient confirmed attendance")
      await loadAppointments()
      setShowConfirmDialog(false)
      setSelectedAppointment(null)
      alert("Appointment confirmed! You will receive a confirmation email shortly.")
    } catch (error) {
      console.error("[v0] Error confirming appointment:", error)
      alert("Failed to confirm appointment. Please try again.")
    }
  }

  // Handle canceling appointment
  const handleCancelAppointment = async () => {
    if (!selectedAppointment || !cancelReason.trim()) {
      alert("Please provide a reason for cancellation")
      return
    }

    try {
      await supabaseApi.updateAppointmentStatus(
        selectedAppointment.id,
        "cancelled",
        `Cancelled by patient: ${cancelReason}`,
      )
      await loadAppointments()
      setShowCancelDialog(false)
      setSelectedAppointment(null)
      setCancelReason("")
      alert("Appointment cancelled. The doctor's office has been notified.")
    } catch (error) {
      console.error("[v0] Error cancelling appointment:", error)
      alert("Failed to cancel appointment. Please try again.")
    }
  }

  // Handle rescheduling appointment
  const handleRescheduleAppointment = async () => {
    if (!selectedAppointment || !rescheduleForm.newDate || !rescheduleForm.newTime) {
      alert("Please select a new date and time")
      return
    }

    if (!currentUser?.id) {
      alert("User not found. Please log in again.")
      return
    }

    try {
      await supabaseApi.createRescheduleRequest({
        appointmentId: selectedAppointment.id,
        patientId: currentUser.id,
        requestedDate: rescheduleForm.newDate,
        requestedTime: rescheduleForm.newTime,
        reason: rescheduleForm.reason,
      })

      alert("Reschedule request submitted. The doctor's office will confirm your new appointment time.")
      setShowRescheduleDialog(false)
      setSelectedAppointment(null)
      setRescheduleForm({ newDate: "", newTime: "", reason: "" })
    } catch (error) {
      console.error("[v0] Error submitting reschedule request:", error)
      alert("Failed to submit reschedule request. Please try again.")
    }
  }

  // Handle joining video call
  const handleJoinCall = (appointmentId: string) => {
    alert("Connecting to video call...")
    // In real implementation, this would open the video call interface
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading appointments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
            <p className="text-xs text-muted-foreground">
              Next: {upcomingAppointments[0]?.scheduledDate || "None scheduled"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reminders</CardTitle>
            <Bell className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reminderCount}</div>
            <p className="text-xs text-muted-foreground">
              {reminderCount > 0 ? "Within next 7 days" : "All caught up"}
            </p>
            {reminderCount > 0 && (
              <Link href="/patient/reminders">
                <Button variant="link" size="sm" className="px-0 h-auto mt-2">
                  View Reminders
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Past Appointments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pastAppointments.length}</div>
            <p className="text-xs text-muted-foreground">Completed visits</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>Your scheduled healthcare visits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming appointments</p>
              <p className="text-sm mt-2">Contact your healthcare provider to schedule a visit</p>
            </div>
          ) : (
            upcomingAppointments.map((appointment) => (
              <Card key={appointment.id} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{appointment.type}</h4>
                      <p className="text-sm text-muted-foreground">{appointment.providerName}</p>
                    </div>
                    <Badge variant="default">{appointment.status}</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {new Date(appointment.scheduledDate).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{appointment.scheduledTime}</span>
                    </div>
                    <div className="flex items-center gap-2 md:col-span-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{appointment.location}</span>
                    </div>
                  </div>

                  {appointment.notes && (
                    <div className="bg-muted/50 p-3 rounded-lg mb-4 text-sm">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p>{appointment.notes}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {appointment.canJoinCall && (
                      <Button size="sm" onClick={() => handleJoinCall(appointment.id)}>
                        <Video className="h-4 w-4 mr-2" />
                        Join Video Call
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedAppointment(appointment)
                        setShowConfirmDialog(true)
                      }}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedAppointment(appointment)
                        setRescheduleForm({
                          newDate: appointment.scheduledDate,
                          newTime: appointment.scheduledTime,
                          reason: "",
                        })
                        setShowRescheduleDialog(true)
                      }}
                    >
                      Reschedule
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedAppointment(appointment)
                        setShowCancelDialog(true)
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Past Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Past Appointments</CardTitle>
          <CardDescription>Your appointment history</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pastAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No past appointments</p>
            </div>
          ) : (
            pastAppointments.slice(0, 5).map((appointment) => (
              <Card key={appointment.id} className="border-l-4 border-l-gray-300">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{appointment.type}</h4>
                      <p className="text-sm text-muted-foreground">{appointment.providerName}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{new Date(appointment.scheduledDate).toLocaleDateString()}</span>
                        <span>{appointment.scheduledTime}</span>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {appointment.status === "completed" ? "Completed" : appointment.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Appointment</DialogTitle>
            <DialogDescription>Please confirm your attendance for this appointment</DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p>
                  <strong>Provider:</strong> {selectedAppointment.providerName}
                </p>
                <p>
                  <strong>Type:</strong> {selectedAppointment.type}
                </p>
                <p>
                  <strong>Date:</strong> {new Date(selectedAppointment.scheduledDate).toLocaleDateString()}
                </p>
                <p>
                  <strong>Time:</strong> {selectedAppointment.scheduledTime}
                </p>
                <p>
                  <strong>Location:</strong> {selectedAppointment.location}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                By confirming, you acknowledge that you will attend this appointment. You will receive a confirmation
                email with all the details.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAppointment}>
              <Check className="h-4 w-4 mr-2" />
              Confirm Appointment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>Please provide a reason for canceling this appointment</DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p>
                  <strong>Provider:</strong> {selectedAppointment.providerName}
                </p>
                <p>
                  <strong>Date:</strong> {new Date(selectedAppointment.scheduledDate).toLocaleDateString()}
                </p>
                <p>
                  <strong>Time:</strong> {selectedAppointment.scheduledTime}
                </p>
              </div>
              <div>
                <Label htmlFor="cancelReason">Reason for Cancellation *</Label>
                <Textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please explain why you need to cancel..."
                  rows={4}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Appointment
            </Button>
            <Button variant="destructive" onClick={handleCancelAppointment}>
              <X className="h-4 w-4 mr-2" />
              Cancel Appointment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>Request a new date and time for your appointment</DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p>
                  <strong>Current Date:</strong> {new Date(selectedAppointment.scheduledDate).toLocaleDateString()}
                </p>
                <p>
                  <strong>Current Time:</strong> {selectedAppointment.scheduledTime}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newDate">New Date *</Label>
                  <Input
                    id="newDate"
                    type="date"
                    value={rescheduleForm.newDate}
                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, newDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="newTime">New Time *</Label>
                  <Input
                    id="newTime"
                    type="time"
                    value={rescheduleForm.newTime}
                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, newTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="rescheduleReason">Reason for Rescheduling</Label>
                <Textarea
                  id="rescheduleReason"
                  value={rescheduleForm.reason}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, reason: e.target.value })}
                  placeholder="Optional: Explain why you need to reschedule..."
                  rows={3}
                />
              </div>

              <p className="text-sm text-muted-foreground">
                Your reschedule request will be sent to the doctor's office for approval. You will be notified once it's
                confirmed.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRescheduleAppointment}>Submit Request</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
