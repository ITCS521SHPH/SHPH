"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Heart, Users, Phone, AlertTriangle, CheckCircle, Clock, MapPin, Calendar, User } from "lucide-react"
import { clearCurrentUser } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useState } from "react"

const patientsUnderCare = [
  {
    id: 1,
    name: "Robert Johnson",
    age: 78,
    gender: "Male",
    address: "456 Elder St, Village A",
    phone: "+1-555-0789",
    condition: "Diabetes, Hypertension",
    lastVisit: "2024-01-14",
    nextMedication: "2024-01-16 8:00 AM",
    status: "stable",
    urgency: "low",
    medications: ["Metformin 500mg", "Lisinopril 10mg"],
    notes: "Patient is compliant with medication schedule. Blood sugar levels stable.",
  },
  {
    id: 2,
    name: "Mary Davis",
    age: 65,
    gender: "Female",
    address: "789 Care Ave, Village B",
    phone: "+1-555-0456",
    condition: "Heart Disease",
    lastVisit: "2024-01-15",
    nextMedication: "2024-01-16 12:00 PM",
    status: "needs-attention",
    urgency: "medium",
    medications: ["Atorvastatin 20mg", "Metoprolol 25mg"],
    notes: "Blood pressure readings have been elevated. Requires closer monitoring.",
  },
]

const todayTasks = [
  {
    id: 1,
    patient: "Robert Johnson",
    patientId: 1,
    task: "Medication reminder - Metformin",
    time: "8:00 AM",
    status: "completed",
  },
  {
    id: 2,
    patient: "Mary Davis",
    patientId: 2,
    task: "Blood pressure check",
    time: "10:00 AM",
    status: "pending",
  },
  {
    id: 3,
    patient: "Robert Johnson",
    patientId: 1,
    task: "Insulin injection",
    time: "6:00 PM",
    status: "upcoming",
  },
]

const emergencyContacts = [
  { name: "Dr. Michael Chen", role: "Primary Doctor", phone: "+1-555-0123" },
  { name: "Village Health Center", role: "Emergency", phone: "+1-555-0911" },
  { name: "Maria Santos", role: "VHV Coordinator", phone: "+1-555-0456" },
]

