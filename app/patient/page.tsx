import { requireAuth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { RecordsList } from "@/components/patient/records-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"
import { User, FileText, Clock, CheckCircle, XCircle } from "lucide-react"

export default async function PatientDashboard() {
  const user = await requireAuth(["patient"])
  const supabase = await createClient()

  // Get patient profile
  const { data: patient } = await supabase
    .from("patients")
    .select(`
      id,
      patient_id,
      date_of_birth,
      gender,
      address,
      emergency_contact,
      emergency_phone,
      users!assigned_vhv_id(full_name, email)
    `)
    .eq("user_id", user.id)
    .single()

  // Get visit records statistics
  const { data: records } = await supabase
    .from("visit_records")
    .select("status")
    .eq("patient_id", patient?.id)
    .neq("status", "draft")

  const totalRecords = records?.length || 0
  const pendingRecords = records?.filter((r) => r.status === "pending").length || 0
  const approvedRecords = records?.filter((r) => r.status === "approved").length || 0
  const rejectedRecords = records?.filter((r) => r.status === "rejected").length || 0

  const age = patient?.date_of_birth
    ? Math.floor((new Date().getTime() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Patient Portal</h1>
            <p className="text-muted-foreground">Welcome, {user.full_name}</p>
          </div>

          {/* Patient Information */}
          {patient && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Your Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Patient ID</p>
                    <p className="font-medium">{patient.patient_id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Age</p>
                    <p className="font-medium">{age ? `${age} years` : "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Gender</p>
                    <Badge variant="outline" className="capitalize">
                      {patient.gender || "Not specified"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p className="font-medium">{user.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Assigned VHV</p>
                    <p className="font-medium">{patient.users?.full_name || "Not assigned"}</p>
                  </div>
                </div>
                {patient.address && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p className="font-medium">{patient.address}</p>
                  </div>
                )}
                {patient.emergency_contact && (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Emergency Contact</p>
                      <p className="font-medium">{patient.emergency_contact}</p>
                    </div>
                    {patient.emergency_phone && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Emergency Phone</p>
                        <p className="font-medium">{patient.emergency_phone}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRecords}</div>
                <p className="text-xs text-muted-foreground">All your visit records</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{pendingRecords}</div>
                <p className="text-xs text-muted-foreground">Awaiting doctor review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{approvedRecords}</div>
                <p className="text-xs text-muted-foreground">Successfully reviewed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Needs Follow-up</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{rejectedRecords}</div>
                <p className="text-xs text-muted-foreground">Requires attention</p>
              </CardContent>
            </Card>
          </div>

          {/* Visit Records */}
          {patient && (
            <RecordsList
              patientId={patient.id}
              title="Your Visit Records"
              description="View all your healthcare visits and their status"
            />
          )}
        </div>
      </main>
    </div>
  )
}
