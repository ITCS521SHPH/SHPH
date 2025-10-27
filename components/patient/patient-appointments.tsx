"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, MapPin, User, Check, Video, AlertCircle } from "lucide-react"
import { format, isPast, parseISO, isFuture } from "date-fns"

interface Appointment {
  id: string
  patientId: string
  providerId: string
  providerName: string
  type: string
  scheduledDate: string
  scheduledTime: string
  location: string
  status: string
  notes?: string
  confirmedByPatient: boolean
  createdAt: string
  updatedAt: string
}

interface PatientAppointmentsProps {
  patientId: string
}

export function PatientAppointments({ patientId }: PatientAppointmentsProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [rescheduleForm, setRescheduleForm] = useState({
    newDate: "",
    newTime: "",
    reason: "",
  })

  const fetchAppointments = async () => {
    if (!patientId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/patient/appointments?patientId=${patientId}`)
      if (!response.ok) throw new Error("Failed to fetch appointments")
      const data = await response.json()
      setAppointments(data)
    } catch (error) {
      console.error("[v0] Failed to fetch appointments:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [patientId])

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/patient/appointments/${appointmentId}/confirm`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to confirm appointment")

      alert("Appointment confirmed successfully!")
      fetchAppointments()
    } catch (error) {
      console.error("[v0] Failed to confirm appointment:", error)
      alert("Failed to confirm appointment. Please try again.")
    }
  }

  const handleRescheduleRequest = async () => {
    if (!selectedAppointment || !rescheduleForm.newDate || !rescheduleForm.newTime) {
      alert("Please fill in all required fields")
      return
    }

    try {
      const response = await fetch("/api/patient/reschedule-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: selectedAppointment.id,
          patientId,
          requestedDate: rescheduleForm.newDate,
          requestedTime: rescheduleForm.newTime,
          reason: rescheduleForm.reason,
        }),
      })

      if (!response.ok) throw new Error("Failed to submit reschedule request")

      alert("Reschedule request submitted successfully! Your doctor will review it shortly.")
      setShowRescheduleDialog(false)
      setSelectedAppointment(null)
      setRescheduleForm({ newDate: "", newTime: "", reason: "" })
      fetchAppointments()
    } catch (error) {
      console.error("[v0] Failed to submit reschedule request:", error)
      alert("Failed to submit reschedule request. Please try again.")
    }
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/patient/appointments/${appointmentId}/cancel`, {
        method: "POST",
      })
      if (!response.ok) throw new Error("Failed to cancel appointment")
      alert("Appointment cancelled.")
      fetchAppointments()
    } catch (error) {
      console.error("[v0] Failed to cancel appointment:", error)
      alert("Failed to cancel appointment. Please try again.")
    }
  }

  const handleJoinCall = (appointmentId: string) => {
    // TODO: Implement video call functionality
    console.log("[v0] Joining call for appointment:", appointmentId)
    alert("Video call functionality will be implemented soon!")
  }

  const upcomingAppointments = appointments.filter(
    (apt) =>
      apt.status !== "cancelled" &&
      (isFuture(parseISO(apt.scheduledDate)) || apt.scheduledDate === format(new Date(), "yyyy-MM-dd")),
  )

  const pastAppointments = appointments.filter(
    (apt) =>
      apt.status === "completed" ||
      (isPast(parseISO(apt.scheduledDate)) && apt.scheduledDate !== format(new Date(), "yyyy-MM-dd")),
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading appointments...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Appointments
          </CardTitle>
          <CardDescription>Your scheduled visits and check-ups</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming appointments</p>
              <p className="text-sm mt-2">Your scheduled appointments will appear here</p>
            </div>
          ) : (
            upcomingAppointments.map((appointment) => (
              <Card key={appointment.id} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-lg">{appointment.type}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(appointment.scheduledDate), "EEEE, MMMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant={appointment.confirmedByPatient ? "default" : "secondary"}>
                        {appointment.confirmedByPatient ? "Confirmed" : "Pending Confirmation"}
                      </Badge>
                      <Badge variant="outline">{appointment.status}</Badge>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{appointment.providerName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{appointment.scheduledTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{appointment.location}</span>
                    </div>
                  </div>

                  {appointment.notes && (
                    <div className="mb-4 p-3 bg-muted/50 rounded-md">
                      <p className="text-sm">
                        <span className="font-medium">Notes:</span> {appointment.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {!appointment.confirmedByPatient && (
                      <Button
                        size="sm"
                        onClick={() => handleConfirmAppointment(appointment.id)}
                        className="flex items-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Confirm Appointment
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancelAppointment(appointment.id)}
                    >
                      Cancel Appointment
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleJoinCall(appointment.id)}
                      className="flex items-center gap-2"
                    >
                      <Video className="h-4 w-4" />
                      Join Video Call
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
                      Request Reschedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Past Appointments
            </CardTitle>
            <CardDescription>Your appointment history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pastAppointments.map((appointment) => (
              <Card key={appointment.id} className="border-l-4 border-l-gray-400 opacity-75">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{appointment.type}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(appointment.scheduledDate), "MMMM d, yyyy")} at {appointment.scheduledTime}
                      </p>
                    </div>
                    <Badge variant="outline">{appointment.status}</Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{appointment.providerName}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Reschedule</DialogTitle>
            <DialogDescription>
              Submit a request to reschedule your appointment. Your doctor will review and approve it.
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium mb-1">Current Appointment</p>
                <p className="text-sm text-muted-foreground">
                  {selectedAppointment.type} with {selectedAppointment.providerName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(selectedAppointment.scheduledDate), "MMMM d, yyyy")} at{" "}
                  {selectedAppointment.scheduledTime}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>New Date *</Label>
                  <Input
                    type="date"
                    value={rescheduleForm.newDate}
                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, newDate: e.target.value })}
                    min={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>New Time *</Label>
                  <Select
                    value={rescheduleForm.newTime}
                    onValueChange={(value) => setRescheduleForm({ ...rescheduleForm, newTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="08:00">8:00 AM</SelectItem>
                      <SelectItem value="09:00">9:00 AM</SelectItem>
                      <SelectItem value="10:00">10:00 AM</SelectItem>
                      <SelectItem value="11:00">11:00 AM</SelectItem>
                      <SelectItem value="12:00">12:00 PM</SelectItem>
                      <SelectItem value="13:00">1:00 PM</SelectItem>
                      <SelectItem value="14:00">2:00 PM</SelectItem>
                      <SelectItem value="15:00">3:00 PM</SelectItem>
                      <SelectItem value="16:00">4:00 PM</SelectItem>
                      <SelectItem value="17:00">5:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reason for Rescheduling</Label>
                <Textarea
                  placeholder="Please explain why you need to reschedule..."
                  value={rescheduleForm.reason}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, reason: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Your reschedule request will be sent to your doctor for approval. You will be notified once it's
                  reviewed.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRescheduleRequest}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
