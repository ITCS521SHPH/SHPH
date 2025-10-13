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
import { useState } from "react"
import { clearCurrentUser } from "@/lib/auth"
import { useRouter } from "next/navigation"

const initialAssignedPatients = [
  {
    id: 1,
    name: "Sarah Johnson",
    age: 34,
    address: "123 Main St, Village A",
    phone: "+1-555-0123",
    condition: "Hypertension, Diabetes",
    lastVisit: "2024-01-15",
    status: "active",
    doctorId: 1, // Dr. Michael Chen
    doctorName: "Dr. Michael Chen",
    completedSections: ["patientInfo", "vitalSigns"],
    overallProgress: 40,
  },
  {
    id: 2,
    name: "John Smith",
    age: 45,
    address: "456 Oak Ave, Village B",
    phone: "+1-555-0456",
    condition: "Chronic back pain",
    lastVisit: "2024-01-14",
    status: "pending_review",
    doctorId: 1,
    doctorName: "Dr. Michael Chen",
    completedSections: ["patientInfo", "vitalSigns", "physicalFunction", "mentalCognitive", "vhvNotes"],
    overallProgress: 100,
  },
  {
    id: 3,
    name: "Emma Davis",
    age: 28,
    address: "789 Pine Rd, Village A",
    phone: "+1-555-0789",
    condition: "Asthma",
    lastVisit: "2024-01-13",
    status: "active",
    doctorId: 1,
    doctorName: "Dr. Michael Chen",
    completedSections: ["patientInfo"],
    overallProgress: 20,
  },
]

