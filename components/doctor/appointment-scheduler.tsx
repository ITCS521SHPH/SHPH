"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CalendarIcon, Clock, Plus, Trash2, Check, ChevronLeft, ChevronRight, User, AlertCircle } from "lucide-react"
import { format, addDays, startOfWeek, addWeeks, isSameDay } from "date-fns"

const APPOINTMENT_CATEGORIES = [
  { value: "general", label: "General", color: "#3b82f6" },
  { value: "consultation", label: "Consultation", color: "#8b5cf6" },
  { value: "follow_up", label: "Follow-up", color: "#10b981" },
  { value: "emergency", label: "Emergency", color: "#ef4444" },
  { value: "routine_checkup", label: "Routine Checkup", color: "#f59e0b" },
  { value: "vaccination", label: "Vaccination", color: "#06b6d4" },
  { value: "lab_test", label: "Lab Test", color: "#ec4899" },
  { value: "surgery", label: "Surgery", color: "#dc2626" },
  { value: "therapy", label: "Therapy", color: "#14b8a6" },
]

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8 // Start at 8 AM
  const minute = i % 2 === 0 ? "00" : "30"
  return `${hour.toString().padStart(2, "0")}:${minute}`
}).filter((time) => {
  const hour = Number.parseInt(time.split(":")[0])
  return hour >= 8 && hour < 20 // 8 AM to 8 PM
})

interface Appointment {
  id: string
  patientId: string
  patientName: string
  doctorId: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  category: string
  color: string
  status: string
  notes?: string
  confirmedByPatient: boolean
}

interface AppointmentSchedulerProps {
  doctorId: string
  patients: Array<{ id: string; firstName: string; lastName: string }>
}

