"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PatientReview } from "./patient-review"
import { StructuredDataForm } from "./structured-data-form"
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
import { Plus } from "lucide-react"
import {
  Users,
  CheckCircle,
  Clock,
  FileText,
  MapPin,
  ChevronDown,
  ChevronRight,
  Phone,
  Activity,
  Send,
} from "lucide-react"
import { useState, useCallback } from "react"
import { clearCurrentUser } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { patientsApi } from "@/lib/api"
import { useApiData } from "@/lib/useApiData"

export function VHVDashboard() {
  const router = useRouter()
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null)
  const [selectedPatientForReview, setSelectedPatientForReview] = useState<any>(null)
  const [showReviewPage, setShowReviewPage] = useState(false)
  const [showDataForm, setShowDataForm] = useState(false)
  const [selectedPatientForForm, setSelectedPatientForForm] = useState<any>(null)
  const [showAddPatientDialog, setShowAddPatientDialog] = useState(false)
  const [completedSections, setCompletedSections] = useState<string[]>([])
  const [newPatientForm, setNewPatientForm] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    address: "",
    phone: "",
    nationalId: "",
  })

  // API data hooks for real-time data
  const getAssignedPatients = useCallback(() => patientsApi.getAll(), [])
  
  const { data: allPatients, loading: patientsLoading, error: patientsError, refetch: refetchPatients } = useApiData(
    getAssignedPatients,
    []
  )

  // Filter patients assigned to current VHV (for now showing all patients)
  const assignedPatients = allPatients || []

  // Add new patient functionality
  const handleAddPatient = useCallback(async () => {
    if (newPatientForm.firstName && newPatientForm.lastName && newPatientForm.dob) {
      try {
        await patientsApi.create({
          firstName: newPatientForm.firstName,
          lastName: newPatientForm.lastName,
          dob: newPatientForm.dob,
          address: newPatientForm.address,
          phone: newPatientForm.phone,
          nationalId: newPatientForm.nationalId,
        });

        setNewPatientForm({
          firstName: "",
          lastName: "",
          dob: "",
          address: "",
          phone: "",
          nationalId: "",
        });
        setShowAddPatientDialog(false);
        refetchPatients();
      } catch (error) {
        console.error('Error adding patient:', error);
      }
    }
  }, [newPatientForm, refetchPatients]);

  const handleSignOut = () => {
    clearCurrentUser()
    router.push("/")
  }

  const togglePatientExpansion = (patientId: string) => {
    setExpandedPatient(expandedPatient === patientId ? null : patientId)
  }

  const handleOpenDataForm = (patient: any) => {
    setSelectedPatientForForm(patient)
    setShowDataForm(true)
  }

  const handleCloseDataForm = () => {
    setShowDataForm(false)
    setSelectedPatientForForm(null)
  }

  const handleCompleteDataCollection = (patient: any) => {
    setSelectedPatientForReview(patient)
    setShowReviewPage(true)
  }

  const handleBackFromReview = () => {
    setShowReviewPage(false)
    setSelectedPatientForReview(null)
  }

  const handleConfirmSubmission = () => {
    setShowReviewPage(false)
    setSelectedPatientForReview(null)
    refetchPatients(); // Refresh data after submission
  }

  // Calculate statistics from real data
  const activePatients = assignedPatients.filter((p: any) => p.status === "active" || !p.status)
  const completedVisits = assignedPatients.filter((p: any) => p.lastVisit).length
  const pendingReviews = assignedPatients.filter((p: any) => p.status === "pending_review").length

  if (showReviewPage && selectedPatientForReview) {
    return (
      <PatientReview
        patient={selectedPatientForReview}
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
                  <h1 className="text-xl font-bold">Data Collection - {selectedPatientForForm.firstName} {selectedPatientForForm.lastName}</h1>
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
              hospitalNumber: selectedPatientForForm.nationalId
            }}
            onSectionComplete={(section) => {
              if (!completedSections.includes(section)) {
                setCompletedSections([...completedSections, section])
              }
            }}
            onFormComplete={() => {
              handleCloseDataForm();
              refetchPatients();
            }}
            completedSections={completedSections}
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
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activePatients.length}</div>
              <p className="text-xs text-muted-foreground">Patients requiring visits</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Visits</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedVisits}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingReviews}</div>
              <p className="text-xs text-muted-foreground">Awaiting doctor review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assignedPatients.length > 0 
                  ? Math.round(completedVisits / assignedPatients.length * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Completion rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Patients List */}
        <Card>
          <CardHeader>
            <CardTitle>Assigned Patients</CardTitle>
            <CardDescription>Patients assigned to your care</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {patientsLoading ? (
              <div className="text-center py-4">Loading patients...</div>
            ) : patientsError ? (
              <div className="text-center py-4 text-red-500">Error loading patients</div>
            ) : assignedPatients.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No patients assigned</div>
            ) : (
              assignedPatients.map((patient: any) => (
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
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{patient.firstName} {patient.lastName}</h3>
                            <Badge variant={patient.status === "active" ? "default" : "secondary"}>
                              {patient.status || "active"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Last visit: {patient.lastVisit || "Never"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
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
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
