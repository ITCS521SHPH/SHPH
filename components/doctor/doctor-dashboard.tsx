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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Stethoscope,
  Users,
  User,
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
  ClipboardList,
  Bell,
  Edit2,
  Trash2,
} from "lucide-react"
import { clearCurrentUser, getCurrentUserFromStorage } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useState, useCallback, useEffect } from "react"
import { reviewsApi, patientsApi, emergencyApi } from "../../lib/api"
import { useApiData } from "../../lib/useApiData"
import type { IntakeSubmission } from "@/lib/types"
// Removed inline TaskManagement/PatientAssignment from dashboard; moved to separate page
import Link from "next/link"
import { EmergencyAlerts } from "@/components/emergency/emergency-alerts"
import VhvMap from "@/components/doctor/vhv-map"
import PatientMap from "@/components/doctor/patient-map"
import { UserRole } from "@/lib/types"

export function DoctorDashboard() {
  const router = useRouter()
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState(getCurrentUserFromStorage())
  const [activeEmergencyCount, setActiveEmergencyCount] = useState(0)
  const [showEditPatientDialog, setShowEditPatientDialog] = useState(false)
  const [showDeletePatientDialog, setShowDeletePatientDialog] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<any>(null)

  // Check and fix user ID if it's a hardcoded string
  useEffect(() => {
    if (
      currentUser?.id &&
      (currentUser.id === "doctor_id" ||
        currentUser.id === "admin_id" ||
        currentUser.id === "vhv_id" ||
        currentUser.id === "patient_id")
    ) {
      console.log("Detected hardcoded user ID, clearing localStorage and redirecting to login")
      clearCurrentUser()
      router.push("/login")
    }
  }, [currentUser?.id, router])

  // Memoize API call functions to prevent infinite re-renders
  const getReviewQueue = useCallback(() => reviewsApi.getQueue(), [])
  const getApprovedReviews = useCallback(() => reviewsApi.getQueue("APPROVED"), [])
  const getAllPatients = useCallback(() => patientsApi.getAll(), [])
  const getAvailableVHVs = useCallback(() => patientsApi.getAvailableVHVs(), [])

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

  const {
    data: availableVHVs,
    loading: vhvsLoading,
    error: vhvsError,
    refetch: refetchVHVs,
  } = useApiData(getAvailableVHVs, [])

  // Local state for forms and UI
  const [showAddPatientDialog, setShowAddPatientDialog] = useState(false)
  const [showNewVisitDialog, setShowNewVisitDialog] = useState(false)
  // Removed inline dialogs for Assign Patient and Manage Tasks

  const [newPatientForm, setNewPatientForm] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    address: "",
    phone: "",
    nationalId: "",
    email: "",
    password: "",
    medicalCondition: "",
    lastVisit: "",
  })

  const [newVisitForm, setNewVisitForm] = useState({
    patientId: "",
    visitType: "",
    vhvId: "",
    notes: "",
  })

  useEffect(() => {
    const fetchEmergencyCount = async () => {
      if (currentUser?.id) {
        try {
          const count = await emergencyApi.getActiveCount(currentUser.id, UserRole.DOCTOR)
          setActiveEmergencyCount(count)
        } catch (error) {
          console.error("[v0] Failed to fetch emergency count:", error)
        }
      }
    }

    fetchEmergencyCount()
    const interval = setInterval(fetchEmergencyCount, 30000) // Poll every 30 seconds
    return () => clearInterval(interval)
  }, [currentUser?.id])

  const handleValidateData = async (submissionId: string, action: "approve" | "request_more" | "in_review") => {
    console.log("[v0] Validating patient data:", { submissionId, action })

    try {
      if (action === "approve") {
        await reviewsApi.approve(submissionId)
        alert("✅ Submission approved successfully!")
        console.log("[v0] Approval successful")
      } else if (action === "request_more") {
        // For now, use a default comment - in a real app this would come from a form
        const comment = "Please provide additional information"
        await reviewsApi.requestChanges(submissionId, comment)
        alert("📝 Changes requested - VHV has been notified")
        console.log("[v0] Changes requested")
      } else if (action === "in_review") {
        // Mark as in review - this will use the new API endpoint
        const response = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: submissionId, action: "in_review" }),
        })
        if (!response.ok) throw new Error("Failed to start review")
        alert("🔍 Review started - status updated to 'Under Review'")
        console.log("[v0] Marked as in review")
      }

      // Refresh both the review queue and approved reviews after action
      refetchReviews()
      refetchApproved()
    } catch (error) {
      console.error("[v0] Validation action failed:", error)
      alert("❌ Action failed. Please try again.")
    }
  }

  const handleAddPatient = useCallback(async () => {
    if (
      newPatientForm.firstName &&
      newPatientForm.lastName &&
      newPatientForm.dob &&
      newPatientForm.email &&
      newPatientForm.password &&
      newPatientForm.medicalCondition
    ) {
      try {
        const newPatient = await patientsApi.create({
          firstName: newPatientForm.firstName,
          lastName: newPatientForm.lastName,
          dob: newPatientForm.dob,
          address: newPatientForm.address,
          phone: newPatientForm.phone,
          nationalId: newPatientForm.nationalId,
          email: newPatientForm.email,
          password: newPatientForm.password,
          medicalCondition: newPatientForm.medicalCondition,
          lastVisit: newPatientForm.lastVisit || null,
        })

        setNewPatientForm({
          firstName: "",
          lastName: "",
          dob: "",
          address: "",
          phone: "",
          nationalId: "",
          email: "",
          password: "",
          medicalCondition: "",
          lastVisit: "",
        })
        setShowAddPatientDialog(false)
        refetchPatients() // Refresh the patients list
        console.log("[API] Added new patient:", newPatient)
        alert("Patient created successfully! They can now log in with their email and password.")
      } catch (error) {
        console.error("[API] Failed to add patient:", error)
        alert("Failed to create patient. Please try again.")
      }
    } else {
      alert("Please fill in all required fields including email, password, and medical condition.")
    }
  }, [newPatientForm, refetchPatients])

  const handleAssignVisit = useCallback(async () => {
    if (!newVisitForm.patientId || !newVisitForm.vhvId || !newVisitForm.visitType) {
      alert("Please fill in all required fields")
      return
    }

    try {
      console.log("[API] Assigning visit:", newVisitForm)

      // Create a new assignment between patient and VHV
      const assignment = await patientsApi.assignVHV(
        newVisitForm.patientId,
        newVisitForm.vhvId,
        currentUser?.id || "", // Current doctor's ID
        [], // No tasks for now
      )

      // Reset form and close dialog
      setNewVisitForm({
        patientId: "",
        visitType: "",
        vhvId: "",
        notes: "",
      })
      setShowNewVisitDialog(false)

      // Refresh data
      refetchPatients()

      console.log("[API] Visit assigned successfully:", assignment)
      alert("Visit assigned successfully!")
    } catch (error) {
      console.error("[API] Failed to assign visit:", error)
      alert("Failed to assign visit. Please try again.")
    }
  }, [newVisitForm, refetchPatients])

  const handleEditPatient = async () => {
    try {
      if (!selectedPatient) return

      console.log("[v0] Editing patient:", selectedPatient)

      const response = await fetch(`/api/doctor/patients/${selectedPatient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: selectedPatient.firstName,
          lastName: selectedPatient.lastName,
          dob: selectedPatient.dob,
          address: selectedPatient.address,
          phone: selectedPatient.phone,
          nationalId: selectedPatient.nationalId,
          email: selectedPatient.email,
          medicalCondition: selectedPatient.medicalCondition,
        }),
      })

      if (!response.ok) throw new Error("Failed to update patient")

      alert("Patient updated successfully!")
      setShowEditPatientDialog(false)
      setSelectedPatient(null)
      refetchPatients()
    } catch (error) {
      console.error("[v0] Failed to update patient:", error)
      alert("Failed to update patient. Please try again.")
    }
  }

  const handleDeletePatient = async () => {
    try {
      if (!selectedPatient) return

      console.log("[v0] Deleting patient:", selectedPatient)

      const response = await fetch(`/api/doctor/patients/${selectedPatient.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete patient")

      alert("Patient deleted successfully!")
      setShowDeletePatientDialog(false)
      setSelectedPatient(null)
      refetchPatients()
    } catch (error) {
      console.error("[v0] Failed to delete patient:", error)
      alert("Failed to delete patient. Please try again.")
    }
  }

  const handleSignOut = () => {
    clearCurrentUser()
    router.push("/")
  }

  const togglePatientExpansion = (patientId: string) => {
    setExpandedPatient(expandedPatient === patientId ? null : patientId)
  }

  // Helper function to render submissions list
  const renderSubmissionsList = (
    submissions: (IntakeSubmission & {
      patient?: { firstName: string; lastName: string }
      vhv?: { user?: { email: string } }
    })[],
  ) => {
    if (submissions.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>No submissions found for this filter</p>
        </div>
      )
    }

    return submissions.map((submission) => (
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
                {submission.createdAt ? new Date(submission.createdAt).toLocaleDateString() : "Unknown date"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  submission.status === "SUBMITTED"
                    ? "default"
                    : submission.status === "IN_REVIEW"
                      ? "secondary"
                      : submission.status === "CHANGES_REQUESTED"
                        ? "destructive"
                        : "secondary"
                }
                className={
                  submission.status === "SUBMITTED"
                    ? "bg-orange-500"
                    : submission.status === "IN_REVIEW"
                      ? "bg-blue-500"
                      : submission.status === "CHANGES_REQUESTED"
                        ? "bg-red-500"
                        : ""
                }
              >
                {submission.status === "SUBMITTED"
                  ? "Pending Review"
                  : submission.status === "IN_REVIEW"
                    ? "Under Review"
                    : submission.status === "CHANGES_REQUESTED"
                      ? "Changes Requested"
                      : submission.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Patient Information */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Patient Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-sm">
                  {submission.payload?.patientBasics?.firstName} {submission.payload?.patientBasics?.lastName}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                <p className="text-sm">
                  {submission.payload?.patientBasics?.dob
                    ? new Date(submission.payload.patientBasics.dob).toLocaleDateString()
                    : "Not provided"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Contact Phone</label>
                <p className="text-sm">{submission.payload?.patientBasics?.contactPhone || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Visit Date</label>
                <p className="text-sm">
                  {submission.payload?.visitMeta?.visitDateTime
                    ? new Date(submission.payload.visitMeta.visitDateTime).toLocaleDateString()
                    : "Not recorded"}
                </p>
              </div>
            </div>
            {submission.payload?.visitMeta?.locationText && (
              <div className="mt-3">
                <label className="text-sm font-medium text-muted-foreground">Visit Location</label>
                <p className="text-sm">{submission.payload.visitMeta.locationText}</p>
              </div>
            )}
          </div>

          {/* Symptoms & Chief Complaint */}
          <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Symptoms & Chief Complaint
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Chief Complaint</label>
                <p className="text-sm">
                  {submission.payload?.symptoms?.chiefComplaint || "No chief complaint recorded"}
                </p>
              </div>
              {submission.payload?.symptoms?.onsetDays && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Symptom Onset</label>
                  <p className="text-sm">{submission.payload.symptoms.onsetDays} days ago</p>
                </div>
              )}
            </div>
          </div>

          {/* Vital Signs */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Vital Signs
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Temperature</label>
                <p className="text-sm font-mono">
                  {submission.payload?.vitals?.temp ? `${submission.payload.vitals.temp}°C` : "Not recorded"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Blood Pressure</label>
                <p className="text-sm font-mono">
                  {submission.payload?.vitals?.systolic && submission.payload?.vitals?.diastolic
                    ? `${submission.payload.vitals.systolic}/${submission.payload.vitals.diastolic} mmHg`
                    : "Not recorded"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Heart Rate</label>
                <p className="text-sm font-mono">
                  {submission.payload?.vitals?.hr ? `${submission.payload.vitals.hr} bpm` : "Not recorded"}
                </p>
              </div>
            </div>
          </div>

          {/* Chronic Conditions */}
          {submission.payload?.chronicConditions?.list && submission.payload.chronicConditions.list.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Chronic Conditions
              </h4>
              <div className="space-y-2">
                {submission.payload.chronicConditions.list.map((condition, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {condition.condition.replace("_", " ")}
                    </Badge>
                    {condition.freeText && (
                      <span className="text-sm text-muted-foreground">- {condition.freeText}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Flags */}
          {submission.payload?.riskFlags && (
            <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Risk Factors
              </h4>
              <div className="flex flex-wrap gap-2">
                {submission.payload.riskFlags.isAge60Plus && (
                  <Badge variant="outline" className="text-xs bg-orange-100 dark:bg-orange-900/20">
                    Age 60+
                  </Badge>
                )}
                {submission.payload.riskFlags.isPregnant && (
                  <Badge variant="outline" className="text-xs bg-pink-100 dark:bg-pink-900/20">
                    Pregnant
                  </Badge>
                )}
                {submission.payload.riskFlags.hasChronic && (
                  <Badge variant="outline" className="text-xs bg-red-100 dark:bg-red-900/20">
                    Has Chronic Conditions
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Consent Status */}
          <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Patient Consent
            </h4>
            <p className="text-sm">
              {submission.payload?.consent?.consentGiven
                ? "✅ Patient has provided consent for data collection and sharing"
                : "❌ Consent status unclear - please verify"}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            {submission.status === "SUBMITTED" && (
              <Button
                variant="outline"
                onClick={() => handleValidateData(submission.id, "in_review")}
                className="flex-1"
              >
                <Clock className="h-4 w-4 mr-2" />
                Start Review
              </Button>
            )}
            {submission.status === "CHANGES_REQUESTED" && (
              <div className="flex-1 text-center p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Waiting for VHV to provide additional information
                </p>
              </div>
            )}
            {(submission.status === "SUBMITTED" || submission.status === "IN_REVIEW") && (
              <>
                <Button onClick={() => handleValidateData(submission.id, "approve")} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve & Diagnose
                </Button>
                <Button variant="outline" onClick={() => handleValidateData(submission.id, "request_more")}>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Request More Data
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    ))
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              <div>
                <h1 className="text-xl md:text-2xl font-bold">Doctor Dashboard</h1>
                <p className="text-sm text-muted-foreground">{currentUser?.name || currentUser?.email || "Doctor"}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" asChild size="sm">
                <Link href="/doctor/assignments">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Assignments & Tasks</span>
                  <span className="sm:hidden">Tasks</span>
                </Link>
              </Button>

              <Dialog open={showNewVisitDialog} onOpenChange={setShowNewVisitDialog}>
                <DialogTrigger asChild>
                  <Button variant="default" size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Start New Patient Visit</span>
                    <span className="sm:hidden">New Visit</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-[90vw] w-full max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Start New Patient Visit</DialogTitle>
                    <DialogDescription>
                      Assign a VHV to conduct a new patient visit and data collection.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="patient-select" className="text-right">
                        Patient *
                      </Label>
                      <Select
                        value={newVisitForm.patientId}
                        onValueChange={(value) => setNewVisitForm((prev) => ({ ...prev, patientId: value }))}
                      >
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
                        Visit Type *
                      </Label>
                      <Select
                        value={newVisitForm.visitType}
                        onValueChange={(value) => setNewVisitForm((prev) => ({ ...prev, visitType: value }))}
                      >
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
                      <Label htmlFor="vhv-select" className="text-right">
                        VHV *
                      </Label>
                      <Select
                        value={newVisitForm.vhvId}
                        onValueChange={(value) => setNewVisitForm((prev) => ({ ...prev, vhvId: value }))}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select VHV" />
                        </SelectTrigger>
                        <SelectContent>
                          {(availableVHVs || []).map((vhv: any) => (
                            <SelectItem key={vhv.id} value={vhv.id.toString()}>
                              {vhv.email} - {vhv.role}
                            </SelectItem>
                          ))}
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
                        value={newVisitForm.notes}
                        onChange={(e) => setNewVisitForm((prev) => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowNewVisitDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAssignVisit}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assign Visit
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={handleSignOut} size="sm">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6 mb-6 md:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Pending Validations</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{reviewQueue?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Require your review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Validated Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{approvedReviews?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Cases reviewed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Active Patients</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{patients?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Under your care</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">2.4h</div>
              <p className="text-xs text-muted-foreground">For validations</p>
            </CardContent>
          </Card>

          <Card
            className={`col-span-2 md:col-span-1 ${activeEmergencyCount > 0 ? "border-red-500 bg-red-50 dark:bg-red-950/20" : ""}`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Emergency Alerts</CardTitle>
              <Bell
                className={`h-4 w-4 ${activeEmergencyCount > 0 ? "text-red-500 animate-pulse" : "text-gray-500"}`}
              />
            </CardHeader>
            <CardContent>
              <div className={`text-xl md:text-2xl font-bold ${activeEmergencyCount > 0 ? "text-red-600" : ""}`}>
                {activeEmergencyCount}
              </div>
              <p className="text-xs text-muted-foreground">Active emergencies</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="emergencies" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto">
            <TabsTrigger value="emergencies" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Bell className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Emergencies</span>
              <span className="sm:hidden">Emerg</span>
              {activeEmergencyCount > 0 && (
                <Badge className="bg-red-500 text-white text-xs px-1 py-0 min-w-[16px] h-4">
                  {activeEmergencyCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <AlertTriangle className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Pending Validations</span>
              <span className="sm:hidden">Pending</span>
            </TabsTrigger>
            <TabsTrigger value="validated" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Validated</span>
              <span className="sm:hidden">Valid</span>
            </TabsTrigger>
            <TabsTrigger value="patients" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Users className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Patient List</span>
              <span className="sm:hidden">Patients</span>
            </TabsTrigger>
            <TabsTrigger value="patient_map" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <MapPin className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Patient Map</span>
              <span className="sm:hidden">P-Map</span>
            </TabsTrigger>
            <TabsTrigger value="vhv_map" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <MapPin className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">VHV Map</span>
              <span className="sm:hidden">V-Map</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="emergencies" className="space-y-4">
            <EmergencyAlerts userId={currentUser?.id || "2"} userRole={UserRole.DOCTOR} />
          </TabsContent>

          {/* Assignments tab moved to its own page (/doctor/assignments) */}

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Requiring Validation</CardTitle>
                <CardDescription>Review patient data collected by VHVs and provide diagnostic guidance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status Filter Tabs */}
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">All ({reviewQueue?.length || 0})</TabsTrigger>
                    <TabsTrigger value="submitted">
                      New ({reviewQueue?.filter((r: any) => r.status === "SUBMITTED").length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="in_review">
                      In Review ({reviewQueue?.filter((r: any) => r.status === "IN_REVIEW").length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="changes_requested">
                      Needs Changes ({reviewQueue?.filter((r: any) => r.status === "CHANGES_REQUESTED").length || 0})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="mt-4">
                    {reviewsLoading ? (
                      <div className="text-center py-8">
                        <p>Loading review queue...</p>
                      </div>
                    ) : reviewsError ? (
                      <div className="text-center py-8 text-red-500">
                        <p>Error loading reviews: {reviewsError}</p>
                      </div>
                    ) : (
                      renderSubmissionsList(reviewQueue || [])
                    )}
                  </TabsContent>

                  <TabsContent value="submitted" className="mt-4">
                    {renderSubmissionsList(reviewQueue?.filter((r: any) => r.status === "SUBMITTED") || [])}
                  </TabsContent>

                  <TabsContent value="in_review" className="mt-4">
                    {renderSubmissionsList(reviewQueue?.filter((r: any) => r.status === "IN_REVIEW") || [])}
                  </TabsContent>

                  <TabsContent value="changes_requested" className="mt-4">
                    {renderSubmissionsList(reviewQueue?.filter((r: any) => r.status === "CHANGES_REQUESTED") || [])}
                  </TabsContent>
                </Tabs>
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle>Patient List</CardTitle>
                    <CardDescription>Manage your patients and view their details</CardDescription>
                  </div>
                  <Dialog open={showAddPatientDialog} onOpenChange={setShowAddPatientDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Patient
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] sm:max-w-[90vw] w-full max-h-[90vh] overflow-y-auto">
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
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="email" className="text-right">
                            Email *
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            className="col-span-3"
                            value={newPatientForm.email}
                            onChange={(e) => setNewPatientForm((prev) => ({ ...prev, email: e.target.value }))}
                            placeholder="patient@example.com"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="password" className="text-right">
                            Password *
                          </Label>
                          <Input
                            id="password"
                            type="password"
                            className="col-span-3"
                            value={newPatientForm.password}
                            onChange={(e) => setNewPatientForm((prev) => ({ ...prev, password: e.target.value }))}
                            placeholder="Enter password for login"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="medicalCondition" className="text-right">
                            Medical Condition *
                          </Label>
                          <Input
                            id="medicalCondition"
                            className="col-span-3"
                            value={newPatientForm.medicalCondition}
                            onChange={(e) =>
                              setNewPatientForm((prev) => ({ ...prev, medicalCondition: e.target.value }))
                            }
                            placeholder="e.g., Diabetes, Hypertension"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="lastVisit" className="text-right">
                            Last Visit
                          </Label>
                          <Input
                            id="lastVisit"
                            type="date"
                            className="col-span-3"
                            value={newPatientForm.lastVisit}
                            onChange={(e) => setNewPatientForm((prev) => ({ ...prev, lastVisit: e.target.value }))}
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
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {expandedPatient === patient.id ? (
                            <ChevronDown className="h-4 w-4 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm md:text-base">
                              {patient.firstName} {patient.lastName}
                            </h4>
                            <div className="flex flex-col sm:flex-row sm:gap-4 text-xs md:text-sm text-muted-foreground">
                              <span>DOB: {new Date(patient.dob).toLocaleDateString()}</span>
                              <span className="truncate">Condition: {patient.medicalCondition || "Not specified"}</span>
                              <span>
                                Last Visit:{" "}
                                {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : "Never"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <Badge variant="outline" className="text-xs">
                            Active
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedPatient(patient)
                              setShowEditPatientDialog(true)
                            }}
                          >
                            <Edit2 className="h-3 w-3 md:h-4 md:w-4" />
                            <span className="hidden sm:inline ml-1">Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedPatient(patient)
                              setShowDeletePatientDialog(true)
                            }}
                          >
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4 text-destructive" />
                            <span className="hidden sm:inline ml-1">Delete</span>
                          </Button>
                        </div>
                      </div>

                      {expandedPatient === patient.id && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-xs md:text-sm break-words">{patient.address}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-xs md:text-sm">{patient.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-xs md:text-sm">
                                  Last visit:{" "}
                                  {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : "Never"}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <h5 className="font-medium text-xs md:text-sm">Medical Condition</h5>
                                <p className="text-xs md:text-sm text-muted-foreground">
                                  {patient.medicalCondition || "Not specified"}
                                </p>
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

          <TabsContent value="patient_map" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Patient Location Map</CardTitle>
                <CardDescription>
                  View patient household locations by district. Click markers for patient details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PatientMap patients={(patients || []) as any} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vhv_map" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>VHV Map</CardTitle>
                <CardDescription>
                  View VHV locations by base area. Click markers for details and filter by district.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VhvMap vhvs={(availableVHVs || []) as any} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showEditPatientDialog} onOpenChange={setShowEditPatientDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
            <DialogDescription>Update patient information</DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={selectedPatient.firstName || ""}
                    onChange={(e) => setSelectedPatient({ ...selectedPatient, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={selectedPatient.lastName || ""}
                    onChange={(e) => setSelectedPatient({ ...selectedPatient, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={selectedPatient.dob ? selectedPatient.dob.split("T")[0] : ""}
                  onChange={(e) => setSelectedPatient({ ...selectedPatient, dob: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={selectedPatient.address || ""}
                  onChange={(e) => setSelectedPatient({ ...selectedPatient, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={selectedPatient.phone || ""}
                  onChange={(e) => setSelectedPatient({ ...selectedPatient, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>National ID</Label>
                <Input
                  value={selectedPatient.nationalId || ""}
                  onChange={(e) => setSelectedPatient({ ...selectedPatient, nationalId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={selectedPatient.email || ""}
                  onChange={(e) => setSelectedPatient({ ...selectedPatient, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Medical Condition</Label>
                <Input
                  value={selectedPatient.medicalCondition || ""}
                  onChange={(e) => setSelectedPatient({ ...selectedPatient, medicalCondition: e.target.value })}
                />
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditPatientDialog(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleEditPatient} className="w-full sm:w-auto">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeletePatientDialog} onOpenChange={setShowDeletePatientDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedPatient?.firstName} {selectedPatient?.lastName} from the system.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePatient}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
