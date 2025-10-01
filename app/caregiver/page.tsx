import { requireAuth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { RecordsList } from "@/components/patient/records-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"
import { Users, Heart, FileText, Clock, CheckCircle } from "lucide-react"

export default async function CaregiverDashboard() {
  const user = await requireAuth(["caregiver"])
  const supabase = await createClient()

  // Get caregiver relationships
  const { data: caregiverRelations } = await supabase
    .from("caregivers")
    .select(`
      id,
      relationship,
      is_primary,
      patients!inner(
        id,
        patient_id,
        date_of_birth,
        gender,
        address,
        users!inner(full_name, email),
        users!assigned_vhv_id(full_name, email)
      )
    `)
    .eq("user_id", user.id)

  // Get all visit records for patients under care
  const patientIds = caregiverRelations?.map((rel) => rel.patients.id) || []
  let allRecords: any[] = []

  if (patientIds.length > 0) {
    const { data: records } = await supabase
      .from("visit_records")
      .select("status, patient_id")
      .in("patient_id", patientIds)
      .neq("status", "draft")

    allRecords = records || []
  }

  const totalRecords = allRecords.length
  const pendingRecords = allRecords.filter((r) => r.status === "pending").length
  const approvedRecords = allRecords.filter((r) => r.status === "approved").length
  const rejectedRecords = allRecords.filter((r) => r.status === "rejected").length

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Caregiver Portal</h1>
            <p className="text-muted-foreground">Welcome, {user.full_name}</p>
          </div>

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Patients Under Care</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{caregiverRelations?.length || 0}</div>
                <p className="text-xs text-muted-foreground">People you care for</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRecords}</div>
                <p className="text-xs text-muted-foreground">All visit records</p>
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
          </div>

          {/* Patients Under Care */}
          {caregiverRelations && caregiverRelations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Patients Under Your Care
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {caregiverRelations.map((relation) => {
                    const patient = relation.patients
                    const age = patient.date_of_birth
                      ? Math.floor(
                          (new Date().getTime() - new Date(patient.date_of_birth).getTime()) /
                            (365.25 * 24 * 60 * 60 * 1000),
                        )
                      : null

                    const patientRecords = allRecords.filter((r) => r.patient_id === patient.id)

                    return (
                      <Card key={relation.id} className="border-l-4 border-l-primary/20">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{patient.users.full_name}</h3>
                              <p className="text-sm text-muted-foreground">ID: {patient.patient_id}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant={relation.is_primary ? "default" : "secondary"}>
                                {relation.relationship}
                              </Badge>
                              {relation.is_primary && (
                                <p className="text-xs text-muted-foreground mt-1">Primary Caregiver</p>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Age:</span>
                              <span>{age ? `${age} years` : "Not specified"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Gender:</span>
                              <span className="capitalize">{patient.gender || "Not specified"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Visit Records:</span>
                              <span>{patientRecords.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Assigned VHV:</span>
                              <span>{patient.users?.full_name || "Not assigned"}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Visit Records for All Patients */}
          {caregiverRelations && caregiverRelations.length > 0 && (
            <div className="space-y-6">
              {caregiverRelations.map((relation) => (
                <RecordsList
                  key={relation.id}
                  patientId={relation.patients.id}
                  title={`Visit Records - ${relation.patients.users.full_name}`}
                  description={`Healthcare visits for ${relation.patients.users.full_name} (${relation.relationship})`}
                />
              ))}
            </div>
          )}

          {(!caregiverRelations || caregiverRelations.length === 0) && (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Patients Assigned</h3>
                <p className="text-muted-foreground">
                  You are not currently assigned as a caregiver for any patients. Please contact your healthcare
                  provider if this is incorrect.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
