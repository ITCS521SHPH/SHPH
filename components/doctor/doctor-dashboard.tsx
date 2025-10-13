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
  User,
  ChevronDown,
  ChevronRight,
  UserPlus,
} from "lucide-react"
import { clearCurrentUser } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useState } from "react"

const initialPatients = [
  {
    id: 1,
    name: "Sarah Johnson",
    age: 34,
    gender: "Female",
    address: "123 Main St, Village A",
    phone: "+1-555-0123",
    condition: "Hypertension, Diabetes",
    lastVisit: "2024-01-15",
    status: "active",
    assignedVHV: "Maria Santos",
    assignedVHVId: 1,
    doctorId: 1, // Dr. Michael Chen
  },
  {
    id: 2,
    name: "John Smith",
    age: 45,
    gender: "Male",
    address: "456 Oak Ave, Village B",
    phone: "+1-555-0456",
    condition: "Chronic back pain",
    lastVisit: "2024-01-14",
    status: "active",
    assignedVHV: "Carlos Rodriguez",
    assignedVHVId: 2,
    doctorId: 1,
  },
  {
    id: 3,
    name: "Emma Davis",
    age: 28,
    gender: "Female",
    address: "789 Pine Rd, Village A",
    phone: "+1-555-0789",
    condition: "Asthma",
    lastVisit: "2024-01-13",
    status: "active",
    assignedVHV: "Ana Lopez",
    assignedVHVId: 3,
    doctorId: 1,
  },
]

const availableVHVs = [
  {
    id: 1,
    name: "Maria Santos",
    area: "Village A",
    activePatients: 8,
    phone: "+1-555-1001",
    status: "active",
  },
  {
    id: 2,
    name: "Carlos Rodriguez",
    area: "Village B",
    activePatients: 6,
    phone: "+1-555-1002",
    status: "active",
  },
  {
    id: 3,
    name: "Ana Lopez",
    area: "Village A",
    activePatients: 5,
    phone: "+1-555-1003",
    status: "active",
  },
]

const initialPendingValidations = [
  {
    id: 1,
    patientName: "Sarah Johnson",
    patientId: 1,
    vhvName: "Maria Santos",
    visitDate: "2024-01-15",
    symptoms: ["Fever", "Cough", "Fatigue"],
    vitals: { temperature: "38.5°C", bp: "120/80", pulse: "88" },
    status: "pending",
  },
  {
    id: 2,
    patientName: "John Smith",
    patientId: 2,
    vhvName: "Carlos Rodriguez",
    visitDate: "2024-01-14",
    symptoms: ["Headache", "Nausea"],
    vitals: { temperature: "37.2°C", bp: "130/85", pulse: "92" },
    status: "pending",
  },
]

const initialValidatedPatients = [
  {
    id: 3,
    patientName: "Emma Davis",
    patientId: 3,
    vhvName: "Ana Lopez",
    visitDate: "2024-01-13",
    diagnosis: "Common Cold",
    treatment: "Rest, fluids, paracetamol",
    status: "validated",
  },
]

