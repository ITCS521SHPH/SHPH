import { requireAuth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Users, FileText, Clock, CheckCircle } from "lucide-react"

export default async function VHVDashboard() {
  const user = await requireAuth(["vhv"])
  const supabase = await createClient()

  // Get assigned patients
  const { data: patients } = await supabase
    .from("patients")
    .select(`
      id,
      patient_id,
      user_id,
      users!inner(full_name, email)
    `)
    .eq("assigned_vhv_id", user.id)

  // Get recent visit records
  const { data: recentRecords } = await supabase
    .from("visit_records")
    .select(`
      id,
      status,
      created_at,
      patients!inner(patient_id, users!inner(full_name))
    `)
    .eq("vhv_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  // Get statistics
  const { data: stats } = await supabase.from("visit_records").select("status").eq("vhv_id", user.id)

  const totalRecords = stats?.length || 0
  const pendingRecords = stats?.filter((r) => r.status === "pending").length || 0
  const approvedRecords = stats?.filter((r) => r.status === "approved").length || 0
  const draftRecords = stats?.filter((r) => r.status === "draft").length || 0

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">VHV Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.full_name}</p>
          </div>

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned Patients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patients?.length || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRecords}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingRecords}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{approvedRecords}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Assigned Patients */}
            <Card>
              <CardHeader>
                <CardTitle>Assigned Patients</CardTitle>
                <CardDescription>Patients under your care</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {patients?.slice(0, 5).map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{patient.users.full_name}</p>
                        <p className="text-sm text-muted-foreground">ID: {patient.patient_id}</p>
                      </div>
                      <Button asChild size="sm">
                        <Link href={`/vhv/visit/${patient.id}`}>New Visit</Link>
                      </Button>
                    </div>
                  ))}
                  {(!patients || patients.length === 0) && (
                    <p className="text-muted-foreground text-center py-4">No patients assigned</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Records */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Visit Records</CardTitle>
                <CardDescription>Your latest submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentRecords?.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{record.patients.users.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(record.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          record.status === "approved"
                            ? "default"
                            : record.status === "pending"
                              ? "secondary"
                              : record.status === "rejected"
                                ? "destructive"
                                : "outline"
                        }
                      >
                        {record.status}
                      </Badge>
                    </div>
                  ))}
                  {(!recentRecords || recentRecords.length === 0) && (
                    <p className="text-muted-foreground text-center py-4">No recent records</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {draftRecords > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Draft Records
                </CardTitle>
                <CardDescription>You have {draftRecords} incomplete visit records</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/vhv/drafts">View Drafts</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