export function CaregiverDashboard() {
  const router = useRouter()
  const [tasks, setTasks] = useState(todayTasks)
  const [patients, setPatients] = useState(patientsUnderCare)
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [showPatientDetails, setShowPatientDetails] = useState(false)

  const handleTaskComplete = (taskId: number) => {
    console.log("[v0] Completing task:", taskId)
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status: "completed" } : task)))
  }

  const handleViewDetails = (patientId: number) => {
    console.log("[v0] Viewing patient details:", patientId)
    const patient = patients.find((p) => p.id === patientId)
    if (patient) {
      setSelectedPatient(patient)
      setShowPatientDetails(true)
    }
  }

  const handleUpdateStatus = (patientId: number) => {
    console.log("[v0] Updating patient status:", patientId)
    setPatients((prev) =>
      prev.map((patient) =>
        patient.id === patientId
          ? {
              ...patient,
              status: patient.status === "stable" ? "needs-attention" : "stable",
              urgency: patient.urgency === "low" ? "medium" : "low",
            }
          : patient,
      ),
    )
  }

  const handleEmergencyCall = (phone: string) => {
    console.log("[v0] Emergency call to:", phone)
    window.open(`tel:${phone}`)
  }

  const handleSignOut = () => {
    clearCurrentUser()
    router.push("/")
  }

  const completedTasks = tasks.filter((t) => t.status === "completed").length
  const pendingTasks = tasks.filter((t) => t.status === "pending").length
  const urgentPatients = patients.filter((p) => p.urgency === "medium").length

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Caregiver Dashboard</h1>
                <p className="text-muted-foreground">Jennifer Martinez</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patients Under Care</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patients.length}</div>
              <p className="text-xs text-muted-foreground">Active patients</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length}</div>
              <p className="text-xs text-muted-foreground">
                {completedTasks} completed, {pendingTasks} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{urgentPatients}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Medication</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">6:00 PM</div>
              <p className="text-xs text-muted-foreground">Robert's insulin</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patients and Tasks */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="patients" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="patients" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  My Patients
                </TabsTrigger>
                <TabsTrigger value="tasks" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Today's Tasks
                </TabsTrigger>
              </TabsList>

              <TabsContent value="patients" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Patients Under Your Care</CardTitle>
                    <CardDescription>Monitor and manage your assigned patients</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {patients.map((patient) => (
                      <Card
                        key={patient.id}
                        className={`border-l-4 ${
                          patient.urgency === "medium" ? "border-l-orange-500" : "border-l-green-500"
                        }`}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{patient.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Age {patient.age} • {patient.gender}
                              </p>
                            </div>
                            <Badge
                              variant={patient.status === "stable" ? "default" : "secondary"}
                              className={patient.status === "stable" ? "bg-green-500" : "bg-orange-500"}
                            >
                              {patient.status === "stable" ? "Stable" : "Needs Attention"}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Condition:</span>
                              <p className="font-medium">{patient.condition}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-muted-foreground">Last Visit:</span>
                                <p className="font-medium">{patient.lastVisit}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Next Medication:</span>
                                <p className="font-medium">{patient.nextMedication}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleViewDetails(patient.id)
                              }}
                            >
                              View Details
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleUpdateStatus(patient.id)
                              }}
                            >
                              Update Status
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tasks" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Today's Care Tasks</CardTitle>
                    <CardDescription>Your scheduled activities and reminders</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {tasks.map((task) => (
                      <Card
                        key={task.id}
                        className={`border-l-4 ${
                          task.status === "completed"
                            ? "border-l-green-500"
                            : task.status === "pending"
                              ? "border-l-orange-500"
                              : "border-l-blue-500"
                        }`}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{task.task}</h4>
                              <p className="text-sm text-muted-foreground">{task.patient}</p>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={
                                  task.status === "completed"
                                    ? "default"
                                    : task.status === "pending"
                                      ? "secondary"
                                      : "outline"
                                }
                                className={
                                  task.status === "completed"
                                    ? "bg-green-500"
                                    : task.status === "pending"
                                      ? "bg-orange-500"
                                      : ""
                                }
                              >
                                {task.status}
                              </Badge>
                              <p className="text-sm text-muted-foreground mt-1">{task.time}</p>
                            </div>
                          </div>
                          {task.status !== "completed" && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleTaskComplete(task.id)
                              }}
                              className="mt-2"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Complete
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Emergency Contacts and Alerts */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Urgent Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {patients
                    .filter((p) => p.urgency === "medium")
                    .map((patient) => (
                      <div
                        key={patient.id}
                        className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-md"
                      >
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <div className="text-sm">
                          <p className="font-medium">
                            {patient.name} - {patient.condition}
                          </p>
                          <p className="text-muted-foreground">Status: {patient.status}</p>
                        </div>
                      </div>
                    ))}
                  {patients.filter((p) => p.urgency === "medium").length === 0 && (
                    <p className="text-sm text-muted-foreground">No urgent alerts at this time.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Emergency Contacts
                </CardTitle>
                <CardDescription>Quick access to medical professionals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {emergencyContacts.map((contact, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">{contact.role}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleEmergencyCall(contact.phone)
                      }}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Care Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <p>Monitor vital signs daily for high-risk patients</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <p>Ensure medication adherence and timing</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <p>Report any concerning changes immediately</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <p>Maintain detailed care activity logs</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Patient Details Dialog */}
      <Dialog open={showPatientDetails} onOpenChange={setShowPatientDetails}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
            <DialogDescription>Comprehensive information about {selectedPatient?.name}</DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Personal Info</span>
                  </div>
                  <div className="pl-6 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Name:</span> {selectedPatient.name}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Age:</span> {selectedPatient.age}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Gender:</span> {selectedPatient.gender}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Contact Info</span>
                  </div>
                  <div className="pl-6 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Address:</span> {selectedPatient.address}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Phone:</span> {selectedPatient.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Medical Information</span>
                </div>
                <div className="pl-6 space-y-3">
                  <div>
                    <p className="text-sm font-medium">Condition:</p>
                    <p className="text-sm text-muted-foreground">{selectedPatient.condition}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Current Status:</p>
                    <Badge
                      variant={selectedPatient.status === "stable" ? "default" : "secondary"}
                      className={selectedPatient.status === "stable" ? "bg-green-500" : "bg-orange-500"}
                    >
                      {selectedPatient.status === "stable" ? "Stable" : "Needs Attention"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Medications:</p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                      {selectedPatient.medications?.map((med: string, index: number) => (
                        <li key={index}>{med}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Visit Information */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Visit Schedule</span>
                </div>
                <div className="pl-6 space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Last Visit:</span> {selectedPatient.lastVisit}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Next Medication:</span> {selectedPatient.nextMedication}
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Care Notes:</p>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{selectedPatient.notes}</p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowPatientDetails(false)}>
                  Close
                </Button>
                <Button onClick={() => handleUpdateStatus(selectedPatient.id)}>Update Status</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