export function AppointmentScheduler({ doctorId, patients }: AppointmentSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<"day" | "week">("week")
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null)

  const [appointmentForm, setAppointmentForm] = useState({
    patientId: "",
    scheduledDate: format(new Date(), "yyyy-MM-dd"),
    scheduledTime: "09:00",
    duration: 30,
    category: "general",
    notes: "",
  })

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/doctor/appointments?doctorId=${doctorId}&date=${format(selectedDate, "yyyy-MM-dd")}&viewMode=${viewMode}`,
      )
      if (!response.ok) throw new Error("Failed to fetch appointments")
      const data = await response.json()
      setAppointments(data)
    } catch (error) {
      console.error("[v0] Failed to fetch appointments:", error)
    } finally {
      setLoading(false)
    }
  }, [doctorId, selectedDate, viewMode])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const handleCreateAppointment = async () => {
    try {
      const selectedPatient = patients.find((p) => p.id === appointmentForm.patientId)
      if (!selectedPatient) {
        alert("Please select a patient")
        return
      }

      const category = APPOINTMENT_CATEGORIES.find((c) => c.value === appointmentForm.category)

      const response = await fetch("/api/doctor/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId,
          patientId: appointmentForm.patientId,
          patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
          scheduledDate: appointmentForm.scheduledDate,
          scheduledTime: appointmentForm.scheduledTime,
          duration: appointmentForm.duration,
          category: appointmentForm.category,
          color: category?.color || "#3b82f6",
          notes: appointmentForm.notes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create appointment")
      }

      alert("Appointment created successfully! Patient has been notified.")
      setShowAddDialog(false)
      setAppointmentForm({
        patientId: "",
        scheduledDate: format(new Date(), "yyyy-MM-dd"),
        scheduledTime: "09:00",
        duration: 30,
        category: "general",
        notes: "",
      })
      fetchAppointments()
    } catch (error: any) {
      console.error("[v0] Failed to create appointment:", error)
      alert(error.message || "Failed to create appointment. Please try again.")
    }
  }

  const handleUpdateAppointment = async () => {
    if (!selectedAppointment) return

    try {
      const response = await fetch(`/api/doctor/appointments/${selectedAppointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledDate: appointmentForm.scheduledDate,
          scheduledTime: appointmentForm.scheduledTime,
          duration: appointmentForm.duration,
          category: appointmentForm.category,
          notes: appointmentForm.notes,
        }),
      })

      if (!response.ok) throw new Error("Failed to update appointment")

      alert("Appointment updated successfully!")
      setShowEditDialog(false)
      setSelectedAppointment(null)
      fetchAppointments()
    } catch (error) {
      console.error("[v0] Failed to update appointment:", error)
      alert("Failed to update appointment. Please try again.")
    }
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return

    try {
      const response = await fetch(`/api/doctor/appointments/${appointmentId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to cancel appointment")

      alert("Appointment cancelled successfully!")
      fetchAppointments()
    } catch (error) {
      console.error("[v0] Failed to cancel appointment:", error)
      alert("Failed to cancel appointment. Please try again.")
    }
  }

  const handleDragStart = (appointment: Appointment) => {
    setDraggedAppointment(appointment)
  }

  const handleDrop = async (date: string, time: string) => {
    if (!draggedAppointment) return

    try {
      const response = await fetch(`/api/doctor/appointments/${draggedAppointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledDate: date,
          scheduledTime: time,
        }),
      })

      if (!response.ok) throw new Error("Failed to reschedule appointment")

      alert("Appointment rescheduled successfully!")
      setDraggedAppointment(null)
      fetchAppointments()
    } catch (error) {
      console.error("[v0] Failed to reschedule appointment:", error)
      alert("Failed to reschedule appointment. Please try again.")
    }
  }

  const getAppointmentsForSlot = (date: Date, time: string) => {
    return appointments.filter(
      (apt) =>
        apt.scheduledDate === format(date, "yyyy-MM-dd") && apt.scheduledTime === time && apt.status !== "cancelled",
    )
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Week header */}
        <div className="grid grid-cols-8 border-b shrink-0">
          <div className="p-2 border-r bg-muted/50 min-w-[60px]">
            <span className="text-sm font-medium">Time</span>
          </div>
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={`p-2 text-center border-r min-w-0 ${isSameDay(day, new Date()) ? "bg-primary/10" : ""}`}
            >
              <div className="text-sm font-medium">{format(day, "EEE")}</div>
              <div className={`text-lg ${isSameDay(day, new Date()) ? "text-primary font-bold" : ""}`}>
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <ScrollArea className="flex-1 overflow-auto">
          <div className="min-w-full">
            {TIME_SLOTS.map((time) => (
              <div key={time} className="grid grid-cols-8 border-b min-h-[60px]">
                <div className="p-2 border-r bg-muted/50 flex items-center min-w-[60px]">
                  <span className="text-xs font-medium">{time}</span>
                </div>
                {weekDays.map((day) => {
                  const slotAppointments = getAppointmentsForSlot(day, time)
                  return (
                    <div
                      key={`${day.toISOString()}-${time}`}
                      className="p-1 border-r hover:bg-muted/50 cursor-pointer relative min-w-0"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(format(day, "yyyy-MM-dd"), time)}
                      onClick={() => {
                        setAppointmentForm({
                          ...appointmentForm,
                          scheduledDate: format(day, "yyyy-MM-dd"),
                          scheduledTime: time,
                        })
                        setShowAddDialog(true)
                      }}
                    >
                      {slotAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          draggable
                          onDragStart={() => handleDragStart(apt)}
                          className="text-xs p-1 rounded mb-1 cursor-move hover:opacity-80 transition-opacity overflow-hidden"
                          style={{ backgroundColor: apt.color, color: "white" }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedAppointment(apt)
                            setAppointmentForm({
                              patientId: apt.patientId,
                              scheduledDate: apt.scheduledDate,
                              scheduledTime: apt.scheduledTime,
                              duration: apt.duration,
                              category: apt.category,
                              notes: apt.notes || "",
                            })
                            setShowEditDialog(true)
                          }}
                        >
                          <div className="font-medium truncate">{apt.patientName}</div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{apt.duration}min</span>
                            {apt.confirmedByPatient && <Check className="h-3 w-3 ml-auto" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    )
  }

  const renderDayView = () => {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b bg-muted/50">
          <h3 className="text-lg font-semibold">{format(selectedDate, "EEEE, MMMM d, yyyy")}</h3>
        </div>

        <ScrollArea className="flex-1">
          {TIME_SLOTS.map((time) => {
            const slotAppointments = getAppointmentsForSlot(selectedDate, time)
            return (
              <div key={time} className="flex border-b min-h-[80px] hover:bg-muted/50">
                <div className="w-24 p-3 border-r bg-muted/50 flex items-start">
                  <span className="text-sm font-medium">{time}</span>
                </div>
                <div
                  className="flex-1 p-2 cursor-pointer relative"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(format(selectedDate, "yyyy-MM-dd"), time)}
                  onClick={() => {
                    setAppointmentForm({
                      ...appointmentForm,
                      scheduledDate: format(selectedDate, "yyyy-MM-dd"),
                      scheduledTime: time,
                    })
                    setShowAddDialog(true)
                  }}
                >
                  {slotAppointments.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic">Click to add appointment</div>
                  ) : (
                    <div className="space-y-2">
                      {slotAppointments.map((apt) => (
                        <Card
                          key={apt.id}
                          draggable
                          onDragStart={() => handleDragStart(apt)}
                          className="cursor-move hover:shadow-md transition-shadow"
                          style={{ borderLeftColor: apt.color, borderLeftWidth: "4px" }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedAppointment(apt)
                            setAppointmentForm({
                              patientId: apt.patientId,
                              scheduledDate: apt.scheduledDate,
                              scheduledTime: apt.scheduledTime,
                              duration: apt.duration,
                              category: apt.category,
                              notes: apt.notes || "",
                            })
                            setShowEditDialog(true)
                          }}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <User className="h-4 w-4" />
                                  <span className="font-medium">{apt.patientName}</span>
                                  {apt.confirmedByPatient && (
                                    <Badge variant="outline" className="text-xs bg-green-50">
                                      <Check className="h-3 w-3 mr-1" />
                                      Confirmed
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {apt.duration} minutes
                                  </span>
                                  <Badge variant="outline" style={{ backgroundColor: apt.color, color: "white" }}>
                                    {APPOINTMENT_CATEGORIES.find((c) => c.value === apt.category)?.label}
                                  </Badge>
                                </div>
                                {apt.notes && <p className="text-sm mt-2 text-muted-foreground">{apt.notes}</p>}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteAppointment(apt.id)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Appointment Scheduler
              </CardTitle>
              <CardDescription>Manage your appointments with drag-and-drop scheduling</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* View mode toggle */}
              <div className="flex gap-1 border rounded-md p-1">
                <Button size="sm" variant={viewMode === "day" ? "default" : "ghost"} onClick={() => setViewMode("day")}>
                  Day
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "week" ? "default" : "ghost"}
                  onClick={() => setViewMode("week")}
                >
                  Week
                </Button>
              </div>

              {/* Date navigation */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setSelectedDate(viewMode === "week" ? addWeeks(selectedDate, -1) : addDays(selectedDate, -1))
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedDate(new Date())}>
                  Today
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setSelectedDate(viewMode === "week" ? addWeeks(selectedDate, 1) : addDays(selectedDate, 1))
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Add appointment button */}
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Appointment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Schedule New Appointment</DialogTitle>
                    <DialogDescription>Create a new appointment for a patient</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Patient *</Label>
                      <Select
                        value={appointmentForm.patientId}
                        onValueChange={(value) => setAppointmentForm({ ...appointmentForm, patientId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.firstName} {patient.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date *</Label>
                        <Input
                          type="date"
                          value={appointmentForm.scheduledDate}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, scheduledDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Time *</Label>
                        <Select
                          value={appointmentForm.scheduledTime}
                          onValueChange={(value) => setAppointmentForm({ ...appointmentForm, scheduledTime: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_SLOTS.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Duration (minutes) *</Label>
                        <Select
                          value={appointmentForm.duration.toString()}
                          onValueChange={(value) =>
                            setAppointmentForm({ ...appointmentForm, duration: Number.parseInt(value) })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="45">45 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="90">1.5 hours</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Category *</Label>
                        <Select
                          value={appointmentForm.category}
                          onValueChange={(value) => setAppointmentForm({ ...appointmentForm, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {APPOINTMENT_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                  {cat.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        placeholder="Add any notes or special instructions..."
                        value={appointmentForm.notes}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                      <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        The patient will be notified via the system after you create this appointment.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateAppointment}>Create Appointment</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar view */}
      <Card className="h-[600px] overflow-hidden">
        <CardContent className="p-0 h-full overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading appointments...</p>
            </div>
          ) : viewMode === "week" ? (
            renderWeekView()
          ) : (
            renderDayView()
          )}
        </CardContent>
      </Card>

      {/* Edit appointment dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>Update appointment details</DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{selectedAppointment.patientName}</span>
                </div>
                {selectedAppointment.confirmedByPatient && (
                  <Badge variant="outline" className="text-xs bg-green-50">
                    <Check className="h-3 w-3 mr-1" />
                    Patient Confirmed
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={appointmentForm.scheduledDate}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, scheduledDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time *</Label>
                  <Select
                    value={appointmentForm.scheduledTime}
                    onValueChange={(value) => setAppointmentForm({ ...appointmentForm, scheduledTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration (minutes) *</Label>
                  <Select
                    value={appointmentForm.duration.toString()}
                    onValueChange={(value) =>
                      setAppointmentForm({ ...appointmentForm, duration: Number.parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select
                    value={appointmentForm.category}
                    onValueChange={(value) => setAppointmentForm({ ...appointmentForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APPOINTMENT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                            {cat.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Add any notes or special instructions..."
                  value={appointmentForm.notes}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedAppointment && handleDeleteAppointment(selectedAppointment.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Cancel Appointment
            </Button>
            <Button onClick={handleUpdateAppointment}>
              <Check className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Appointment Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {APPOINTMENT_CATEGORIES.map((cat) => (
              <Badge key={cat.value} variant="outline" style={{ backgroundColor: cat.color, color: "white" }}>
                {cat.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
