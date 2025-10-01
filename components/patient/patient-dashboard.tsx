"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Calendar, FileText, Heart, Bell, MapPin, Clock } from "lucide-react"
import { clearCurrentUser } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { EmergencyButton } from "@/components/emergency/emergency-button"
import { emergencyApi, patientDataApi } from "@/lib/api"
import type { CreateEmergencyAlertRequest, Appointment, Visit, Medication, VitalSigns } from "@/lib/types"
import { useApiData } from "@/lib/useApiData"

// 硬編碼數據作為備用（當數據庫沒有數據時使用）
const mockAppointments: Appointment[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    patientId: "550e8400-e29b-41d4-a716-446655440002",
    providerId: "550e8400-e29b-41d4-a716-446655440003",
    providerName: "Dr. Michael Chen",
    type: "Follow-up Visit",
    scheduledDate: "2024-01-20",
    scheduledTime: "10:00 AM",
    location: "Village Health Center",
    status: "scheduled",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440004",
    patientId: "550e8400-e29b-41d4-a716-446655440002",
    providerId: "550e8400-e29b-41d4-a716-446655440005",
    providerName: "Maria Santos (VHV)",
    type: "VHV Check-in",
    scheduledDate: "2024-01-25",
    scheduledTime: "2:00 PM",
    location: "Home Visit",
    status: "scheduled",
    createdAt: new Date(),
    updatedAt: new Date()
  },
]

const mockVisits: Visit[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440006",
    patientId: "550e8400-e29b-41d4-a716-446655440002",
    providerId: "550e8400-e29b-41d4-a716-446655440005",
    providerName: "Maria Santos (VHV)",
    visitDate: "2024-01-15",
    diagnosis: "Common Cold",
    treatment: "Rest, fluids, paracetamol",
    status: "completed",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440007",
    patientId: "550e8400-e29b-41d4-a716-446655440002",
    providerId: "550e8400-e29b-41d4-a716-446655440003",
    providerName: "Dr. Michael Chen",
    visitDate: "2024-01-10",
    diagnosis: "Routine Check-up",
    treatment: "Continue current medications",
    status: "completed",
    createdAt: new Date(),
    updatedAt: new Date()
  },
]

const mockMedications: Medication[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440008",
    patientId: "550e8400-e29b-41d4-a716-446655440002",
    name: "Paracetamol",
    dosage: "500mg",
    frequency: "Twice daily",
    duration: "5 days",
    prescribedDate: "2024-01-15",
    remainingDays: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440009",
    patientId: "550e8400-e29b-41d4-a716-446655440002",
    name: "Vitamin D",
    dosage: "1000 IU",
    frequency: "Once daily",
    duration: "Ongoing",
    prescribedDate: "2024-01-01",
    remainingDays: 15,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
]

const mockVitalSigns: VitalSigns[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440010",
    patientId: "550e8400-e29b-41d4-a716-446655440002",
    recordedDate: "2024-01-15",
    temperature: 37.2,
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    weight: 65,
    createdAt: new Date()
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440011",
    patientId: "550e8400-e29b-41d4-a716-446655440002",
    recordedDate: "2024-01-10",
    temperature: 36.8,
    bloodPressureSystolic: 118,
    bloodPressureDiastolic: 78,
    weight: 64.5,
    createdAt: new Date()
  },
]

