"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import {
  Stethoscope,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Activity,
  Plus,
  MapPin,
  Phone,
  Calendar,
  ChevronDown,
  ChevronRight,
  UserPlus,
  UserCheck,
  ClipboardList,
} from "lucide-react"
import { clearCurrentUser, getCurrentUserFromStorage } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useState, useCallback } from "react"
import { reviewsApi, patientsApi } from "../../lib/api"
import { useApiData } from "../../lib/useApiData"
import type { IntakeSubmission } from "@/lib/types"
import { TaskManagement } from "@/components/tasks/task-management"
import { PatientAssignment } from "@/components/tasks/patient-assignment"

export function DoctorDashboard() {
  const router = useRouter()
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState(getCurrentUserFromStorage())

  // Memoize API call functions to prevent infinite re-renders
  const getReviewQueue = useCallback(() => reviewsApi.getQueue(), [])
  const getApprovedReviews = useCallback(() => reviewsApi.getQueue("APPROVED"), [])
  const getAllPatients = useCallback(() => patientsApi.getAll(), [])

  // API data hooks for pending reviews
  const {
    data: reviewQueue,
    loading: reviewsLoading,
    error: reviewsError,
    refetch: refetchReviews,
  } = useApiData(getReviewQueue, [])

  // API data hooks for approved reviews
  const {
    data: approvedReviews,
    loading: approvedLoading,
    error: approvedError,
    refetch: refetchApproved,
  } = useApiData(getApprovedReviews, [])

  const {
    data: patients,
    loading: patientsLoading,
    error: patientsError,
    refetch: refetchPatients,
  } = useApiData(getAllPatients, [])

  // Local state for forms and UI
  const [showAddPatientDialog, setShowAddPatientDialog] = useState(false)
  const [showNewVisitDialog, setShowNewVisitDialog] = useState(false)
  const [showAssignPatientDialog, setShowAssignPatientDialog] = useState(false)
  const [showTaskManagementDialog, setShowTaskManagementDialog] = useState(false)

  const [newPatientForm, setNewPatientForm] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    address: "",
    phone: "",
    nationalId: "",
  })

  const handleValidateData = async (submissionId: string, action: "approve" | "request_more") => {
    console.log("[v0] Validating patient data:", { submissionId, action })

    try {
      if (action === "approve") {
        await reviewsApi.approve(submissionId)
        console.log("[v0] Approval successful")
      } else {
        // For now, use a default comment - in a real app this would come from a form
        const comment = "Please provide additional information"
        await reviewsApi.requestChanges(submissionId, comment)
        console.log("[v0] Changes requested")
      }

      // Refresh both the review queue and approved reviews after action
      refetchReviews()
      refetchApproved()
    } catch (error) {
      console.error("[v0] Validation action failed:", error)
      // TODO: Show error message to user
    }
  }

  const handleAddPatient = useCallback(async () => {
    if (newPatientForm.firstName && newPatientForm.lastName && newPatientForm.dob) {
      try {
        const newPatient = await patientsApi.create({
          firstName: newPatientForm.firstName,
          lastName: newPatientForm.lastName,
          dob: newPatientForm.dob,
          address: newPatientForm.address,
          phone: newPatientForm.phone,
          nationalId: newPatientForm.nationalId,
        })

        setNewPatientForm({
          firstName: "",
          lastName: "",
          dob: "",
          address: "",
          phone: "",
          nationalId: "",
        })
        setShowAddPatientDialog(false)
        refetchPatients() // Refresh the patients list
        console.log("[API] Added new patient:", newPatient)
      } catch (error) {
        console.error("[API] Failed to add patient:", error)
      }
    }
  }, [newPatientForm, refetchPatients])

  const handleSignOut = () => {
    clearCurrentUser()
    router.push("/")
  }

  const togglePatientExpansion = (patientId: string) => {
    setExpandedPatient(expandedPatient === patientId ? null : patientId)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
                <p className="text-muted-foreground">{currentUser?.name || currentUser?.email || "Doctor"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={showAssignPatientDialog} onOpenChange={setShowAssignPatientDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Assign Patient
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Assign Patient to VHV</DialogTitle>
                    <DialogDescription>
                      Assign a patient to a Village Health Volunteer with specific tasks.
                    </DialogDescription>
                  </DialogHeader>
                  <PatientAssignment onClose={() => setShowAssignPatientDialog(false)} />
                </DialogContent>
              </Dialog>

              <Dialog open={showTaskManagementDialog} onOpenChange={setShowTaskManagementDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Manage Tasks
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px]">
                  <DialogHeader>
                    <DialogTitle>Task Management</DialogTitle>
                    <DialogDescription>Create and manage tasks for Village Health Volunteers.</DialogDescription>
                  </DialogHeader>
                  <TaskManagement onClose={() => setShowTaskManagementDialog(false)} />
                </DialogContent>
              </Dialog>

              <Dialog open={showNewVisitDialog} onOpenChange={setShowNewVisitDialog}>
                <DialogTrigger asChild>
                  <Button variant="default">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Start New Patient Visit
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Start New Patient Visit</DialogTitle>
                    <DialogDescription>
                      Assign a VHV to conduct a new patient visit and data collection.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="patient-select" className="text-right">
                        Patient
                      </Label>
                      <Select>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {(patients || []).map((patient: any) => (
                            <SelectItem key={patient.id} value={patient.id.toString()}>
                              {patient.firstName} {patient.lastName} - {patient.address}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="visit-type" className="text-right">
                        Visit Type
                      </Label>
                      <Select>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select visit type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="routine">Routine Check-up</SelectItem>
                          <SelectItem value="followup">Follow-up Visit</SelectItem>
                          <SelectItem value="emergency">Emergency Assessment</SelectItem>
                          <SelectItem value="screening">Health Screening</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="instructions" className="text-right">
                        Instructions
                      </Label>
                      <Textarea
                        id="instructions"
                        placeholder="Special instructions for the VHV..."
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowNewVisitDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setShowNewVisitDialog(false)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assign Visit
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Validations</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reviewQueue?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Require your review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Validated Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedReviews?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Cases reviewed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patients?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Under your care</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.4h</div>
              <p className="text-xs text-muted-foreground">For validations</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Pending Validations
            </TabsTrigger>
            <TabsTrigger value="validated" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Validated
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="patients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Patient List
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Assignments</CardTitle>
                  <CardDescription>Assign patients to VHVs with specific care tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <PatientAssignment />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Task Management</CardTitle>
                  <CardDescription>Create and manage tasks for Village Health Volunteers</CardDescription>
                </CardHeader>
                <CardContent>
                  <TaskManagement />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Requiring Validation</CardTitle>
                <CardDescription>Review patient data collected by VHVs and provide diagnostic guidance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviewsLoading ? (
                  <div className="text-center py-8">
                    <p>Loading review queue...</p>
                  </div>
                ) : reviewsError ? (
                  <div className="text-center py-8 text-red-500">
                    <p>Error loading reviews: {reviewsError}</p>
                  </div>
                ) : reviewQueue && reviewQueue.length > 0 ? (
                  reviewQueue.map(
                    (
                      submission: IntakeSubmission & {
                        patient?: { firstName: string; lastName: string }
                        vhv?: { user?: { email: string } }
                      },
                    ) => (
                      <Card key={submission.id} className="border-l-4 border-l-orange-500">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                {submission.patient
                                  ? `${submission.patient.firstName} ${submission.patient.lastName}`
                                  : submission.payload?.patientBasics
                                    ? `${submission.payload.patientBasics.firstName} ${submission.payload.patientBasics.lastName}`
                                    : "Unknown Patient"}
                              </CardTitle>
                              <CardDescription>
                                Collected by {submission.vhv?.user?.email || "Unknown VHV"} on{" "}
                                {submission.createdAt
                                  ? new Date(submission.createdAt).toLocaleDateString()
                                  : "Unknown date"}
                              </CardDescription>
                            </div>
                            <Badge variant="secondary">Pending Review</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                Chief Complaint
                              </h4>
                              <div className="text-sm">
                                {submission.payload?.symptoms?.chiefComplaint || "No chief complaint recorded"}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Vital Signs
                              </h4>
                              <div className="space-y-1 text-sm">
                                <p>
                                  Temperature:{" "}
                                  {submission.payload?.vitals?.temp
                                    ? `${submission.payload.vitals.temp}°C`
                                    : "Not recorded"}
                                </p>
                                <p>
                                  Blood Pressure:{" "}
                                  {submission.payload?.vitals?.systolic && submission.payload?.vitals?.diastolic
                                    ? `${submission.payload.vitals.systolic}/${submission.payload.vitals.diastolic}`
                                    : "Not recorded"}
                                </p>
                                <p>
                                  Heart Rate:{" "}
                                  {submission.payload?.vitals?.hr
                                    ? `${submission.payload.vitals.hr} bpm`
                                    : "Not recorded"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-4">
                            <Button onClick={() => handleValidateData(submission.id, "approve")} className="flex-1">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Validate & Diagnose
                            </Button>
                            <Button variant="outline" onClick={() => handleValidateData(submission.id, "request_more")}>
                              Request More Data
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ),
                  )
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No submissions pending review</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="validated" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recently Validated Cases</CardTitle>
                <CardDescription>Cases you have reviewed and provided treatment plans for</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {approvedLoading ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Loading approved reviews...</p>
                  </div>
                ) : approvedReviews && approvedReviews.length > 0 ? (
                  approvedReviews.map((review: any) => (
                    <Card key={review.id} className="border-l-4 border-l-green-500">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {review.patient?.firstName} {review.patient?.lastName}
                            </CardTitle>
                            <CardDescription>
                              Validated on {new Date(review.updatedAt).toLocaleDateString()} • Collected by{" "}
                              {review.vhv?.user?.email}
                            </CardDescription>
                          </div>
                          <Badge variant="default" className="bg-green-500">
                            Validated
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Status</h4>
                            <p className="text-sm text-muted-foreground">Approved by doctor</p>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Notes</h4>
                            <p className="text-sm text-muted-foreground">
                              {review.reviewActions?.[0]?.comment || "No additional notes"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No Validated Cases</h3>
                    <p className="text-sm text-muted-foreground">Approved patient reviews will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Patient List</CardTitle>
                    <CardDescription>Manage your patients and view their details</CardDescription>
                  </div>
                  <Dialog open={showAddPatientDialog} onOpenChange={setShowAddPatientDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Patient
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add New Patient</DialogTitle>
                        <DialogDescription>
                          Enter the patient's information to add them to your care list.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="firstName" className="text-right">
                            First Name
                          </Label>
                          <Input
                            id="firstName"
                            className="col-span-3"
                            value={newPatientForm.firstName}
                            onChange={(e) => setNewPatientForm((prev) => ({ ...prev, firstName: e.target.value }))}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="lastName" className="text-right">
                            Last Name
                          </Label>
                          <Input
                            id="lastName"
                            className="col-span-3"
                            value={newPatientForm.lastName}
                            onChange={(e) => setNewPatientForm((prev) => ({ ...prev, lastName: e.target.value }))}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="dob" className="text-right">
                            Date of Birth
                          </Label>
                          <Input
                            id="dob"
                            type="date"
                            className="col-span-3"
                            value={newPatientForm.dob}
                            onChange={(e) => setNewPatientForm((prev) => ({ ...prev, dob: e.target.value }))}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="nationalId" className="text-right">
                            National ID
                          </Label>
                          <Input
                            id="nationalId"
                            className="col-span-3"
                            value={newPatientForm.nationalId}
                            onChange={(e) => setNewPatientForm((prev) => ({ ...prev, nationalId: e.target.value }))}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="address" className="text-right">
                            Address
                          </Label>
                          <Textarea
                            id="address"
                            className="col-span-3"
                            value={newPatientForm.address}
                            onChange={(e) => setNewPatientForm((prev) => ({ ...prev, address: e.target.value }))}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="phone" className="text-right">
                            Phone
                          </Label>
                          <Input
                            id="phone"
                            className="col-span-3"
                            value={newPatientForm.phone}
                            onChange={(e) => setNewPatientForm((prev) => ({ ...prev, phone: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowAddPatientDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddPatient}>Add Patient</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {(patients || []).map((patient: any) => (
                  <Card key={patient.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => togglePatientExpansion(patient.id)}
                      >
                        <div className="flex items-center gap-3">
                          {expandedPatient === patient.id ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <div>
                            <h4 className="font-medium">
                              {patient.firstName} {patient.lastName}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              DOB: {new Date(patient.dob).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Active</Badge>
                        </div>
                      </div>

                      {expandedPatient === patient.id && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{patient.address}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{patient.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Last visit: {patient.lastVisit}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <h5 className="font-medium text-sm">Medical Condition</h5>
                                <p className="text-sm text-muted-foreground">{patient.condition}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
