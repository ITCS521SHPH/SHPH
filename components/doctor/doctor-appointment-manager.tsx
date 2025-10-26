"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, User, Check, X, AlertCircle, FileText, Phone } from "lucide-react"
import { supabaseApi } from "@/lib/supabase-api"
import { getCurrentUserFromStorage } from "@/lib/auth"

interface AppointmentRequest {
  id: string
  patientId: string
  patientName: string
  patientPhone?: string
  appointmentType: string
  scheduledDate: string
  scheduledTime: string
  status: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

interface RescheduleRequest {
  id: string
  appointmentId: string
  patientId: string
  patientName: string
  originalDate: string
  originalTime: string
  requestedDate: string
  requestedTime: string
  reason?: string
  status: string
  createdAt: Date
}

export function DoctorAppointmentManager() {
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([])
  const [rescheduleRequests, setRescheduleRequests] = useState<RescheduleRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRequest | null>(null)
  const [selectedReschedule, setSelectedReschedule] = useState<RescheduleRequest | null>(null)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [approvalNotes, setApprovalNotes] = useState("")

  const currentUser = getCurrentUserFromStorage()

  // Load appointments and reschedule requests
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    if (!currentUser?.id) return

    try {
      setLoading(true)
      // Load appointments for this doctor
      const appointmentsData = await supabaseApi.getDoctorAppointments(currentUser.id)
      setAppointments(appointmentsData)

      // Load reschedule requests
      const rescheduleData = await supabaseApi.getDoctorRescheduleRequests(currentUser.id)
      setRescheduleRequests(rescheduleData)
    } catch (error) {
      console.error("[v0] Error loading appointment data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Categorize appointments
  const pendingAppointments = useMemo(() => {
    return appointments
      .filter((apt) => apt.status === "scheduled")
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate) || a.scheduledTime.localeCompare(b.scheduledTime))
  }, [appointments])

  const upcomingAppointments = useMemo(() => {
    const today = new Date().toISOString().split("T")[0]
    return appointments
      .filter((apt) => apt.status === "scheduled" && apt.scheduledDate >= today)
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate) || a.scheduledTime.localeCompare(b.scheduledTime))
  }, [appointments])

  const completedAppointments = useMemo(() => {
    return appointments
      .filter((apt) => apt.status === "completed")
      .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate) || b.scheduledTime.localeCompare(a.scheduledTime))
  }, [appointments])

  const pendingReschedules = useMemo(() => {
    return rescheduleRequests.filter((req) => req.status === "pending")
  }, [rescheduleRequests])

  // Handle approving appointment
  const handleApproveAppointment = async () => {
    if (!selectedAppointment) return

    try {
      await supabaseApi.updateAppointmentStatus(selectedAppointment.id, "scheduled", approvalNotes)
      await loadData()
      setShowApproveDialog(false)
      setSelectedAppointment(null)
      setApprovalNotes("")
    } catch (error) {
      console.error("[v0] Error approving appointment:", error)
      alert("Failed to approve appointment. Please try again.")
    }
  }

  // Handle rejecting appointment
  const handleRejectAppointment = async () => {
    if (!selectedAppointment || !rejectReason.trim()) {
      alert("Please provide a reason for rejection")
      return
    }

    try {
      await supabaseApi.updateAppointmentStatus(selectedAppointment.id, "cancelled", rejectReason)
      await loadData()
      setShowRejectDialog(false)
      setSelectedAppointment(null)
      setRejectReason("")
    } catch (error) {
      console.error("[v0] Error rejecting appointment:", error)
      alert("Failed to reject appointment. Please try again.")
    }
  }

  // Handle approving reschedule request
  const handleApproveReschedule = async () => {
    if (!selectedReschedule) return

    try {
      await supabaseApi.approveRescheduleRequest(
        selectedReschedule.id,
        selectedReschedule.appointmentId,
        selectedReschedule.requestedDate,
        selectedReschedule.requestedTime,
      )
      await loadData()
      setShowRescheduleDialog(false)
      setSelectedReschedule(null)
    } catch (error) {
      console.error("[v0] Error approving reschedule:", error)
      alert("Failed to approve reschedule request. Please try again.")
    }
  }

  // Handle rejecting reschedule request
  const handleRejectReschedule = async () => {
    if (!selectedReschedule) return

    try {
      await supabaseApi.rejectRescheduleRequest(selectedReschedule.id)
      await loadData()
      setShowRescheduleDialog(false)
      setSelectedReschedule(null)
    } catch (error) {
      console.error("[v0] Error rejecting reschedule:", error)
      alert("Failed to reject reschedule request. Please try again.")
    }
  }

  // Handle marking appointment as completed
  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      await supabaseApi.updateAppointmentStatus(appointmentId, "completed")
      await loadData()
    } catch (error) {
      console.error("[v0] Error completing appointment:", error)
      alert("Failed to mark appointment as completed. Please try again.")
    }
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingAppointments.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting your review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled appointments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reschedule Requests</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReschedules.length}</div>
            <p className="text-xs text-muted-foreground">Pending approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedAppointments.length}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Requests
            {pendingAppointments.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingAppointments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reschedule">
            Reschedule Requests
            {pendingReschedules.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingReschedules.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        {/* Pending Appointments Tab */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Appointment Requests</CardTitle>
              <CardDescription>Review and approve or reject appointment requests from patients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingAppointments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Check className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending appointment requests</p>
                  <p className="text-sm mt-2">All requests have been reviewed</p>
                </div>
              ) : (
                pendingAppointments.map((appointment) => (
                  <Card key={appointment.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{appointment.appointmentType}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <User className="h-3 w-3" />
                            {appointment.patientName}
                          </p>
                          {appointment.patientPhone && (
                            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                              <Phone className="h-3 w-3" />
                              {appointment.patientPhone}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary">Pending Review</Badge>
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
                      </div>

                      {appointment.notes && (
                        <div className="bg-muted/50 p-3 rounded-lg mb-4 text-sm">
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium mb-1">Patient Notes:</p>
                              <p>{appointment.notes}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedAppointment(appointment)
                            setShowApproveDialog(true)
                          }}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAppointment(appointment)
                            setShowRejectDialog(true)
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reschedule Requests Tab */}
        <TabsContent value="reschedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reschedule Requests</CardTitle>
              <CardDescription>Review patient requests to reschedule their appointments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingReschedules.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending reschedule requests</p>
                </div>
              ) : (
                pendingReschedules.map((request) => (
                  <Card key={request.id} className="border-l-4 border-l-purple-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">Reschedule Request</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <User className="h-3 w-3" />
                            {request.patientName}
                          </p>
                        </div>
                        <Badge variant="secondary">Pending</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                          <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-2">Current Time</p>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(request.originalDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span>{request.originalTime}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                          <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-2">Requested Time</p>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(request.requestedDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span>{request.requestedTime}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {request.reason && (
                        <div className="bg-muted/50 p-3 rounded-lg mb-4 text-sm">
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium mb-1">Reason:</p>
                              <p>{request.reason}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedReschedule(request)
                            setShowRescheduleDialog(true)
                          }}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedReschedule(request)
                            handleRejectReschedule()
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upcoming Appointments Tab */}
        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>Your scheduled appointments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming appointments</p>
                </div>
              ) : (
                upcomingAppointments.map((appointment) => (
                  <Card key={appointment.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{appointment.appointmentType}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <User className="h-3 w-3" />
                            {appointment.patientName}
                          </p>
                        </div>
                        <Badge variant="default">Scheduled</Badge>
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
                      </div>

                      {appointment.notes && (
                        <div className="bg-muted/50 p-3 rounded-lg mb-4 text-sm">
                          <p>{appointment.notes}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleCompleteAppointment(appointment.id)}>
                          <Check className="h-4 w-4 mr-2" />
                          Mark as Completed
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completed Appointments Tab */}
        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Appointments</CardTitle>
              <CardDescription>Your appointment history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {completedAppointments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No completed appointments</p>
                </div>
              ) : (
                completedAppointments.slice(0, 10).map((appointment) => (
                  <Card key={appointment.id} className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{appointment.appointmentType}</h4>
                          <p className="text-sm text-muted-foreground">{appointment.patientName}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>{new Date(appointment.scheduledDate).toLocaleDateString()}</span>
                            <span>{appointment.scheduledTime}</span>
                          </div>
                        </div>
                        <Badge variant="secondary">Completed</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve Appointment Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Appointment</DialogTitle>
            <DialogDescription>Confirm this appointment request</DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p>
                  <strong>Patient:</strong> {selectedAppointment.patientName}
                </p>
                <p>
                  <strong>Type:</strong> {selectedAppointment.appointmentType}
                </p>
                <p>
                  <strong>Date:</strong> {new Date(selectedAppointment.scheduledDate).toLocaleDateString()}
                </p>
                <p>
                  <strong>Time:</strong> {selectedAppointment.scheduledTime}
                </p>
              </div>

              <div>
                <Label htmlFor="approvalNotes">Notes (Optional)</Label>
                <Textarea
                  id="approvalNotes"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add any notes for the patient..."
                  rows={3}
                />
              </div>

              <p className="text-sm text-muted-foreground">
                The patient will be notified via email and SMS about the confirmed appointment.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApproveAppointment}>
              <Check className="h-4 w-4 mr-2" />
              Approve Appointment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Appointment Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Appointment</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this appointment request</DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p>
                  <strong>Patient:</strong> {selectedAppointment.patientName}
                </p>
                <p>
                  <strong>Date:</strong> {new Date(selectedAppointment.scheduledDate).toLocaleDateString()}
                </p>
                <p>
                  <strong>Time:</strong> {selectedAppointment.scheduledTime}
                </p>
              </div>

              <div>
                <Label htmlFor="rejectReason">Reason for Rejection *</Label>
                <Textarea
                  id="rejectReason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this appointment cannot be scheduled..."
                  rows={4}
                />
              </div>

              <p className="text-sm text-muted-foreground">
                The patient will be notified and can request an alternative time.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectAppointment}>
              <X className="h-4 w-4 mr-2" />
              Reject Appointment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Reschedule Request</DialogTitle>
            <DialogDescription>Confirm the new appointment time</DialogDescription>
          </DialogHeader>
          {selectedReschedule && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
                  <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-2">Current</p>
                  <p className="text-sm">{new Date(selectedReschedule.originalDate).toLocaleDateString()}</p>
                  <p className="text-sm">{selectedReschedule.originalTime}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                  <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-2">New</p>
                  <p className="text-sm">{new Date(selectedReschedule.requestedDate).toLocaleDateString()}</p>
                  <p className="text-sm">{selectedReschedule.requestedTime}</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                The appointment will be updated to the new time and the patient will be notified.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApproveReschedule}>
              <Check className="h-4 w-4 mr-2" />
              Approve Reschedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