export function VHVDashboard() {
  const [expandedPatient, setExpandedPatient] = useState<number | null>(null)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [selectedPatientForReview, setSelectedPatientForReview] = useState<any>(null)
  const [showReviewPage, setShowReviewPage] = useState(false)
  const [showDataForm, setShowDataForm] = useState(false)
  const [selectedPatientForForm, setSelectedPatientForForm] = useState<any>(null)
  const [showAddPatientDialog, setShowAddPatientDialog] = useState(false)
  const [newPatientForm, setNewPatientForm] = useState({
    name: "",
    age: "",
    gender: "",
    address: "",
    phone: "",
    condition: "",
  })

  const [sharedPatients, setSharedPatients] = useState([
    // Patients added by doctors will appear here
    ...initialAssignedPatients,
  ])

  const addPatientFromDoctor = (newPatient: any) => {
    setSharedPatients((prev) => [
      ...prev,
      {
        ...newPatient,
        status: "active",
        completedSections: [],
        overallProgress: 0,
      },
    ])
  }

  const [patients, setPatients] = useState(sharedPatients)
  const router = useRouter()

  const handleSignOut = () => {
    clearCurrentUser()
    router.push("/")
  }

  const togglePatientExpansion = (patientId: number) => {
    setExpandedPatient(expandedPatient === patientId ? null : patientId)
  }

  const handleSectionComplete = (patientId: number, section: string) => {
    console.log("[v0] Attempting to complete section:", section, "for patient:", patientId)
    setPatients((prev) =>
      prev.map((patient) => {
        if (patient.id === patientId) {
          const updatedSections = patient.completedSections.includes(section)
            ? patient.completedSections
            : [...patient.completedSections, section]
          const newProgress = Math.round((updatedSections.length / 5) * 100) // 5 total sections

          console.log("[v0] Updated sections:", updatedSections, "Progress:", newProgress)
          return {
            ...patient,
            completedSections: updatedSections,
            overallProgress: newProgress,
          }
        }
        return patient
      }),
    )
  }

  const handleAddPatient = () => {
    if (newPatientForm.name && newPatientForm.age && newPatientForm.gender) {
      const newPatient = {
        id: Math.max(...patients.map((p) => p.id), 0) + 1,
        name: newPatientForm.name,
        age: Number.parseInt(newPatientForm.age),
        address: newPatientForm.address,
        phone: newPatientForm.phone,
        condition: newPatientForm.condition,
        lastVisit: new Date().toISOString().split("T")[0],
        status: "active" as const,
        doctorId: 1, // Default doctor
        doctorName: "Dr. Michael Chen", // Default doctor
        completedSections: [],
        overallProgress: 0,
      }

      setPatients((prev) => [...prev, newPatient])
      setNewPatientForm({
        name: "",
        age: "",
        gender: "",
        address: "",
        phone: "",
        condition: "",
      })
      setShowAddPatientDialog(false)
      console.log("[v0] VHV added new patient:", newPatient)
    }
  }

  const handleCompleteDataCollection = (patient: any) => {
    setSelectedPatientForReview(patient)
    setShowReviewPage(true)
  }

  const handleConfirmSubmission = () => {
    if (selectedPatientForReview) {
      setPatients((prev) =>
        prev.map((patient) =>
          patient.id === selectedPatientForReview.id ? { ...patient, status: "submitted" } : patient,
        ),
      )
      setShowReviewPage(false)
      setSelectedPatientForReview(null)
    }
  }

  const handleBackFromReview = () => {
    setShowReviewPage(false)
    setSelectedPatientForReview(null)
  }

  const handleOpenDataForm = (patient: any) => {
    setSelectedPatientForForm(patient)
    setShowDataForm(true)
  }

  const handleCloseDataForm = () => {
    setShowDataForm(false)
    setSelectedPatientForForm(null)
  }

  const handleFormComplete = () => {
    if (selectedPatientForForm) {
      setPatients((prev) =>
        prev.map((patient) =>
          patient.id === selectedPatientForForm.id
            ? { ...patient, status: "pending_review", overallProgress: 100 }
            : patient,
        ),
      )
      setShowDataForm(false)
      setSelectedPatientForForm(null)
    }
  }

  const activePatients = patients.filter((p) => p.status === "active")
  const pendingReviewPatients = patients.filter((p) => p.status === "pending_review")
  const submittedPatients = patients.filter((p) => p.status === "submitted")

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
                  <h1 className="text-xl font-bold">Data Collection - {selectedPatientForForm.name}</h1>
                  <p className="text-muted-foreground">Complete the structured data collection form</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <StructuredDataForm
            patient={selectedPatientForForm}
            onSectionComplete={(section) => handleSectionComplete(selectedPatientForForm.id, section)}
            onFormComplete={handleFormComplete}
            completedSections={selectedPatientForForm.completedSections}
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
              <Users className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">VHV Dashboard</h1>
                <p className="text-muted-foreground">Maria Santos - Village Health Volunteer</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activePatients.length}</div>
              <p className="text-xs text-muted-foreground">Assigned to you</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingReviewPatients.length}</div>
              <p className="text-xs text-muted-foreground">Ready for review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submitted</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submittedPatients.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting validation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Completeness</CardTitle>
              <FileText className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {patients.length > 0
                  ? Math.min(100, Math.round(patients.reduce((acc, p) => acc + p.overallProgress, 0) / patients.length))
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">Data collection</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Active Patients ({activePatients.length})
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Review ({pendingReviewPatients.length})
            </TabsTrigger>
            <TabsTrigger value="submitted" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Submitted ({submittedPatients.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Active Patients</CardTitle>
                    <CardDescription>Patients assigned by doctors for data collection</CardDescription>
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
                        <DialogDescription>Add a new patient to your care list for data collection.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">
                            Name
                          </Label>
                          <Input
                            id="name"
                            className="col-span-3"
                            value={newPatientForm.name}
                            onChange={(e) => setNewPatientForm((prev) => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="age" className="text-right">
                            Age
                          </Label>
                          <Input
                            id="age"
                            type="number"
                            className="col-span-3"
                            value={newPatientForm.age}
                            onChange={(e) => setNewPatientForm((prev) => ({ ...prev, age: e.target.value }))}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="gender" className="text-right">
                            Gender
                          </Label>
                          <Select
                            value={newPatientForm.gender}
                            onValueChange={(value) => setNewPatientForm((prev) => ({ ...prev, gender: value }))}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
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
                          <Label htmlFor="condition" className="text-right">
                            Condition
                          </Label>
                          <Textarea
                            id="condition"
                            className="col-span-3"
                            value={newPatientForm.condition}
                            onChange={(e) => setNewPatientForm((prev) => ({ ...prev, condition: e.target.value }))}
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
                {activePatients.map((patient) => (
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
                            <h4 className="font-medium">{patient.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Assigned by {patient.doctorName} • {patient.age} years old
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Progress value={patient.overallProgress} className="w-20" />
                            <span className="text-sm text-muted-foreground">{patient.overallProgress}%</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenDataForm(patient)
                            }}
                          >
                            Collect Data
                          </Button>
                        </div>
                      </div>

                      {expandedPatient === patient.id && (
                        <div className="mt-4 pt-4 border-t space-y-4">
                          {/* Patient Basic Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                            <div>
                              <h5 className="font-medium text-sm mb-1">Medical Condition</h5>
                              <p className="text-sm text-muted-foreground">{patient.condition}</p>
                            </div>
                          </div>

                          {/* Data Collection Progress */}
                          <div className="space-y-4">
                            <h4 className="font-medium flex items-center gap-2">
                              <Activity className="h-4 w-4" />
                              Data Collection Progress
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {[
                                { id: "patientInfo", name: "Patient Information" },
                                { id: "vitalSigns", name: "Vital Signs" },
                                { id: "physicalFunction", name: "Physical Function" },
                                { id: "mentalCognitive", name: "Mental & Cognitive" },
                                { id: "vhvNotes", name: "VHV Notes" },
                              ].map((section) => (
                                <Card
                                  key={section.id}
                                  className={`${
                                    patient.completedSections.includes(section.id)
                                      ? "border-green-200 bg-green-50"
                                      : "border-orange-200 bg-orange-50"
                                  }`}
                                >
                                  <CardContent className="pt-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <h5 className="font-medium text-sm">{section.name}</h5>
                                      {patient.completedSections.includes(section.id) ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                      ) : (
                                        <Clock className="h-4 w-4 text-orange-500" />
                                      )}
                                    </div>
                                    <Badge
                                      variant={patient.completedSections.includes(section.id) ? "default" : "secondary"}
                                      className={
                                        patient.completedSections.includes(section.id)
                                          ? "bg-green-500"
                                          : "bg-orange-500"
                                      }
                                    >
                                      {patient.completedSections.includes(section.id) ? "Complete" : "Pending"}
                                    </Badge>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-4">
                              {patient.overallProgress === 100 ? (
                                <Button onClick={() => handleCompleteDataCollection(patient)} className="flex-1">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Complete & Review
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  onClick={() => handleOpenDataForm(patient)}
                                  className="flex-1"
                                >
                                  Continue Data Collection ({patient.overallProgress}% complete)
                                </Button>
                              )}
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

          <TabsContent value="review" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Review</CardTitle>
                <CardDescription>Patients with completed data collection ready for final review</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingReviewPatients.map((patient) => (
                  <Card key={patient.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{patient.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Data collection complete • Assigned by {patient.doctorName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="bg-orange-500">
                            Ready for Review
                          </Badge>
                          <Button onClick={() => handleCompleteDataCollection(patient)}>Review & Submit</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submitted" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Submitted Patients</CardTitle>
                <CardDescription>Patients whose data has been submitted to doctors for validation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {submittedPatients.map((patient) => (
                  <Card key={patient.id} className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{patient.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Submitted to {patient.doctorName} • Awaiting validation
                          </p>
                        </div>
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Submitted
                        </Badge>
                      </div>
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
