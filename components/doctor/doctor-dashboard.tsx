"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  Calendar,
  AlertTriangle,
  Activity,
  Heart,
  Clock,
  MapPin,
  TrendingUp,
  FileText,
  Stethoscope,
  Plus,
  Eye,
  Edit,
} from "lucide-react"
import { mockPatients, mockAppointments, mockTreatments, mockMedicalHistory } from "@/lib/data"

export function DoctorDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview")

  // Filter data for doctor's patients
  const doctorPatients = mockPatients.filter((p) => p.assignedDoctor === "2")
  const todayAppointments = mockAppointments.filter((apt) => apt.doctorId === "2" && apt.date === "2025-01-15")
  const highRiskPatients = doctorPatients.filter((p) => p.riskLevel === "high")
  const priorityPatients = doctorPatients.filter((p) => p.priority)
  const activeTreatments = mockTreatments.filter((t) => t.doctorId === "2" && t.status === "active")

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "outline"
    }
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-balance">Doctor Dashboard</h2>
        <p className="text-muted-foreground">Monitor patients, manage treatments, and track health outcomes</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                <p className="text-2xl font-bold">{doctorPatients.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Appointments</p>
                <p className="text-2xl font-bold">{todayAppointments.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Risk Patients</p>
                <p className="text-2xl font-bold">{highRiskPatients.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Treatments</p>
                <p className="text-2xl font-bold">{activeTreatments.length}</p>
              </div>
              <Activity className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="treatments">Treatments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Priority Patients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Priority Patients
                </CardTitle>
                <CardDescription>Patients requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {priorityPatients.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No priority patients at this time</p>
                ) : (
                  priorityPatients.map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>{getInitials(patient.firstName, patient.lastName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{patient.patientId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getRiskBadgeVariant(patient.riskLevel)}>{patient.riskLevel} risk</Badge>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Today's Appointments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent" />
                  Today's Schedule
                </CardTitle>
                <CardDescription>Upcoming appointments for today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {todayAppointments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No appointments scheduled for today</p>
                ) : (
                  todayAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                          <Clock className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium">{appointment.patientName}</p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.time} - {appointment.type}
                          </p>
                        </div>
                      </div>
                      <Badge variant={appointment.priority === "high" ? "destructive" : "outline"}>
                        {appointment.priority}
                      </Badge>
                    </div>
                  ))
                )}
                <Button className="w-full bg-transparent" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule New Appointment
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Medical Activity
              </CardTitle>
              <CardDescription>Latest patient interactions and treatments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockMedicalHistory.slice(0, 5).map((record) => {
                  const patient = mockPatients.find((p) => p.id === record.patientId)
                  return (
                    <div key={record.id} className="flex items-start gap-4 p-3 border rounded-lg">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{record.title}</p>
                          <p className="text-sm text-muted-foreground">{new Date(record.date).toLocaleDateString()}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {patient?.firstName} {patient?.lastName} - {record.type}
                        </p>
                        <p className="text-sm mt-1">{record.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patients Tab */}
        <TabsContent value="patients" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">My Patients</h3>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Patient
            </Button>
          </div>

          <div className="grid gap-4">
            {doctorPatients.map((patient) => (
              <Card key={patient.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback>{getInitials(patient.firstName, patient.lastName)}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-lg">
                            {patient.firstName} {patient.lastName}
                          </h4>
                          {patient.priority && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Priority
                            </Badge>
                          )}
                          <Badge variant={getRiskBadgeVariant(patient.riskLevel)}>{patient.riskLevel} risk</Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
                          <div>ID: {patient.patientId}</div>
                          <div>Age: {calculateAge(patient.dateOfBirth)}</div>
                          <div>Blood Type: {patient.bloodType || "Unknown"}</div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {patient.chronicConditions.map((condition, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {condition}
                            </Badge>
                          ))}
                        </div>

                        {patient.lastVisit && (
                          <div className="text-xs text-muted-foreground">
                            Last visit: {new Date(patient.lastVisit).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Stethoscope className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Appointment Management</h3>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Appointment
            </Button>
          </div>

          <div className="grid gap-4">
            {mockAppointments
              .filter((apt) => apt.doctorId === "2")
              .map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{appointment.patientName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {appointment.type.replace("_", " ")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={appointment.priority === "high" ? "destructive" : "outline"}>
                          {appointment.priority} priority
                        </Badge>
                        <Badge variant={appointment.status === "scheduled" ? "default" : "secondary"}>
                          {appointment.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Treatments Tab */}
        <TabsContent value="treatments" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Active Treatments</h3>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Treatment Plan
            </Button>
          </div>

          <div className="grid gap-4">
            {activeTreatments.map((treatment) => {
              const patient = mockPatients.find((p) => p.id === treatment.patientId)
              return (
                <Card key={treatment.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">
                            {patient?.firstName} {patient?.lastName}
                          </h4>
                          <p className="text-sm text-muted-foreground">{treatment.diagnosis}</p>
                          <p className="text-sm text-muted-foreground">
                            Started: {new Date(treatment.date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={treatment.status === "active" ? "default" : "secondary"}>
                          {treatment.status}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <h5 className="font-medium">Treatment Plan:</h5>
                        <p className="text-sm">{treatment.treatment}</p>
                      </div>

                      <div className="space-y-2">
                        <h5 className="font-medium">Medications:</h5>
                        <div className="grid gap-2">
                          {treatment.medications.map((med, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <span className="text-sm font-medium">{med.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {med.dosage} - {med.frequency}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {treatment.followUpRequired && treatment.followUpDate && (
                        <div className="flex items-center gap-2 p-2 bg-accent/10 rounded">
                          <Calendar className="w-4 h-4 text-accent" />
                          <span className="text-sm">
                            Follow-up scheduled: {new Date(treatment.followUpDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Update Treatment
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-2" />
                          View History
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <h3 className="text-xl font-semibold">Health Analytics & Insights</h3>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Patient Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Patient Risk Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">High Risk</span>
                    <span className="text-sm font-medium">{highRiskPatients.length}</span>
                  </div>
                  <Progress value={(highRiskPatients.length / doctorPatients.length) * 100} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Medium Risk</span>
                    <span className="text-sm font-medium">
                      {doctorPatients.filter((p) => p.riskLevel === "medium").length}
                    </span>
                  </div>
                  <Progress
                    value={
                      (doctorPatients.filter((p) => p.riskLevel === "medium").length / doctorPatients.length) * 100
                    }
                    className="h-2"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Low Risk</span>
                    <span className="text-sm font-medium">
                      {doctorPatients.filter((p) => p.riskLevel === "low").length}
                    </span>
                  </div>
                  <Progress
                    value={(doctorPatients.filter((p) => p.riskLevel === "low").length / doctorPatients.length) * 100}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Geographic Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Geographic Distribution
                </CardTitle>
                <CardDescription>Patient distribution by district for cluster analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from(new Set(doctorPatients.map((p) => p.district).filter(Boolean))).map((district) => {
                    const districtPatients = doctorPatients.filter((p) => p.district === district)
                    const highRiskInDistrict = districtPatients.filter((p) => p.riskLevel === "high").length

                    return (
                      <div key={district} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{district}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{districtPatients.length} patients</span>
                            {highRiskInDistrict > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {highRiskInDistrict} high risk
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Progress value={(districtPatients.length / doctorPatients.length) * 100} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Treatment Outcomes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Treatment Outcomes
              </CardTitle>
              <CardDescription>Overview of treatment effectiveness and patient progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-success">{activeTreatments.length}</div>
                  <div className="text-sm text-muted-foreground">Active Treatments</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {mockTreatments.filter((t) => t.status === "completed").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Completed Treatments</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-accent">
                    {activeTreatments.filter((t) => t.followUpRequired).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending Follow-ups</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
