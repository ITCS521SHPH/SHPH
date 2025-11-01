"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Calendar, FileText, Heart, Bell, ExternalLink, BookOpen, MapPin, Grip } from "lucide-react"
import Link from "next/link"
import { clearCurrentUser, getCurrentUserFromStorage } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { EmergencyButton } from "@/components/emergency/emergency-button"
import { patientDataApi, intakesApi } from "@/lib/api"
import { useApiData } from "@/lib/useApiData"
import { PatientAppointments } from "@/components/patient/patient-appointments"

export function PatientDashboard() {
  const router = useRouter()
  const currentUser = getCurrentUserFromStorage()
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [rescheduleForm, setRescheduleForm] = useState({
    newDate: "",
    newTime: "",
    reason: "",
    preferredTime: "",
  })

  // 獲取當前患者 ID（這裡需要從認證系統獲取）
  const isPlaceholderId = currentUser?.id && ["admin_id", "doctor_id", "vhv_id", "patient_id"].includes(currentUser.id)
  const currentPatientId = !isPlaceholderId ? currentUser?.id || "" : ""
  const hasValidPatientId = Boolean(currentPatientId)

  // 從數據庫獲取數據
  const {
    data: appointments,
    loading: appointmentsLoading,
    error: appointmentsError,
    refetch: refetchAppointments,
  } = useApiData(
    () => (currentPatientId ? patientDataApi.getAppointments(currentPatientId) : Promise.resolve([])),
    [currentPatientId],
  )

  const {
    data: visits,
    loading: visitsLoading,
    error: visitsError,
  } = useApiData(
    () => (currentPatientId ? patientDataApi.getVisits(currentPatientId) : Promise.resolve([])),
    [currentPatientId],
  )

  const {
    data: medications,
    loading: medicationsLoading,
    error: medicationsError,
  } = useApiData(
    () => (currentPatientId ? patientDataApi.getMedications(currentPatientId) : Promise.resolve([])),
    [currentPatientId],
  )

  const {
    data: vitalSigns,
    loading: vitalSignsLoading,
    error: vitalSignsError,
  } = useApiData(
    () => (currentPatientId ? patientDataApi.getVitalSigns(currentPatientId) : Promise.resolve([])),
    [currentPatientId],
  )

  const {
    data: healthRecords,
    loading: healthRecordsLoading,
    error: healthRecordsError,
  } = useApiData(
    () => (currentPatientId ? intakesApi.getByPatient(currentPatientId) : Promise.resolve([])),
    [currentPatientId],
  )

  // Filter only approved records
  const approvedHealthRecords = useMemo(() => {
    return (healthRecords || []).filter((record: any) => record.status === "APPROVED")
  }, [healthRecords])

  // 調試日誌
  console.log("Patient Dashboard Data Status:", {
    appointments: { data: appointments, loading: appointmentsLoading, error: appointmentsError },
    visits: { data: visits, loading: visitsLoading, error: visitsError },
    medications: { data: medications, loading: medicationsLoading, error: medicationsError },
    vitalSigns: { data: vitalSigns, loading: vitalSignsLoading, error: vitalSignsError },
    healthRecords: { data: healthRecords, loading: healthRecordsLoading, error: healthRecordsError },
  })

  // 強制使用數據庫數據，不使用 mock 數據
  const upcomingAppointments = appointments || []
  const recentVisits = visits || []
  const currentMedications = medications || []
  const vitalTrends = vitalSigns || []

  console.log("Final data being used:", {
    upcomingAppointments: upcomingAppointments.length,
    recentVisits: recentVisits.length,
    currentMedications: currentMedications.length,
    vitalTrends: vitalTrends.length,
    approvedHealthRecords: approvedHealthRecords.length,
  })

  const handleSignOut = () => {
    clearCurrentUser()
    router.push("/")
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
      preferredTime: "",
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
      preferredAlternatives: rescheduleForm.preferredTime,
    })

    if (!currentPatientId) {
      alert("Unable to submit request because no patient record is linked to this account.")
      return
    }

    try {
      await patientDataApi.createRescheduleRequest({
        appointmentId: selectedAppointment.id,
        patientId: currentPatientId,
        requestedDate: rescheduleForm.newDate,
        requestedTime: rescheduleForm.newTime,
        reason: rescheduleForm.reason,
        preferredAlternatives: rescheduleForm.preferredTime,
      })

      alert(
        `Reschedule request submitted successfully for ${selectedAppointment.type} on ${rescheduleForm.newDate} at ${rescheduleForm.newTime}`,
      )

      setShowRescheduleDialog(false)
      setSelectedAppointment(null)
      setRescheduleForm({
        newDate: "",
        newTime: "",
        reason: "",
        preferredTime: "",
      })

      // Refresh appointments data after successful reschedule
      refetchAppointments()
    } catch (error) {
      console.error("Failed to submit reschedule request:", error)
      alert(`Failed to submit reschedule request: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              <div>
                <h1 className="text-xl md:text-2xl font-bold">My Health Dashboard</h1>
                <p className="text-sm text-muted-foreground">{currentUser?.name || currentUser?.email || "Patient"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/patient/profile" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Update Location
                </Link>
              </Button>
              <Button variant="outline" onClick={handleSignOut} size="sm">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8">
        {!hasValidPatientId && (
          <p className="mb-2 text-xs md:text-sm text-red-600">
            Patient record not found. Please contact support before using emergency services.
          </p>
        )}
        <div className="mb-6 md:mb-8">
          <EmergencyButton
            patientId={currentPatientId}
            patientName={currentUser?.name || "Patient"}
            disabled={!hasValidPatientId}
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Next Appointment</CardTitle>
              <Calendar className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">Soon</div>
              <p className="text-xs text-muted-foreground">Check appointments tab</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Active Medications</CardTitle>
              <Heart className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{currentMedications.length}</div>
              <p className="text-xs text-muted-foreground">Current prescriptions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Last Visit</CardTitle>
              <FileText className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{recentVisits.length > 0 ? "Recent" : "None"}</div>
              <p className="text-xs text-muted-foreground">
                {recentVisits.length > 0 ? "Check history" : "No visits yet"}
              </p>
            </CardContent>
          </Card>

          <Card className="col-span-2 md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Health Score</CardTitle>
              <Heart className="h-3 w-3 md:h-4 md:w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">Good</div>
              <p className="text-xs text-muted-foreground">Stable condition</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="appointments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-[repeat(5,minmax(100px,1fr))] h-auto" >
            <TabsTrigger
              value="appointments"
              className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3"
            >
              <Calendar className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Appointments</span>
              <span className="sm:hidden">Appts</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3">
              <FileText className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Visit History</span>
              <span className="sm:hidden">History</span>
            </TabsTrigger>
            <TabsTrigger
              value="medications"
              className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3"
            >
              <Heart className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Medications</span>
              <span className="sm:hidden">Meds</span>
            </TabsTrigger>
            {/* <TabsTrigger value="vitals" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3">
              <Heart className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Vital Signs</span>
              <span className="sm:hidden">Vitals</span>
            </TabsTrigger> */}
            <TabsTrigger
              value="health_records"
              className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3"
            >
              <FileText className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Health Records</span>
              <span className="sm:hidden">Records</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3">
              <BookOpen className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Self-Care</span>
              <span className="sm:hidden">Care</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-4">
            <PatientAppointments patientId={currentPatientId} />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Visit History</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Your recent medical visits and treatments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentVisits.map((visit: any) => (
                  <Card key={visit.id} className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                        <h4 className="font-medium text-sm md:text-base">{visit.diagnosis}</h4>
                        <Badge variant="default" className="bg-green-500 text-xs">
                          {visit.status}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-xs md:text-sm">
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
                <CardTitle className="text-base md:text-lg">Current Medications</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Your active prescriptions and dosage information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentMedications.map((medication: any, index: number) => (
                  <Card key={index} className="border-l-4 border-l-red-500">
                    <CardContent className="pt-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                        <h4 className="font-medium text-sm md:text-base">{medication.name}</h4>
                        <Badge variant={medication.remainingDays < 5 ? "destructive" : "secondary"} className="text-xs">
                          {medication.remainingDays} days left
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs md:text-sm">
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
                          <p className="text-xs text-red-700">Running low - contact your provider for refill</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
{/* 
          <TabsContent value="vitals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Vital Signs Trends</CardTitle>
                <CardDescription className="text-xs md:text-sm">Your recent vital signs measurements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vitalTrends.map((vital: any, index: number) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-4 border rounded-lg text-xs md:text-sm"
                    >
                      <div className="text-muted-foreground">{vital.recordedDate}</div>
                      <div className="flex flex-col sm:flex-row gap-2 md:gap-6">
                        <div>
                          <span className="text-muted-foreground">Temp:</span>
                          <span className="ml-1 font-medium">{vital.temperature}°C</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">BP:</span>
                          <span className="ml-1 font-medium">
                            {vital.bloodPressureSystolic}/{vital.bloodPressureDiastolic}
                          </span>
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
          </TabsContent> */}

          <TabsContent value="health_records" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">My Health Records</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Health assessments and diagnoses from your healthcare providers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {healthRecordsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Loading health records...</p>
                  </div>
                ) : healthRecordsError ? (
                  <div className="text-center py-8 text-red-500">
                    <p>Error loading health records. Please try again later.</p>
                  </div>
                ) : approvedHealthRecords.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No health records available yet.</p>
                    <p className="text-sm mt-2">Your approved health assessments will appear here.</p>
                  </div>
                ) : (
                  approvedHealthRecords.map((record: any) => (
                    <Card key={record.id} className="border-l-4 border-l-green-500">
                      <CardContent className="pt-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                          <div>
                            <h4 className="font-medium text-sm md:text-base">Health Assessment</h4>
                            <p className="text-xs text-muted-foreground">
                              Recorded on {new Date(record.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-green-500 text-xs">
                              Approved
                            </Badge>
                            <Link
                              href={`/patient/records/${record.id}`}
                              className="text-xs inline-flex items-center gap-1 underline"
                            >
                              View Details <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>

                        {/* Patient Basics */}
                        {record.payload?.patientBasics && (
                          <div className="bg-muted/50 p-3 rounded-lg mb-3 text-xs md:text-sm">
                            <h5 className="font-medium mb-2">Patient Information</h5>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-muted-foreground">Name:</span>
                                <p>
                                  {record.payload.patientBasics.firstName} {record.payload.patientBasics.lastName}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Date of Birth:</span>
                                <p>
                                  {record.payload.patientBasics.dob
                                    ? new Date(record.payload.patientBasics.dob).toLocaleDateString()
                                    : "N/A"}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Symptoms */}
                        {record.payload?.symptoms && (
                          <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg mb-3 text-xs md:text-sm">
                            <h5 className="font-medium mb-2">Chief Complaint</h5>
                            <p>{record.payload.symptoms.chiefComplaint || "Not recorded"}</p>
                            {record.payload.symptoms.onsetDays && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Onset: {record.payload.symptoms.onsetDays} days ago
                              </p>
                            )}
                          </div>
                        )}

                        {/* Vital Signs */}
                        {record.payload?.vitals && (
                          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg mb-3 text-xs md:text-sm">
                            <h5 className="font-medium mb-2">Vital Signs</h5>
                            <div className="grid grid-cols-3 gap-2">
                              {record.payload.vitals.temp && (
                                <div>
                                  <span className="text-muted-foreground">Temperature:</span>
                                  <p className="font-medium">{record.payload.vitals.temp}°C</p>
                                </div>
                              )}
                              {record.payload.vitals.systolic && record.payload.vitals.diastolic && (
                                <div>
                                  <span className="text-muted-foreground">Blood Pressure:</span>
                                  <p className="font-medium">
                                    {record.payload.vitals.systolic}/{record.payload.vitals.diastolic}
                                  </p>
                                </div>
                              )}
                              {record.payload.vitals.hr && (
                                <div>
                                  <span className="text-muted-foreground">Heart Rate:</span>
                                  <p className="font-medium">{record.payload.vitals.hr} bpm</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Chronic Conditions */}
                        {record.payload?.chronicConditions?.list &&
                          record.payload.chronicConditions.list.length > 0 && (
                            <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg text-xs md:text-sm">
                              <h5 className="font-medium mb-2">Chronic Conditions</h5>
                              <div className="flex flex-wrap gap-2">
                                {record.payload.chronicConditions.list.map((condition: any, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {condition.condition.replace("_", " ")}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Self-Care Resources</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Trusted health information and self-care guides
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* General Health */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm md:text-base">
                    <Heart className="h-5 w-5 text-red-500" />
                    General Health Information
                  </h3>
                  <div className="grid gap-3">
                    <a
                      href="https://www.who.int/health-topics"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors text-xs md:text-sm"
                    >
                      <div>
                        <p className="font-medium">WHO Health Topics</p>
                        <p className="text-muted-foreground">
                          Comprehensive health information from the World Health Organization
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                    <a
                      href="https://medlineplus.gov/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors text-xs md:text-sm"
                    >
                      <div>
                        <p className="font-medium">MedlinePlus</p>
                        <p className="text-muted-foreground">
                          Trusted health information from the U.S. National Library of Medicine
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  </div>
                </div>

                {/* Chronic Disease Management */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm md:text-base">
                    <FileText className="h-5 w-5 text-blue-500" />
                    Chronic Disease Management
                  </h3>
                  <div className="grid gap-3">
                    <a
                      href="https://www.cdc.gov/chronicdisease/index.htm"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors text-xs md:text-sm"
                    >
                      <div>
                        <p className="font-medium">CDC Chronic Disease Resources</p>
                        <p className="text-muted-foreground">Information on managing chronic conditions</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                    <a
                      href="https://www.diabetes.org/diabetes"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors text-xs md:text-sm"
                    >
                      <div>
                        <p className="font-medium">American Diabetes Association</p>
                        <p className="text-muted-foreground">Diabetes management and prevention resources</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                    <a
                      href="https://www.heart.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors text-xs md:text-sm"
                    >
                      <div>
                        <p className="font-medium">American Heart Association</p>
                        <p className="text-muted-foreground">Heart health and cardiovascular disease information</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  </div>
                </div>

                {/* Mental Health */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm md:text-base">
                    <User className="h-5 w-5 text-purple-500" />
                    Mental Health & Wellness
                  </h3>
                  <div className="grid gap-3">
                    <a
                      href="https://www.nimh.nih.gov/health"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors text-xs md:text-sm"
                    >
                      <div>
                        <p className="font-medium">National Institute of Mental Health</p>
                        <p className="text-muted-foreground">Mental health information and resources</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                    <a
                      href="https://www.mentalhealth.gov/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors text-xs md:text-sm"
                    >
                      <div>
                        <p className="font-medium">MentalHealth.gov</p>
                        <p className="text-muted-foreground">U.S. government mental health resources</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  </div>
                </div>

                {/* Nutrition & Exercise */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm md:text-base">
                    <Heart className="h-5 w-5 text-green-500" />
                    Nutrition & Exercise
                  </h3>
                  <div className="grid gap-3">
                    <a
                      href="https://www.nutrition.gov/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors text-xs md:text-sm"
                    >
                      <div>
                        <p className="font-medium">Nutrition.gov</p>
                        <p className="text-muted-foreground">Evidence-based nutrition information</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                    <a
                      href="https://health.gov/moveyourway"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors text-xs md:text-sm"
                    >
                      <div>
                        <p className="font-medium">Move Your Way</p>
                        <p className="text-muted-foreground">Physical activity guidelines and tips</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  </div>
                </div>

                {/* Emergency Information */}
                <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200">
                  <h3 className="font-semibold mb-2 flex items-center gap-2 text-red-700 dark:text-red-400 text-sm md:text-base">
                    <Bell className="h-5 w-5" />
                    Emergency Information
                  </h3>
                  <p className="text-xs text-red-600 dark:text-red-300 mb-3">
                    If you are experiencing a medical emergency, call your local emergency number immediately or use the
                    Emergency Alert button at the top of this page.
                  </p>
                  <div className="space-y-2">
                    <a
                      href="https://www.redcross.org/get-help/how-to-prepare-for-emergencies/types-of-emergencies.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-xs md:text-sm"
                    >
                      <p className="font-medium">Red Cross Emergency Preparedness</p>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] w-full max-h-[90vh] overflow-y-auto">
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
                  onChange={(e) => setRescheduleForm((prev) => ({ ...prev, newDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="newTime">New Time</Label>
                <Select
                  value={rescheduleForm.newTime || ""}
                  onValueChange={(value) => setRescheduleForm((prev) => ({ ...prev, newTime: value }))}
                >
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
                onChange={(e) => setRescheduleForm((prev) => ({ ...prev, reason: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="preferredTime">Preferred Alternative Times</Label>
              <Textarea
                id="preferredTime"
                placeholder="If the selected time is not available, please suggest alternative times..."
                value={rescheduleForm.preferredTime || ""}
                onChange={(e) => setRescheduleForm((prev) => ({ ...prev, preferredTime: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRescheduleSubmit}>Submit Request</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
