"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CalendarIcon,
  Clock,
  User,
  MapPin,
  Plus,
  Trash2,
  Check,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Mock appointment data - will be replaced with real data
const mockAppointments = [
  {
    id: "1",
    patientName: "John Smith",
    patientId: "p1",
    type: "Follow-up Consultation",
    date: "2025-01-20",
    time: "09:00",
    duration: 30,
    location: "Room 101",
    status: "scheduled" as const,
    notes: "Regular checkup for diabetes management",
    category: "consultation",
  },
  {
    id: "2",
    patientName: "Sarah Johnson",
    patientId: "p2",
    type: "Initial Consultation",
    date: "2025-01-20",
    time: "10:00",
    duration: 45,
    location: "Room 102",
    status: "scheduled" as const,
    notes: "New patient - hypertension concerns",
    category: "consultation",
  },
  {
    id: "3",
    patientName: "Michael Chen",
    patientId: "p3",
    type: "Lab Results Review",
    date: "2025-01-20",
    time: "14:00",
    duration: 30,
    location: "Room 101",
    status: "scheduled" as const,
    notes: "Discuss recent blood work results",
    category: "review",
  },
  {
    id: "4",
    patientName: "Emily Davis",
    patientId: "p4",
    type: "Urgent Care",
    date: "2025-01-21",
    time: "09:30",
    duration: 30,
    location: "Room 103",
    status: "scheduled" as const,
    notes: "Acute symptoms - needs immediate attention",
    category: "urgent",
  },
]

const timeSlots = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
]

const appointmentTypes = [
  "Initial Consultation",
  "Follow-up Consultation",
  "Lab Results Review",
  "Procedure",
  "Urgent Care",
  "Telemedicine",
]

const categoryColors = {
  consultation: "bg-blue-500",
  review: "bg-green-500",
  procedure: "bg-purple-500",
  urgent: "bg-red-500",
  telemedicine: "bg-orange-500",
}