export function DoctorDashboard() {
  const router = useRouter()
  const [expandedPatient, setExpandedPatient] = useState<number | null>(null)
  const [validatedPatients, setValidatedPatients] = useState(initialValidatedPatients)
  const [pendingPatients, setPendingPatients] = useState(initialPendingValidations)
  const [allPatients, setAllPatients] = useState(initialPatients)
  const [showAddPatientDialog, setShowAddPatientDialog] = useState(false)
  const [showVHVAssignDialog, setShowVHVAssignDialog] = useState(false)
  const [showNewVisitDialog, setShowNewVisitDialog] = useState(false)
  const [selectedPatientForVHV, setSelectedPatientForVHV] = useState<number | null>(null)
  const [expandedVHV, setExpandedVHV] = useState<number | null>(null)
  const [showAddVHVDialog, setShowAddVHVDialog] = useState(false)
  const [newVHVForm, setNewVHVForm] = useState({
    name: "",
    area: "",
    phone: "",
  })

  const [newPatientForm, setNewPatientForm] = useState({
    name: "",
    age: "",
    gender: "",
    address: "",
    phone: "",
    condition: "",
  })

  const [vhvAssignForm, setVhvAssignForm] = useState({
    vhvId: "",
    taskDescription: "",
  })

  const handleValidateData = (patientId: number, action: "approve" | "request_more") => {
    console.log("[v0] Validating patient data:", { patientId, action })

    if (action === "approve") {
      const patientToValidate = pendingPatients.find((p) => p.id === patientId)
      if (patientToValidate) {
        const validatedPatient = {
          ...patientToValidate,
          status: "validated" as const,
          diagnosis: "Pending diagnosis input",
          treatment: "Treatment plan to be determined",
        }

        // Update state immutably to prevent reverting
        setValidatedPatients((prev) => {
          const newValidated = [...prev, validatedPatient]
          console.log("[v0] Updated validated patients:", newValidated)
          return newValidated
        })

        setPendingPatients((prev) => {
          const newPending = prev.filter((p) => p.id !== patientId)
          console.log("[v0] Updated pending patients:", newPending)
          return newPending
        })
      }
    }
  }

  const handleAddPatient = () => {
    if (newPatientForm.name && newPatientForm.age && newPatientForm.gender) {
      const newPatient = {
        id: Math.max(...allPatients.map((p) => p.id)) + 1,
        name: newPatientForm.name,
        age: Number.parseInt(newPatientForm.age),
        gender: newPatientForm.gender,
        address: newPatientForm.address,
        phone: newPatientForm.phone,
        condition: newPatientForm.condition,
        lastVisit: new Date().toISOString().split("T")[0],
        status: "active" as const,
        assignedVHV: "Unassigned",
        assignedVHVId: 0,
        doctorId: 1, // Current doctor
      }

      setAllPatients((prev) => [...prev, newPatient])
      setNewPatientForm({
        name: "",
        age: "",
        gender: "",
        address: "",
        phone: "",
        condition: "",
      })
      setShowAddPatientDialog(false)
      console.log("[v0] Added new patient:", newPatient)
    }
  }

  const handleAssignVHV = () => {
    if (selectedPatientForVHV && vhvAssignForm.vhvId) {
      const selectedVHV = availableVHVs.find((vhv) => vhv.id === Number.parseInt(vhvAssignForm.vhvId))
      if (selectedVHV) {
        setAllPatients((prev) =>
          prev.map((patient) =>
            patient.id === selectedPatientForVHV
              ? {
                  ...patient,
                  assignedVHV: selectedVHV.name,
                  assignedVHVId: selectedVHV.id,
                }
              : patient,
          ),
        )

        setVhvAssignForm({ vhvId: "", taskDescription: "" })
        setSelectedPatientForVHV(null)
        setShowVHVAssignDialog(false)
        console.log("[v0] Assigned VHV:", selectedVHV.name, "to patient:", selectedPatientForVHV)
      }
    }
  }

  const handleAddVHV = () => {
    if (newVHVForm.name && newVHVForm.area && newVHVForm.phone) {
      const newVHV = {
        id: Math.max(...availableVHVs.map((v) => v.id)) + 1,
        name: newVHVForm.name,
        area: newVHVForm.area,
        activePatients: 0,
        phone: newVHVForm.phone,
        status: "active" as const,
      }

      // Add to available VHVs list
      availableVHVs.push(newVHV)

      setNewVHVForm({ name: "", area: "", phone: "" })
      setShowAddVHVDialog(false)
      console.log("[v0] Added new VHV:", newVHV)
    }
  }

  const handleSignOut = () => {
    clearCurrentUser()
    router.push("/")
  }

  const togglePatientExpansion = (patientId: number) => {
    setExpandedPatient(expandedPatient === patientId ? null : patientId)
  }

  const toggleVHVExpansion = (vhvId: number) => {
    setExpandedVHV(expandedVHV === vhvId ? null : vhvId)
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
                <p className="text-muted-foreground">Dr. Michael Chen</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
                          {allPatients.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id.toString()}>
                              {patient.name} - {patient.address}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="vhv-select" className="text-right">
                        Assign VHV
                      </Label>
                      <Select>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select VHV" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableVHVs.map((vhv) => (
                            <SelectItem key={vhv.id} value={vhv.id.toString()}>
                              {vhv.name} - {vhv.area}
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
              <div className="text-2xl font-bold">{pendingPatients.length}</div>
              <p className="text-xs text-muted-foreground">Require your review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Validated Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{validatedPatients.length}</div>
              <p className="text-xs text-muted-foreground">Cases reviewed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allPatients.length}</div>
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
            <TabsTrigger value="patients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Patient List
            </TabsTrigger>
            <TabsTrigger value="vhvs" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              VHV Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Requiring Validation</CardTitle>
                <CardDescription>Review patient data collected by VHVs and provide diagnostic guidance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingPatients.map((validation) => (
                  <Card key={validation.id} className="border-l-4 border-l-orange-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{validation.patientName}</CardTitle>
                          <CardDescription>
                            Collected by {validation.vhvName} on {validation.visitDate}
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
                            Reported Symptoms
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {validation.symptoms.map((symptom) => (
                              <Badge key={symptom} variant="outline">
                                {symptom}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Vital Signs
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p>Temperature: {validation.vitals.temperature}</p>
                            <p>Blood Pressure: {validation.vitals.bp}</p>
                            <p>Pulse: {validation.vitals.pulse} bpm</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button onClick={() => handleValidateData(validation.id, "approve")} className="flex-1">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Validate & Diagnose
                        </Button>
                        <Button variant="outline" onClick={() => handleValidateData(validation.id, "request_more")}>
                          Request More Data
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
                {validatedPatients.map((validation) => (
                  <Card key={validation.id} className="border-l-4 border-l-green-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{validation.patientName}</CardTitle>
                          <CardDescription>
                            Validated on {validation.visitDate} • Collected by {validation.vhvName}
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
                          <h4 className="font-medium mb-2">Diagnosis</h4>
                          <p className="text-sm text-muted-foreground">{validation.diagnosis}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Treatment Plan</h4>
                          <p className="text-sm text-muted-foreground">{validation.treatment}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
                {allPatients.map((patient) => (
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
                              {patient.age} years old • {patient.gender}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Active</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedPatientForVHV(patient.id)
                              setShowVHVAssignDialog(true)
                            }}
                          >
                            {patient.assignedVHV === "Unassigned" ? "Assign VHV" : "Change VHV"}
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
                              <div>
                                <h5 className="font-medium text-sm">Assigned VHV</h5>
                                <p className="text-sm text-muted-foreground">{patient.assignedVHV}</p>
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

          <TabsContent value="vhvs" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>VHV Management</CardTitle>
                    <CardDescription>Manage Village Health Volunteers and assign patients</CardDescription>
                  </div>
                  <Dialog open={showAddVHVDialog} onOpenChange={setShowAddVHVDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add VHV
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add New VHV</DialogTitle>
                        <DialogDescription>Register a new Village Health Volunteer to your network.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="vhv-name" className="text-right">
                            Name
                          </Label>
                          <Input
                            id="vhv-name"
                            className="col-span-3"
                            value={newVHVForm.name}
                            onChange={(e) => setNewVHVForm((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter VHV name"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="vhv-area" className="text-right">
                            Area
                          </Label>
                          <Input
                            id="vhv-area"
                            className="col-span-3"
                            value={newVHVForm.area}
                            onChange={(e) => setNewVHVForm((prev) => ({ ...prev, area: e.target.value }))}
                            placeholder="e.g., Village C"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="vhv-phone" className="text-right">
                            Phone
                          </Label>
                          <Input
                            id="vhv-phone"
                            className="col-span-3"
                            value={newVHVForm.phone}
                            onChange={(e) => setNewVHVForm((prev) => ({ ...prev, phone: e.target.value }))}
                            placeholder="+1-555-0000"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowAddVHVDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddVHV}>Add VHV</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {availableVHVs.map((vhv) => (
                  <Card key={vhv.id} className="border-l-4 border-l-purple-500">
                    <CardContent className="pt-4">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleVHVExpansion(vhv.id)}
                      >
                        <div className="flex items-center gap-3">
                          {expandedVHV === vhv.id ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <div>
                            <h4 className="font-medium">{vhv.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {vhv.area} • {vhv.activePatients} active patients
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={vhv.status === "active" ? "default" : "secondary"}>{vhv.status}</Badge>
                        </div>
                      </div>

                      {expandedVHV === vhv.id && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{vhv.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Coverage Area: {vhv.area}</span>
                              </div>
                            </div>
                            <div>
                              <h5 className="font-medium text-sm mb-1">Performance</h5>
                              <p className="text-sm text-muted-foreground">{vhv.activePatients} active patients</p>
                              <p className="text-sm text-muted-foreground">Status: {vhv.status}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                // Find a patient to assign or show assignment dialog
                                const unassignedPatient = allPatients.find((p) => p.assignedVHV === "Unassigned")
                                if (unassignedPatient) {
                                  setSelectedPatientForVHV(unassignedPatient.id)
                                  setVhvAssignForm((prev) => ({ ...prev, vhvId: vhv.id.toString() }))
                                  setShowVHVAssignDialog(true)
                                }
                              }}
                            >
                              Assign Patient
                            </Button>
                            <Button variant="outline" size="sm">
                              View Performance
                            </Button>
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

        <Dialog open={showVHVAssignDialog} onOpenChange={setShowVHVAssignDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Assign VHV to Patient</DialogTitle>
              <DialogDescription>Select a Village Health Volunteer to assign to this patient.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Select VHV</Label>
                <Select
                  value={vhvAssignForm.vhvId}
                  onValueChange={(value) => setVhvAssignForm((prev) => ({ ...prev, vhvId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a VHV" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVHVs.map((vhv) => (
                      <SelectItem key={vhv.id} value={vhv.id.toString()}>
                        {vhv.name} - {vhv.area} ({vhv.activePatients} patients)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-description">Task Description</Label>
                <Textarea
                  id="task-description"
                  placeholder="Describe the specific tasks or monitoring required..."
                  value={vhvAssignForm.taskDescription}
                  onChange={(e) => setVhvAssignForm((prev) => ({ ...prev, taskDescription: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowVHVAssignDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignVHV}>Assign VHV</Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
