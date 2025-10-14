"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Calendar, FileText, Heart, Bell, MapPin, Clock } from "lucide-react"
import { clearCurrentUser } from "@/lib/auth"
import { useRouter } from "next/navigation"

const upcomingAppointments = [
  {
    id: 1,
    type: "Follow-up Visit",
    provider: "Dr. Michael Chen",
    date: "2024-01-20",
    time: "10:00 AM",
    location: "Village Health Center",
  },
  {
    id: 2,
    type: "VHV Check-in",
    provider: "Maria Santos (VHV)",
    date: "2024-01-25",
    time: "2:00 PM",
    location: "Home Visit",
  },
]

const recentVisits = [
  {
    id: 1,
    date: "2024-01-15",
    provider: "Maria Santos (VHV)",
    diagnosis: "Common Cold",
    treatment: "Rest, fluids, paracetamol",
    status: "completed",
  },
  {
    id: 2,
    date: "2024-01-10",
    provider: "Dr. Michael Chen",
    diagnosis: "Routine Check-up",
    treatment: "Continue current medications",
    status: "completed",
  },
]

const medications = [
  {
    name: "Paracetamol",
    dosage: "500mg",
    frequency: "Twice daily",
    duration: "5 days",
    remaining: 3,
  },
  {
    name: "Vitamin D",
    dosage: "1000 IU",
    frequency: "Once daily",
    duration: "Ongoing",
    remaining: 15,
  },
]

const vitalTrends = [
  { date: "2024-01-15", temperature: 37.2, bp: "120/80", weight: 65 },
  { date: "2024-01-10", temperature: 36.8, bp: "118/78", weight: 64.5 },
  { date: "2024-01-05", temperature: 36.9, bp: "122/82", weight: 65.2 },
]

export function PatientDashboard() {
  const router = useRouter()

  const handleSignOut = () => {
    clearCurrentUser()
    router.push("/")
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
                {upcomingAppointments.map((appointment) => (
                  <Card key={appointment.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{appointment.type}</h4>
                        <Badge variant="outline">{appointment.date}</Badge>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {appointment.provider}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {appointment.time}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {appointment.location}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm">Join Call</Button>
                        <Button variant="outline" size="sm">
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
                {recentVisits.map((visit) => (
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
                          <span>{visit.provider}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Date:</span>
                          <span>{visit.date}</span>
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
                {medications.map((medication, index) => (
                  <Card key={index} className="border-l-4 border-l-red-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{medication.name}</h4>
                        <Badge variant={medication.remaining < 5 ? "destructive" : "secondary"}>
                          {medication.remaining} days left
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
                      {medication.remaining < 5 && (
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
                  {vitalTrends.map((vital, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">{vital.date}</div>
                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">Temp:</span>
                          <span className="ml-1 font-medium">{vital.temperature}°C</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">BP:</span>
                          <span className="ml-1 font-medium">{vital.bp}</span>
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
    </div>
  )
}
