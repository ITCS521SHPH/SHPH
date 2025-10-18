"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PatientReview } from "./patient-review"
import { StructuredDataForm } from "./structured-data-form"
import { TaskFormViewer } from "./task-form-viewer"
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
import { Plus, Eye } from "lucide-react"
import {
  Users,
  CheckCircle,
  FileText,
  MapPin,
  ChevronDown,
  ChevronRight,
  Phone,
  Activity,
  Send,
  Calendar,
  AlertCircle,
  Target,
  Bell,
} from "lucide-react"
import { useState, useCallback, useEffect, useMemo } from "react"
import { clearCurrentUser, getCurrentUserFromStorage } from "@/lib/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { patientsApi, intakesApi, tasksApi, emergencyApi, vhvApi, areaTasksApi } from "@/lib/api"
import { BANGKOK_DISTRICTS } from "@/lib/bangkok-districts"
import { useApiData } from "@/lib/useApiData"
import { initOfflineStorage, getOfflineFormData } from "@/lib/offline-storage"
import { EmergencyAlerts } from "@/components/emergency/emergency-alerts"
import { UserRole } from "@/lib/types"

export function VHVDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState(getCurrentUserFromStorage())
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null)
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
  const [selectedPatientForReview, setSelectedPatientForReview] = useState<any>(null)
  const [reviewFormData, setReviewFormData] = useState<any>(null)
  const [reviewIntakeId, setReviewIntakeId] = useState<string | null>(null)
  const [showReviewPage, setShowReviewPage] = useState(false)
  const [showDataForm, setShowDataForm] = useState(false)
  const [selectedPatientForForm, setSelectedPatientForForm] = useState<any>(null)
  const [showAddPatientDialog, setShowAddPatientDialog] = useState(false)
  const [completedSections, setCompletedSections] = useState<string[]>([])
  const [currentIntakeId, setCurrentIntakeId] = useState<string | null>(null)
  const [activeEmergencyCount, setActiveEmergencyCount] = useState(0)
  const [undoableActions, setUndoableActions] = useState<{
    [key: string]: { type: string; data: any; timeoutId: NodeJS.Timeout }
  }>({})

  // Initialize offline storage
  useEffect(() => {
    initOfflineStorage().catch(console.error)
  }, [])

  useEffect(() => {
    const fetchEmergencyCount = async () => {
      if (currentUser?.id) {
        try {
          const count = await emergencyApi.getActiveCount(currentUser.id, UserRole.VHV)
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

  // Cleanup undo timers on unmount
  useEffect(() => {
    return () => {
      Object.values(undoableActions).forEach((action) => {
        clearTimeout(action.timeoutId)
      })
    }
  }, [undoableActions])

  const [newPatientForm, setNewPatientForm] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    address: "",
    phone: "",
    nationalId: "",
    district: "",
  })
  const getAssignedPatients = useCallback(async () => {
    if (!currentUser?.id) return []

    try {
      // Get patients assigned to this VHV from Supabase
      const assignments = await patientsApi.getAssignmentsByVHV(currentUser.id)

      // Do not hide patients after submission; keep them visible.
      // The UI already shows appropriate actions (e.g., View Visit) based on intake status.
      return assignments
    } catch (error) {
      console.error("Error fetching assigned patients:", error)
      return []
    }
  }, [currentUser?.id])

  const {
    data: assignedPatients,
    loading: patientsLoading,
    error: patientsError,
    refetch: refetchPatients,
  } = useApiData(getAssignedPatients, [])

  // Fetch all assignments (unfiltered) for visibility and task joins
  const getAllAssignmentsForVHV = useCallback(async () => {
    if (!currentUser?.id) return []
    try {
      return patientsApi.getAssignmentsByVHV(currentUser.id)
    } catch (e) {
      console.error("Error fetching all assignments for VHV:", e)
      return []
    }
  }, [currentUser?.id])

  const { data: allAssignmentsForVHV } = useApiData(getAllAssignmentsForVHV, [])

  const getTasks = useCallback(async () => {
    if (!currentUser?.id) return []
    try {
      const [patientTasks, areaTasks] = await Promise.all([
        tasksApi.getByVHV(currentUser.id),
        areaTasksApi.getByVHV(currentUser.id).catch(() => []),
      ])
      return [...patientTasks, ...areaTasks]
    } catch (e) {
      console.error("Error fetching tasks for VHV:", e)
      return []
    }
  }, [currentUser?.id])

  const { data: tasks, loading: tasksLoading, refetch: refetchTasks } = useApiData(getTasks, [])

  const getVHVProfile = useCallback(async () => {
    if (!currentUser?.id) return null
    return vhvApi.getProfile(currentUser.id)
  }, [currentUser?.id])

  const {
    data: vhvProfile,
    loading: profileLoading,
    error: profileError,
  } = useApiData(getVHVProfile, [currentUser?.id])

  // Helper to determine if a patient has any submitted/approved/rejected intake
  const hasSubmittedIntake = useCallback((patient: any) => {
    return !!patient?.intakeSubmissions?.some(
      (intake: any) => intake.status === "SUBMITTED" || intake.status === "APPROVED" || intake.status === "REJECTED",
    )
  }, [])

  // Visible assignments (exclude area placeholders) – defined early so other hooks can depend on it
  const isAreaPlaceholder = (patient: any) => {
    if (!patient) return false
    const fn = (patient.firstName || (patient as any).first_name || "").toString().trim()
    return fn === "Area Task" || fn === "Area"
  }
  const visibleAssignments = (assignedPatients ?? []).filter((a: any) => !isAreaPlaceholder(a.patient))

  // Assigned Patients filter (All/Active/Completed)
  const [assignedFilter, setAssignedFilter] = useState<"all" | "active" | "completed">("all")
  // Load saved filter on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vhvAssignedFilter")
      if (saved === "all" || saved === "active" || saved === "completed") {
        setAssignedFilter(saved)
      }
    }
  }, [])
  // Persist filter changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("vhvAssignedFilter", assignedFilter)
    }
  }, [assignedFilter])
  const filteredAssignments = useMemo(() => {
    if (assignedFilter === "active") {
      return (visibleAssignments ?? []).filter((assignment: any) => !hasSubmittedIntake(assignment.patient))
    }
    if (assignedFilter === "completed") {
      return (visibleAssignments ?? []).filter((assignment: any) => hasSubmittedIntake(assignment.patient))
    }
    return visibleAssignments ?? []
  }, [visibleAssignments, assignedFilter, hasSubmittedIntake])

  // Add new patient functionality
  const handleAddPatient = useCallback(async () => {
    if (!newPatientForm.firstName || !newPatientForm.lastName || !newPatientForm.dob) {
      alert("Please complete the required fields before adding a patient.")
      return
    }

    if (!newPatientForm.district) {
      alert("Select a district so tasks remain within your coverage area.")
      return
    }

    try {
      await patientsApi.create({
        firstName: newPatientForm.firstName,
        lastName: newPatientForm.lastName,
        dob: newPatientForm.dob,
        address: newPatientForm.address,
        phone: newPatientForm.phone,
        nationalId: newPatientForm.nationalId,
        district: newPatientForm.district,
      })

      setNewPatientForm({
        firstName: "",
        lastName: "",
        dob: "",
        address: "",
        phone: "",
        nationalId: "",
        district: "",
      })
      setShowAddPatientDialog(false)
      refetchPatients()
    } catch (error) {
      console.error("Error adding patient:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert(`Failed to create patient: ${errorMessage}. Please try again.`)
    }
  }, [newPatientForm, refetchPatients])

  const handleSignOut = () => {
    clearCurrentUser()
    router.push("/")
  }

  const togglePatientExpansion = (patientId: string) => {
    setExpandedPatient(expandedPatient === patientId ? null : patientId)
  }

  const handleOpenDataForm = async (patient: any) => {
    try {
      // Additional validation: ensure patient has a valid ID
      if (!patient || !patient.id) {
        console.error("Cannot open data form: Invalid patient object", patient)
        alert("Error: Invalid patient data. Please refresh and try again.")
        return
      }

      console.log("Creating new intake for patient:", patient.id)
      // Create a new intake submission when starting data collection
      const newIntake = await intakesApi.create(patient.id, currentUser?.id)
      console.log("New intake created:", newIntake)

      // Validate that intake was created properly
      if (!newIntake || !newIntake.id) {
        throw new Error("Intake creation returned invalid data")
      }

      setCurrentIntakeId(newIntake.id)
      setSelectedPatientForForm(patient)
      setShowDataForm(true)

      // Refresh assigned patients data to show updated intake status
      refetchPatients()
    } catch (error) {
      console.error("Failed to create intake:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert(`Failed to create intake submission: ${errorMessage}. Please try again.`)
      // Don't open form if intake creation fails
      setCurrentIntakeId(null)
      setSelectedPatientForForm(null)
    }
  }

  const handleContinueDataForm = async (patient: any, intakeId: string) => {
    try {
      // Validate inputs
      if (!patient || !patient.id) {
        console.error("Cannot continue data form: Invalid patient object", patient)
        alert("Error: Invalid patient data. Please refresh and try again.")
        return
      }

      if (!intakeId || intakeId.trim() === "") {
        console.error("Cannot continue data form: Invalid intake ID", intakeId)
        alert("Error: Invalid intake ID. Please refresh and try again.")
        return
      }

      console.log("Continuing intake:", intakeId, "for patient:", patient.id)
      // Load offline data to get completed sections
      const offlineData = await getOfflineFormData(patient.id.toString())
      if (offlineData && offlineData.completedSections) {
        setCompletedSections(offlineData.completedSections)
        console.log("Restored completed sections:", offlineData.completedSections)
      }

      setCurrentIntakeId(intakeId)
      setSelectedPatientForForm(patient)
      setShowDataForm(true)

      // Refresh assigned patients data
      refetchPatients()
    } catch (error) {
      console.error("Failed to load offline data:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert(`Failed to continue data form: ${errorMessage}. Please try again.`)
      // Reset state on error
      setCurrentIntakeId(null)
      setSelectedPatientForForm(null)
    }
  }

  const handleCloseDataForm = () => {
    setShowDataForm(false)
    setSelectedPatientForForm(null)
    setCompletedSections([])
    setCurrentIntakeId(null)
  }

  const handleOpenPatientReview = async (patient: any, intake: any) => {
    try {
      setSelectedPatientForReview(patient)
      setReviewIntakeId(intake.id)
      setShowReviewPage(true)

      // Refresh assigned patients data
      refetchPatients()
    } catch (error) {
      console.error("Failed to open patient review:", error)
    }
  }

  const handleFormComplete = async () => {
    if (currentIntakeId) {
      try {
        // Submit the intake for doctor review
        await intakesApi.submit(currentIntakeId)
        console.log("Intake submitted for doctor review")
      } catch (error) {
        console.error("Failed to submit intake:", error)
      }
    }

    handleCloseDataForm()
    refetchPatients()
  }

  const handleLogout = () => {
    clearCurrentUser()
    router.push("/")
  }

  const handleCompleteDataCollection = async (patient: any) => {
    try {
      // Load the saved form data for this patient
      const offlineData = await getOfflineFormData(patient.id.toString())
      console.log("Loading form data for review:", offlineData)

      setSelectedPatientForReview(patient)
      setReviewFormData(offlineData?.formData || null)
      setReviewIntakeId(offlineData?.intakeId || null)
      setShowReviewPage(true)
    } catch (error) {
      console.error("Failed to load form data for review:", error)
      // Show review page anyway, even if we can't load the data
      setSelectedPatientForReview(patient)
      setReviewFormData(null)
      setReviewIntakeId(null)
      setShowReviewPage(true)
    }
  }

  const handleBackFromReview = () => {
    setShowReviewPage(false)
    setSelectedPatientForReview(null)
    setReviewFormData(null)
    setReviewIntakeId(null)
  }

  const handleConfirmSubmission = async () => {
    if (!reviewIntakeId) {
      console.error("No intake ID available for submission")
      alert("Error: No intake data found. Please try again.")
      return
    }

    try {
      console.log("Submitting intake for review:", reviewIntakeId)

      // Submit the intake for doctor review
      await intakesApi.submit(reviewIntakeId)

      console.log("Intake successfully submitted for doctor review")
      alert("Success! Patient data has been submitted for doctor review.")

      // Clean up state
      setShowReviewPage(false)
      setSelectedPatientForReview(null)
      setReviewFormData(null)
      setReviewIntakeId(null)

      // Refresh the patient list to reflect updated status
      refetchPatients()
    } catch (error) {
      console.error("Failed to submit intake:", error)
      alert("Error: Failed to submit data. Please try again.")
    }
  }

  const [showTaskForm, setShowTaskForm] = useState(false)
  const [selectedTaskForForm, setSelectedTaskForForm] = useState<any>(null)

  const handleOpenTaskForm = (task: any) => {
    setSelectedTaskForForm(task)
    setShowTaskForm(true)
  }

  const handleSubmitTaskForm = async (formData: Record<string, any>) => {
    if (!selectedTaskForForm) return

    try {
      console.log("[v0] Submitting task form:", { taskId: selectedTaskForForm.id, formData })

      // Complete the task with form data
      if (selectedTaskForForm.patientId) {
        await tasksApi.complete(selectedTaskForForm.id, formData)
      } else {
        await areaTasksApi.complete(selectedTaskForForm.id, formData)
      }

      alert("Task form submitted successfully!")
      setShowTaskForm(false)
      setSelectedTaskForForm(null)
      refetchTasks()
    } catch (error) {
      console.error("Failed to submit task form:", error)
      throw error
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    try {
      const task = tasks?.find((t: any) => t.id === taskId)
      if (!task) return

      // Complete the task (patient vs area)
      if (task.patientId) {
        await tasksApi.complete(taskId)
      } else {
        await areaTasksApi.complete(taskId)
      }

      // Create an undo action with 10-second timeout
      const timeoutId = setTimeout(() => {
        setUndoableActions((prev) => {
          const newActions = { ...prev }
          delete newActions[taskId]
          return newActions
        })
      }, 10000)

      setUndoableActions((prev) => ({
        ...prev,
        [taskId]: {
          type: "COMPLETE_TASK",
          data: task,
          timeoutId,
        },
      }))

      refetchTasks()

      // Show success message
      console.log(`Task "${task.title}" completed. Undo available for 10 seconds.`)
    } catch (error) {
      console.error("Failed to complete task:", error)
      alert("Failed to complete task. Please try again.")
    }
  }

  const handleUndoCompleteTask = async (taskId: string) => {
    const undoAction = undoableActions[taskId]
    if (!undoAction) return

    try {
      // Clear the timeout
      clearTimeout(undoAction.timeoutId)

      // Undo the task completion (patient vs area)
      if (undoAction.data?.patientId) {
        await tasksApi.reopen(taskId)
      } else {
        await areaTasksApi.reopen(taskId)
      }

      // Remove from undo actions
      setUndoableActions((prev) => {
        const newActions = { ...prev }
        delete newActions[taskId]
        return newActions
      })

      refetchTasks()
      console.log(`Task "${undoAction.data.title}" completion undone.`)
    } catch (error) {
      console.error("Failed to undo task completion:", error)
      alert("Failed to undo task completion. Please try again.")
    }
  }

  // (moved earlier)

  const visibleTasks = useMemo(() => {
    const taskList = tasks ?? []
    const district = (vhvProfile?.district ?? "").trim()
    if (!district) return taskList

    const patientDistrictById = new Map<string, string | undefined>(
      ((allAssignmentsForVHV ?? []) as any[])
        .map((a: any) => [a.patientId || a.patient?.id, a.patient?.district] as const)
        .filter(([pid]) => !!pid),
    )
    const hasPatientMap = patientDistrictById.size > 0

    return taskList.filter((task: any) => {
      const pid = task.patientId
      if (pid) {
        if (!hasPatientMap) return true // no assignment info; don't hide patient tasks
        const pDistrict = (patientDistrictById.get(pid) || "").trim()
        if (pDistrict === "") return true // unknown patient district; keep visible
        return pDistrict === district
      }
      const tDistrict = (task.district || "").trim()
      return tDistrict !== "" && tDistrict === district
    })
  }, [tasks, vhvProfile?.district, allAssignmentsForVHV])

  const locationFilterActive = (vhvProfile?.district ?? "").trim() !== ""
  const normStatus = (s: any) => (s || "").toString().toLowerCase()
  const normPriority = (p: any) => (p || "").toString().toLowerCase()
  // Split visible tasks by type
  const patientTasksAll = useMemo(() => (visibleTasks || []).filter((task: any) => !!task.patientId), [visibleTasks])
  const areaTasksAll = useMemo(() => (visibleTasks || []).filter((task: any) => !task.patientId), [visibleTasks])
  const activePatientList = useMemo(
    () => patientTasksAll.filter((task: any) => normStatus(task.status) !== "completed"),
    [patientTasksAll],
  )
  const completedPatientList = useMemo(
    () => patientTasksAll.filter((task: any) => normStatus(task.status) === "completed"),
    [patientTasksAll],
  )
  const activeAreaList = useMemo(
    () => areaTasksAll.filter((task: any) => normStatus(task.status) !== "completed"),
    [areaTasksAll],
  )
  const completedAreaList = useMemo(
    () => areaTasksAll.filter((task: any) => normStatus(task.status) === "completed"),
    [areaTasksAll],
  )

  // Calculate statistics from real data
  const activePatients = visibleAssignments.filter((assignment: any) => assignment.status === "active")
  const completedVisits = visibleAssignments.filter((assignment: any) => assignment.patient?.lastVisit).length
  const pendingReviews = visibleAssignments.filter(
    (assignment: any) => assignment.patient?.status === "pending_review",
  ).length

  const pendingTasks = visibleTasks.filter((t: any) => normStatus(t.status) === "pending").length
  const inProgressTasks = visibleTasks.filter((t: any) => normStatus(t.status) === "in_progress").length
  const completedTasks = visibleTasks.filter((t: any) => normStatus(t.status) === "completed").length

  // Debug logging for statistics
  console.log("VHVDashboard - Statistics:")
  console.log("  activePatients:", activePatients.length)
  console.log("  completedVisits:", completedVisits)
  console.log("  pendingReviews:", pendingReviews)
  console.log("  pendingTasks:", pendingTasks)
  console.log("  inProgressTasks:", inProgressTasks)
  console.log("  completedTasks:", completedTasks)
  console.log("  locationFilterActive:", locationFilterActive)

  if (showReviewPage && selectedPatientForReview) {
    return (
      <PatientReview
        patient={selectedPatientForReview}
        formData={reviewFormData}
        onBack={handleBackFromReview}
        onConfirm={handleConfirmSubmission}
      />
    )
  }

  if (showDataForm && selectedPatientForForm) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={handleCloseDataForm}>
                  ← Back to Dashboard
                </Button>
                <div>
                  <h1 className="text-xl font-bold">
                    Data Collection - {selectedPatientForForm.firstName} {selectedPatientForForm.lastName}
                  </h1>
                  <p className="text-muted-foreground">Complete the structured data collection form</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <StructuredDataForm
            patient={{
              id: selectedPatientForForm.id,
              name: `${selectedPatientForForm.firstName} ${selectedPatientForForm.lastName}`,
              hospitalNumber: selectedPatientForForm.nationalId,
            }}
            intakeId={currentIntakeId}
            onSectionComplete={(section) => {
              if (!completedSections.includes(section)) {
                setCompletedSections([...completedSections, section])
              }
            }}
            onFormComplete={handleFormComplete}
            completedSections={completedSections}
          />
        </main>
      </div>
    )
  }

  if (showTaskForm && selectedTaskForForm) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => setShowTaskForm(false)}>
                  ← Back to Dashboard
                </Button>
                <div>
                  <h1 className="text-xl font-bold">Task Form</h1>
                  <p className="text-muted-foreground">Fill out the required information</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <TaskFormViewer
            task={selectedTaskForForm}
            onSubmit={handleSubmitTaskForm}
            onCancel={() => setShowTaskForm(false)}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">VHV Dashboard</h1>
                <p className="text-muted-foreground">Village Health Volunteer Portal</p>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>
                    {profileLoading
                      ? "Loading coverage details..."
                      : profileError
                        ? "Coverage details unavailable. Update your profile."
                        : locationFilterActive && vhvProfile?.district
                          ? `Primary district: ${vhvProfile.district}`
                          : "No district assigned. Set it in My Profile."}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={showAddPatientDialog} onOpenChange={setShowAddPatientDialog}>
                <DialogTrigger asChild>
                  <Button variant="default">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Patient
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Patient</DialogTitle>
                    <DialogDescription>Enter the patient information to create a new record.</DialogDescription>
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
                      <Label htmlFor="district" className="text-right">
                        District
                      </Label>
                      <div className="col-span-3">
                        <Select
                          value={newPatientForm.district}
                          onValueChange={(value) => setNewPatientForm((prev) => ({ ...prev, district: value }))}
                        >
                          <SelectTrigger id="district">
                            <SelectValue placeholder="Select Bangkok district" />
                          </SelectTrigger>
                          <SelectContent className="max-h-64 overflow-y-auto">
                            {BANGKOK_DISTRICTS.map((district) => (
                              <SelectItem key={district} value={district}>
                                {district}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
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
              <Button variant="ghost" asChild>
                <Link href="/vhv/profile">My Profile</Link>
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activePatients.length}</div>
              <p className="text-xs text-muted-foreground">Active assignments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTasks}</div>
              <p className="text-xs text-muted-foreground">Tasks to complete</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressTasks}</div>
              <p className="text-xs text-muted-foreground">Tasks in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasks}</div>
              <p className="text-xs text-muted-foreground">Tasks completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {visibleTasks.length > 0 ? Math.round((completedTasks / visibleTasks.length) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Task completion rate</p>
            </CardContent>
          </Card>

          <Card className={activeEmergencyCount > 0 ? "border-red-500 bg-red-50 dark:bg-red-950/20" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emergency Alerts</CardTitle>
              <Bell
                className={`h-4 w-4 ${activeEmergencyCount > 0 ? "text-red-500 animate-pulse" : "text-gray-500"}`}
              />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${activeEmergencyCount > 0 ? "text-red-600" : ""}`}>
                {activeEmergencyCount}
              </div>
              <p className="text-xs text-muted-foreground">Active emergencies</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="emergencies" className="space-y-4">
          <TabsList>
            <TabsTrigger value="emergencies" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Emergencies
              {activeEmergencyCount > 0 && (
                <Badge className="bg-red-500 text-white text-xs px-1 py-0 min-w-[16px] h-4">
                  {activeEmergencyCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="patients">Assigned Patients</TabsTrigger>
            <TabsTrigger value="tasks">My Tasks</TabsTrigger>
          </TabsList>
          {locationFilterActive && vhvProfile?.district && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>Tasks filtered by {vhvProfile.district}</span>
            </div>
          )}

          <TabsContent value="emergencies" className="space-y-4">
            <EmergencyAlerts userId={currentUser?.id || "3"} userRole={UserRole.VHV} />
          </TabsContent>

          <TabsContent value="patients" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
                <div>
                  <CardTitle>Assigned Patients</CardTitle>
                  <CardDescription>Patients assigned to your care by doctors</CardDescription>
                </div>
                <div className="w-40">
                  <Select
                    value={assignedFilter}
                    onValueChange={(v) => setAssignedFilter(v as "all" | "active" | "completed")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {patientsLoading ? (
                  <div className="text-center py-4">Loading patients...</div>
                ) : patientsError ? (
                  <div className="text-center py-4 text-red-500">Error loading patients</div>
                ) : !assignedPatients || assignedPatients.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">No patients assigned</div>
                ) : filteredAssignments.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">No patients for this filter</div>
                ) : (
                  filteredAssignments.map((assignment: any) => {
                    const patient = assignment.patient
                    if (!patient) return null

                    return (
                      <Card key={assignment.id} className="border-l-4 border-l-blue-500">
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
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">
                                    {patient.firstName} {patient.lastName}
                                  </h3>
                                  <Badge variant={assignment.status === "active" ? "default" : "secondary"}>
                                    {assignment.status || "active"}
                                  </Badge>
                                  {patient.intakeSubmissions &&
                                    patient.intakeSubmissions.length > 0 &&
                                    patient.intakeSubmissions.some(
                                      (intake: any) =>
                                        intake.status === "SUBMITTED" ||
                                        intake.status === "APPROVED" ||
                                        intake.status === "REJECTED",
                                    ) && <Badge variant="default">complete</Badge>}
                                  {assignment.tasks && assignment.tasks.length > 0 && (
                                    <Badge variant="outline">
                                      {assignment.tasks.length} task{assignment.tasks.length !== 1 ? "s" : ""}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Assigned:{" "}
                                  {assignment.assignedAt
                                    ? new Date(assignment.assignedAt).toLocaleDateString()
                                    : "Unknown"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {(() => {
                                // Get the most recent intake for this patient
                                const latestIntake = patient.intakeSubmissions?.[0]
                                const hasActiveIntake =
                                  latestIntake &&
                                  (latestIntake.status === "DRAFT" || latestIntake.status === "SUBMITTED")
                                const hasCompletableIntake =
                                  latestIntake &&
                                  latestIntake.status === "DRAFT" &&
                                  latestIntake.payload &&
                                  Object.keys(latestIntake.payload).length > 0

                                if (!hasActiveIntake) {
                                  // No active intake - show Start Visit only
                                  return (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleOpenDataForm(patient)
                                      }}
                                    >
                                      <FileText className="h-4 w-4 mr-2" />
                                      Start Visit
                                    </Button>
                                  )
                                } else if (latestIntake.status === "DRAFT") {
                                  // Has draft intake - show both buttons
                                  return (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleContinueDataForm(patient, latestIntake.id)
                                        }}
                                      >
                                        <FileText className="h-4 w-4 mr-2" />
                                        Continue Visit
                                      </Button>
                                      {hasCompletableIntake && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleCompleteDataCollection(patient)
                                          }}
                                        >
                                          <Send className="h-4 w-4 mr-2" />
                                          Review & Submit
                                        </Button>
                                      )}
                                    </>
                                  )
                                } else {
                                  // Intake already submitted - show View Visit button
                                  return (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleOpenPatientReview(patient, latestIntake)
                                      }}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Visit
                                    </Button>
                                  )
                                }
                              })()}
                            </div>
                          </div>

                          {expandedPatient === patient.id && (
                            <div className="mt-4 pt-4 border-t space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                      {patient.district ? patient.district : "District not set"}
                                    </span>
                                  </div>
                                  {patient.address && (
                                    <p className="text-xs text-muted-foreground pl-6">{patient.address}</p>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{patient.phone}</span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <h5 className="font-medium text-sm">National ID</h5>
                                    <p className="text-sm text-muted-foreground">{patient.nationalId}</p>
                                  </div>
                                  <div>
                                    <h5 className="font-medium text-sm">Date of Birth</h5>
                                    <p className="text-sm text-muted-foreground">
                                      {patient.dob ? new Date(patient.dob).toLocaleDateString() : "Not specified"}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {assignment.tasks && assignment.tasks.length > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                  <h5 className="font-medium text-sm mb-2">Patient Tasks</h5>
                                  <div className="space-y-2">
                                    {assignment.tasks.map((task: any) => {
                                      const tStatus = normStatus(task.status)
                                      const tPriority = normPriority(task.priority)
                                      return (
                                        <div
                                          key={task.id}
                                          className="flex items-center justify-between p-2 bg-muted rounded"
                                        >
                                          <div>
                                            <p className="font-medium text-sm">{task.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {(task.description || "")
                                                .replace(/<FORM_SCHEMA>[\s\S]*?<\/FORM_SCHEMA>/g, "")
                                                .trim()}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Badge
                                              variant={
                                                tStatus === "completed"
                                                  ? "default"
                                                  : tStatus === "in_progress"
                                                    ? "secondary"
                                                    : tPriority === "high" || tPriority === "urgent"
                                                      ? "destructive"
                                                      : "outline"
                                              }
                                            >
                                              {tStatus}
                                            </Badge>
                                            {tStatus !== "completed" && (
                                              <>
                                                {task.description && task.description.includes("<FORM_SCHEMA>") ? (
                                                  <Button
                                                    size="sm"
                                                    variant="default"
                                                    onClick={() => handleOpenTaskForm(task)}
                                                  >
                                                    Fill Form
                                                  </Button>
                                                ) : (
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleCompleteTask(task.id)}
                                                  >
                                                    Complete
                                                  </Button>
                                                )}
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Tasks</CardTitle>
                <CardDescription>Tasks assigned to you by doctors</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="patient" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="patient">Patient Tasks</TabsTrigger>
                    <TabsTrigger value="area">Area Tasks</TabsTrigger>
                  </TabsList>

                  {/* Patient Tasks */}
                  <TabsContent value="patient" className="mt-4">
                    <Tabs defaultValue="active" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="active">Active ({activePatientList.length})</TabsTrigger>
                        <TabsTrigger value="completed">Completed ({completedPatientList.length})</TabsTrigger>
                      </TabsList>
                      <TabsContent value="active" className="space-y-4 mt-4">
                        {tasksLoading ? (
                          <div className="text-center py-4">Loading tasks...</div>
                        ) : activePatientList.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground">No active tasks</div>
                        ) : (
                          activePatientList.map((task: any) => {
                            const tStatus = normStatus(task.status)
                            const tPriority = normPriority(task.priority)
                            const assignmentForTask = visibleAssignments.find(
                              (assignment: any) =>
                                assignment.patientId === task.patientId || assignment.patient?.id === task.patientId,
                            )
                            const patient = assignmentForTask?.patient
                            const hasForm = task.description && task.description.includes("<FORM_SCHEMA>")

                            return (
                              <Card
                                key={task.id}
                                className={`border-l-4 ${
                                  tStatus === "in_progress"
                                    ? "border-l-yellow-500"
                                    : tPriority === "high" || tPriority === "urgent"
                                      ? "border-l-red-500"
                                      : "border-l-blue-500"
                                }`}
                              >
                                <CardContent className="pt-4">
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <h3 className="font-semibold">{task.title}</h3>
                                        <Badge
                                          variant={
                                            tPriority === "urgent"
                                              ? "destructive"
                                              : tPriority === "high"
                                                ? "destructive"
                                                : tPriority === "medium"
                                                  ? "secondary"
                                                  : "outline"
                                          }
                                        >
                                          {tPriority}
                                        </Badge>
                                        <Badge variant={tStatus === "in_progress" ? "secondary" : "outline"}>
                                          {tStatus}
                                        </Badge>
                                        {hasForm && (
                                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                            Has Form
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {(task.description || "")
                                          .replace(/<FORM_SCHEMA>[\s\S]*?<\/FORM_SCHEMA>/g, "")
                                          .trim()}
                                      </p>
                                      {patient && (
                                        <p className="text-sm text-muted-foreground">
                                          Patient: {patient.firstName} {patient.lastName}
                                        </p>
                                      )}
                                      {task.dueDate && (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                          <Calendar className="h-3 w-3" />
                                          Due: {new Date(task.dueDate).toLocaleDateString()}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {hasForm ? (
                                        <Button variant="default" size="sm" onClick={() => handleOpenTaskForm(task)}>
                                          <FileText className="h-4 w-4 mr-2" />
                                          Fill Form
                                        </Button>
                                      ) : (
                                        <Button variant="outline" size="sm" onClick={() => handleCompleteTask(task.id)}>
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Complete
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })
                        )}
                      </TabsContent>
                      <TabsContent value="completed" className="space-y-4 mt-4">
                        {tasksLoading ? (
                          <div className="text-center py-4">Loading tasks...</div>
                        ) : completedPatientList.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground">No completed tasks</div>
                        ) : (
                          completedPatientList.map((task: any) => {
                            const tPriority = normPriority(task.priority)
                            const assignmentForTask = visibleAssignments.find(
                              (assignment: any) =>
                                assignment.patientId === task.patientId || assignment.patient?.id === task.patientId,
                            )
                            const patient = assignmentForTask?.patient

                            return (
                              <Card key={task.id} className="border-l-4 border-l-green-500">
                                <CardContent className="pt-4">
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <h3 className="font-semibold">{task.title}</h3>
                                        <Badge variant="outline">{tPriority}</Badge>
                                        <Badge variant="default">completed</Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {(task.description || "")
                                          .replace(/<FORM_SCHEMA>[\s\S]*?<\/FORM_SCHEMA>/g, "")
                                          .trim()}
                                      </p>
                                      {patient && (
                                        <p className="text-sm text-muted-foreground">
                                          Patient: {patient.firstName} {patient.lastName}
                                        </p>
                                      )}
                                      {task.completedAt && (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                          <CheckCircle className="h-3 w-3" />
                                          Completed: {new Date(task.completedAt).toLocaleDateString()}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {undoableActions[task.id] && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleUndoCompleteTask(task.id)}
                                          className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                                        >
                                          Undo
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })
                        )}
                      </TabsContent>
                    </Tabs>
                  </TabsContent>

                  {/* Area Tasks */}
                  <TabsContent value="area" className="mt-4">
                    <Tabs defaultValue="active" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="active">Active ({activeAreaList.length})</TabsTrigger>
                        <TabsTrigger value="completed">Completed ({completedAreaList.length})</TabsTrigger>
                      </TabsList>
                      <TabsContent value="active" className="space-y-4 mt-4">
                        {tasksLoading ? (
                          <div className="text-center py-4">Loading tasks...</div>
                        ) : activeAreaList.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground">No active tasks</div>
                        ) : (
                          activeAreaList.map((task: any) => {
                            const tStatus = normStatus(task.status)
                            const tPriority = normPriority(task.priority)
                            const hasForm = task.description && task.description.includes("<FORM_SCHEMA>")

                            return (
                              <Card
                                key={task.id}
                                className={`border-l-4 ${
                                  tStatus === "in_progress"
                                    ? "border-l-yellow-500"
                                    : tPriority === "high" || tPriority === "urgent"
                                      ? "border-l-red-500"
                                      : "border-l-blue-500"
                                }`}
                              >
                                <CardContent className="pt-4">
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <h3 className="font-semibold">{task.title}</h3>
                                        <Badge
                                          variant={
                                            tPriority === "urgent"
                                              ? "destructive"
                                              : tPriority === "high"
                                                ? "destructive"
                                                : tPriority === "medium"
                                                  ? "secondary"
                                                  : "outline"
                                          }
                                        >
                                          {tPriority}
                                        </Badge>
                                        <Badge variant={tStatus === "in_progress" ? "secondary" : "outline"}>
                                          {tStatus}
                                        </Badge>
                                        {hasForm && (
                                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                            Has Form
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {(task.description || "")
                                          .replace(/<FORM_SCHEMA>[\s\S]*?<\/FORM_SCHEMA>/g, "")
                                          .trim()}
                                      </p>
                                      {task.dueDate && (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                          <Calendar className="h-3 w-3" />
                                          Due: {new Date(task.dueDate).toLocaleDateString()}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {hasForm ? (
                                        <Button variant="default" size="sm" onClick={() => handleOpenTaskForm(task)}>
                                          <FileText className="h-4 w-4 mr-2" />
                                          Fill Form
                                        </Button>
                                      ) : (
                                        <Button variant="outline" size="sm" onClick={() => handleCompleteTask(task.id)}>
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Complete
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })
                        )}
                      </TabsContent>
                      <TabsContent value="completed" className="space-y-4 mt-4">
                        {tasksLoading ? (
                          <div className="text-center py-4">Loading tasks...</div>
                        ) : completedAreaList.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground">No completed tasks</div>
                        ) : (
                          completedAreaList.map((task: any) => (
                            <Card key={task.id} className="border-l-4 border-l-green-500">
                              <CardContent className="pt-4">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-semibold">{task.title}</h3>
                                      <Badge variant="outline">{normPriority(task.priority)}</Badge>
                                      <Badge variant="default">completed</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {(task.description || "")
                                        .replace(/<FORM_SCHEMA>[\s\S]*?<\/FORM_SCHEMA>/g, "")
                                        .trim()}
                                    </p>
                                    {task.completedAt && (
                                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <CheckCircle className="h-3 w-3" />
                                        Completed: {new Date(task.completedAt).toLocaleDateString()}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {undoableActions[task.id] && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleUndoCompleteTask(task.id)}
                                        className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                                      >
                                        Undo
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </TabsContent>
                    </Tabs>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