export function DoctorScheduler() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [appointments, setAppointments] = useState(mockAppointments)
  const [showNewAppointmentDialog, setShowNewAppointmentDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day")

  const [newAppointment, setNewAppointment] = useState({
    patientName: "",
    patientId: "",
    type: "",
    date: "",
    time: "",
    duration: 30,
    location: "",
    notes: "",
    category: "consultation",
  })

  // Filter appointments for selected date
  const selectedDateStr = selectedDate.toISOString().split("T")[0]
  const dayAppointments = useMemo(() => {
    return appointments.filter((apt) => apt.date === selectedDateStr).sort((a, b) => a.time.localeCompare(b.time))
  }, [appointments, selectedDateStr])

  // Get appointments for the week
  const weekAppointments = useMemo(() => {
    const weekStart = new Date(selectedDate)
    weekStart.setDate(selectedDate.getDate() - selectedDate.getDay())

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart)
      day.setDate(weekStart.getDate() + i)
      return day.toISOString().split("T")[0]
    })

    return weekDays.map((date) => ({
      date,
      appointments: appointments.filter((apt) => apt.date === date),
    }))
  }, [appointments, selectedDate])

  // Check if a time slot is available
  const isSlotAvailable = (time: string, date: string) => {
    return !appointments.some((apt) => apt.date === date && apt.time === time && apt.status === "scheduled")
  }

  // Handle creating new appointment
  const handleCreateAppointment = () => {
    if (!newAppointment.patientName || !newAppointment.type || !newAppointment.date || !newAppointment.time) {
      alert("Please fill in all required fields")
      return
    }

    // Check for conflicts
    if (!isSlotAvailable(newAppointment.time, newAppointment.date)) {
      alert("This time slot is already booked. Please choose another time.")
      return
    }

    const appointment = {
      id: Date.now().toString(),
      ...newAppointment,
      patientId: newAppointment.patientId || `p${Date.now()}`,
      status: "scheduled" as const,
    }

    setAppointments([...appointments, appointment])
    setShowNewAppointmentDialog(false)
    setNewAppointment({
      patientName: "",
      patientId: "",
      type: "",
      date: "",
      time: "",
      duration: 30,
      location: "",
      notes: "",
      category: "consultation",
    })

    // Show success notification
    alert(`Appointment scheduled successfully for ${newAppointment.patientName}`)
  }

  // Handle editing appointment
  const handleEditAppointment = () => {
    if (!selectedAppointment) return

    setAppointments(appointments.map((apt) => (apt.id === selectedAppointment.id ? selectedAppointment : apt)))
    setShowEditDialog(false)
    setSelectedAppointment(null)
    alert("Appointment updated successfully")
  }

  // Handle canceling appointment
  const handleCancelAppointment = (id: string) => {
    if (confirm("Are you sure you want to cancel this appointment?")) {
      setAppointments(appointments.map((apt) => (apt.id === id ? { ...apt, status: "cancelled" as const } : apt)))
      alert("Appointment cancelled")
    }
  }

  // Handle deleting appointment
  const handleDeleteAppointment = (id: string) => {
    if (confirm("Are you sure you want to delete this appointment? This action cannot be undone.")) {
      setAppointments(appointments.filter((apt) => apt.id !== id))
      setShowEditDialog(false)
      setSelectedAppointment(null)
      alert("Appointment deleted")
    }
  }

  // Navigate dates
  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate)
    if (viewMode === "day") {
      newDate.setDate(selectedDate.getDate() + (direction === "next" ? 1 : -1))
    } else if (viewMode === "week") {
      newDate.setDate(selectedDate.getDate() + (direction === "next" ? 7 : -7))
    } else {
      newDate.setMonth(selectedDate.getMonth() + (direction === "next" ? 1 : -1))
    }
    setSelectedDate(newDate)
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dayAppointments.length}</div>
            <p className="text-xs text-muted-foreground">
              {dayAppointments.filter((a) => a.status === "scheduled").length} scheduled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Slots</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timeSlots.length - dayAppointments.length}</div>
            <p className="text-xs text-muted-foreground">Open time slots today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Cases</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dayAppointments.filter((a) => a.category === "urgent").length}</div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments.length}</div>
            <p className="text-xs text-muted-foreground">All scheduled appointments</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Scheduler */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>Select a date to view appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />

            <div className="mt-6 space-y-3">
              <Dialog open={showNewAppointmentDialog} onOpenChange={setShowNewAppointmentDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full" size="lg">
                    <Plus className="h-4 w-4 mr-2" />
                    New Appointment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Schedule New Appointment</DialogTitle>
                    <DialogDescription>Add a new appointment to your schedule</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="patientName">Patient Name *</Label>
                        <Input
                          id="patientName"
                          value={newAppointment.patientName}
                          onChange={(e) => setNewAppointment({ ...newAppointment, patientName: e.target.value })}
                          placeholder="Enter patient name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="patientId">Patient ID</Label>
                        <Input
                          id="patientId"
                          value={newAppointment.patientId}
                          onChange={(e) => setNewAppointment({ ...newAppointment, patientId: e.target.value })}
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="type">Appointment Type *</Label>
                      <Select
                        value={newAppointment.type}
                        onValueChange={(value) => setNewAppointment({ ...newAppointment, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {appointmentTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={newAppointment.date}
                          onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="time">Time *</Label>
                        <Select
                          value={newAppointment.time}
                          onValueChange={(value) => setNewAppointment({ ...newAppointment, time: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeSlots.map((time) => (
                              <SelectItem
                                key={time}
                                value={time}
                                disabled={!isSlotAvailable(time, newAppointment.date)}
                              >
                                {time} {!isSlotAvailable(time, newAppointment.date) && "(Booked)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="duration">Duration (minutes)</Label>
                        <Select
                          value={newAppointment.duration.toString()}
                          onValueChange={(value) =>
                            setNewAppointment({ ...newAppointment, duration: Number.parseInt(value) })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="45">45 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={newAppointment.location}
                          onChange={(e) => setNewAppointment({ ...newAppointment, location: e.target.value })}
                          placeholder="e.g., Room 101"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={newAppointment.category}
                        onValueChange={(value: any) => setNewAppointment({ ...newAppointment, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consultation">Consultation</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="procedure">Procedure</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="telemedicine">Telemedicine</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={newAppointment.notes}
                        onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                        placeholder="Add any relevant notes..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowNewAppointmentDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateAppointment}>
                      <Check className="h-4 w-4 mr-2" />
                      Schedule Appointment
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Category Legend</h4>
                <div className="space-y-2">
                  {Object.entries(categoryColors).map(([category, color]) => (
                    <div key={category} className="flex items-center gap-2 text-sm">
                      <div className={cn("w-3 h-3 rounded-full", color)} />
                      <span className="capitalize">{category}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule View */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </CardTitle>
                <CardDescription>
                  {dayAppointments.length} appointment{dayAppointments.length !== 1 ? "s" : ""} scheduled
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="day">Day View</TabsTrigger>
                <TabsTrigger value="week">Week View</TabsTrigger>
                <TabsTrigger value="month">Month View</TabsTrigger>
              </TabsList>

              <TabsContent value="day" className="space-y-4">
                {dayAppointments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No appointments scheduled for this day</p>
                    <Button variant="link" onClick={() => setShowNewAppointmentDialog(true)} className="mt-2">
                      Schedule an appointment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dayAppointments.map((appointment) => (
                      <Card
                        key={appointment.id}
                        className={cn(
                          "border-l-4 cursor-pointer hover:shadow-md transition-shadow",
                          categoryColors[appointment.category as keyof typeof categoryColors],
                          appointment.status === "cancelled" && "opacity-50",
                        )}
                        onClick={() => {
                          setSelectedAppointment(appointment)
                          setShowEditDialog(true)
                        }}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-lg">{appointment.patientName}</h4>
                              <p className="text-sm text-muted-foreground">{appointment.type}</p>
                            </div>
                            <Badge variant={appointment.status === "cancelled" ? "destructive" : "default"}>
                              {appointment.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {appointment.time} ({appointment.duration} min)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{appointment.location || "Not specified"}</span>
                            </div>
                          </div>

                          {appointment.notes && (
                            <p className="mt-3 text-sm text-muted-foreground border-t pt-3">{appointment.notes}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="week" className="space-y-4">
                <div className="grid grid-cols-7 gap-2">
                  {weekAppointments.map(({ date, appointments: dayApts }) => {
                    const dayDate = new Date(date)
                    const isToday = date === new Date().toISOString().split("T")[0]
                    const isSelected = date === selectedDateStr

                    return (
                      <Card
                        key={date}
                        className={cn(
                          "cursor-pointer hover:shadow-md transition-shadow",
                          isSelected && "ring-2 ring-primary",
                          isToday && "bg-accent",
                        )}
                        onClick={() => setSelectedDate(dayDate)}
                      >
                        <CardContent className="p-3">
                          <div className="text-center mb-2">
                            <p className="text-xs text-muted-foreground">
                              {dayDate.toLocaleDateString("en-US", { weekday: "short" })}
                            </p>
                            <p className="text-lg font-bold">{dayDate.getDate()}</p>
                          </div>
                          <div className="space-y-1">
                            {dayApts.slice(0, 3).map((apt) => (
                              <div
                                key={apt.id}
                                className={cn(
                                  "text-xs p-1 rounded",
                                  categoryColors[apt.category as keyof typeof categoryColors],
                                  "text-white",
                                )}
                              >
                                {apt.time}
                              </div>
                            ))}
                            {dayApts.length > 3 && (
                              <p className="text-xs text-muted-foreground text-center">+{dayApts.length - 3} more</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>

              <TabsContent value="month" className="space-y-4">
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Month view coming soon</p>
                  <p className="text-sm mt-2">Use the calendar sidebar to navigate dates</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Edit Appointment Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>Update appointment details or cancel/delete the appointment</DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-patientName">Patient Name</Label>
                  <Input
                    id="edit-patientName"
                    value={selectedAppointment.patientName}
                    onChange={(e) => setSelectedAppointment({ ...selectedAppointment, patientName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-type">Appointment Type</Label>
                  <Select
                    value={selectedAppointment.type}
                    onValueChange={(value) => setSelectedAppointment({ ...selectedAppointment, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {appointmentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={selectedAppointment.date}
                    onChange={(e) => setSelectedAppointment({ ...selectedAppointment, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-time">Time</Label>
                  <Select
                    value={selectedAppointment.time}
                    onValueChange={(value) => setSelectedAppointment({ ...selectedAppointment, time: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-duration">Duration</Label>
                  <Select
                    value={selectedAppointment.duration.toString()}
                    onValueChange={(value) =>
                      setSelectedAppointment({ ...selectedAppointment, duration: Number.parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    value={selectedAppointment.location}
                    onChange={(e) => setSelectedAppointment({ ...selectedAppointment, location: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={selectedAppointment.notes}
                  onChange={(e) => setSelectedAppointment({ ...selectedAppointment, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => selectedAppointment && handleCancelAppointment(selectedAppointment.id)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Appointment
              </Button>
              <Button
                variant="outline"
                onClick={() => selectedAppointment && handleDeleteAppointment(selectedAppointment.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Close
              </Button>
              <Button onClick={handleEditAppointment}>
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