export function PatientDashboard() {
  const router = useRouter()
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [rescheduleForm, setRescheduleForm] = useState({
    newDate: "",
    newTime: "",
    reason: "",
    preferredTime: ""
  })

  // 獲取當前患者 ID（這裡需要從認證系統獲取）
  const currentPatientId = "b3c45364-d9ae-4c79-9fc2-dc74bac8dd00" // 使用存在的患者 ID

  // 從數據庫獲取數據
  const { data: appointments, loading: appointmentsLoading, error: appointmentsError, refetch: refetchAppointments } = useApiData(
    () => patientDataApi.getAppointments(currentPatientId),
    [currentPatientId]
  )

  const { data: visits, loading: visitsLoading, error: visitsError } = useApiData(
    () => patientDataApi.getVisits(currentPatientId),
    [currentPatientId]
  )

  const { data: medications, loading: medicationsLoading, error: medicationsError } = useApiData(
    () => patientDataApi.getMedications(currentPatientId),
    [currentPatientId]
  )

  const { data: vitalSigns, loading: vitalSignsLoading, error: vitalSignsError } = useApiData(
    () => patientDataApi.getVitalSigns(currentPatientId),
    [currentPatientId]
  )

  // 調試日誌
  console.log('Patient Dashboard Data Status:', {
    appointments: { data: appointments, loading: appointmentsLoading, error: appointmentsError },
    visits: { data: visits, loading: visitsLoading, error: visitsError },
    medications: { data: medications, loading: medicationsLoading, error: medicationsError },
    vitalSigns: { data: vitalSigns, loading: vitalSignsLoading, error: vitalSignsError }
  })

  // 強制使用數據庫數據，不使用 mock 數據
  const upcomingAppointments = appointments || []
  const recentVisits = visits || []
  const currentMedications = medications || []
  const vitalTrends = vitalSigns || []

  console.log('Final data being used:', {
    upcomingAppointments: upcomingAppointments.length,
    recentVisits: recentVisits.length,
    currentMedications: currentMedications.length,
    vitalTrends: vitalTrends.length
  })

  const handleSignOut = () => {
    clearCurrentUser()
    router.push("/")
  }

  const handleEmergencyTriggered = async (alertData: CreateEmergencyAlertRequest) => {
    try {
      await emergencyApi.create(alertData)
      console.log("[v0] Emergency alert successfully sent to healthcare providers")
    } catch (error) {
      console.error("[v0] Failed to send emergency alert:", error)
      throw error // Re-throw to let the button component handle the error display
    }
  }

  const handleJoinCall = (appointmentId: string) => {
    // TODO: Implement video call functionality
    console.log(`[v0] Joining call for appointment ${appointmentId}`)
    alert("Video call functionality will be implemented soon!")
  }

  const handleReschedule = (appointment: any) => {
    setSelectedAppointment(appointment)
    setRescheduleForm({
      newDate: appointment.scheduledDate || "",
      newTime: appointment.scheduledTime || "",
      reason: "",
      preferredTime: ""
    })
    setShowRescheduleDialog(true)
  }

  const handleRescheduleSubmit = async () => {
    if (!rescheduleForm.newDate || !rescheduleForm.newTime) {
      alert("Please select a new date and time")
      return
    }

    if (!selectedAppointment || !selectedAppointment.id) {
      alert("No appointment selected")
      return
    }

    console.log("Reschedule request data:", {
      appointmentId: selectedAppointment.id,
      patientId: currentPatientId,
      requestedDate: rescheduleForm.newDate,
      requestedTime: rescheduleForm.newTime,
      reason: rescheduleForm.reason,
      preferredAlternatives: rescheduleForm.preferredTime
    })

    try {
      await patientDataApi.createRescheduleRequest({
        appointmentId: selectedAppointment.id,
        patientId: currentPatientId,
        requestedDate: rescheduleForm.newDate,
        requestedTime: rescheduleForm.newTime,
        reason: rescheduleForm.reason,
        preferredAlternatives: rescheduleForm.preferredTime
      })
      
      alert(`Reschedule request submitted successfully for ${selectedAppointment.type} on ${rescheduleForm.newDate} at ${rescheduleForm.newTime}`)
      
      setShowRescheduleDialog(false)
      setSelectedAppointment(null)
      setRescheduleForm({
        newDate: "",
        newTime: "",
        reason: "",
        preferredTime: ""
      })
      
      // Refresh appointments data after successful reschedule
      refetchAppointments()
    } catch (error) {
      console.error("Failed to submit reschedule request:", error)
      alert(`Failed to submit reschedule request: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">My Health Dashboard</h1>
                <p className="text-muted-foreground">Sarah Johnson</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <EmergencyButton
            patientId={currentPatientId}
            patientName="Sarah Johnson"
            onEmergencyTriggered={handleEmergencyTriggered}
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Appointment</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Jan 20</div>
              <p className="text-xs text-muted-foreground">Dr. Michael Chen</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Medications</CardTitle>
              <Heart className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Current prescriptions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Visit</CardTitle>
              <FileText className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5 days</div>
              <p className="text-xs text-muted-foreground">ago</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Health Score</CardTitle>
              <Heart className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Good</div>
              <p className="text-xs text-muted-foreground">Stable condition</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="appointments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Appointments
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Visit History
            </TabsTrigger>
            <TabsTrigger value="medications" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Medications
            </TabsTrigger>
            <TabsTrigger value="vitals" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Vital Signs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>Your scheduled visits and check-ups</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingAppointments.map((appointment: any) => (
                  <Card key={appointment.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{appointment.type}</h4>
                        <Badge variant="outline">{appointment.scheduledDate}</Badge>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {appointment.providerName}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {appointment.scheduledTime}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {appointment.location}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" onClick={() => handleJoinCall(appointment.id)}>
                          Join Call
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleReschedule(appointment as any)}>
                          Reschedule
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Visit History</CardTitle>
                <CardDescription>Your recent medical visits and treatments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentVisits.map((visit: any) => (
                  <Card key={visit.id} className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{visit.diagnosis}</h4>
                        <Badge variant="default" className="bg-green-500">
                          {visit.status}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Provider:</span>
                          <span>{visit.providerName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Date:</span>
                          <span>{visit.visitDate}</span>
                        </div>
                        <div className="flex items-start justify-between">
                          <span className="text-muted-foreground">Treatment:</span>
                          <span className="text-right max-w-xs">{visit.treatment}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Medications</CardTitle>
                <CardDescription>Your active prescriptions and dosage information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentMedications.map((medication: any, index: number) => (
                  <Card key={index} className="border-l-4 border-l-red-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{medication.name}</h4>
                        <Badge variant={medication.remainingDays < 5 ? "destructive" : "secondary"}>
                          {medication.remainingDays} days left
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Dosage:</span>
                          <p className="font-medium">{medication.dosage}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Frequency:</span>
                          <p className="font-medium">{medication.frequency}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration:</span>
                          <p className="font-medium">{medication.duration}</p>
                        </div>
                      </div>
                      {medication.remainingDays < 5 && (
                        <div className="flex items-center gap-2 mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                          <Bell className="h-4 w-4 text-red-500" />
                          <p className="text-sm text-red-700">Running low - contact your provider for refill</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vitals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vital Signs Trends</CardTitle>
                <CardDescription>Your recent vital signs measurements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vitalTrends.map((vital: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">{vital.recordedDate}</div>
                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">Temp:</span>
                          <span className="ml-1 font-medium">{vital.temperature}°C</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">BP:</span>
                          <span className="ml-1 font-medium">{vital.bloodPressureSystolic}/{vital.bloodPressureDiastolic}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Weight:</span>
                          <span className="ml-1 font-medium">{vital.weight}kg</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent className="max-w-[90vw] w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Request to reschedule your appointment with {selectedAppointment?.provider}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newDate">New Date</Label>
                <Input
                  id="newDate"
                  type="date"
                  value={rescheduleForm.newDate || ""}
                  onChange={(e) => setRescheduleForm(prev => ({ ...prev, newDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="newTime">New Time</Label>
                <Select value={rescheduleForm.newTime || ""} onValueChange={(value) => setRescheduleForm(prev => ({ ...prev, newTime: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9:00 AM">9:00 AM</SelectItem>
                    <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                    <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                    <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                    <SelectItem value="1:00 PM">1:00 PM</SelectItem>
                    <SelectItem value="2:00 PM">2:00 PM</SelectItem>
                    <SelectItem value="3:00 PM">3:00 PM</SelectItem>
                    <SelectItem value="4:00 PM">4:00 PM</SelectItem>
                    <SelectItem value="5:00 PM">5:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="reason">Reason for Rescheduling</Label>
              <Textarea
                id="reason"
                placeholder="Please explain why you need to reschedule..."
                value={rescheduleForm.reason || ""}
                onChange={(e) => setRescheduleForm(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="preferredTime">Preferred Alternative Times</Label>
              <Textarea
                id="preferredTime"
                placeholder="If the selected time is not available, please suggest alternative times..."
                value={rescheduleForm.preferredTime || ""}
                onChange={(e) => setRescheduleForm(prev => ({ ...prev, preferredTime: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRescheduleSubmit}>
              Submit Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
