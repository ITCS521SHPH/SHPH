import { requireAuth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { PendingQueue } from "@/components/doctor/pending-queue"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { FileText, Clock, CheckCircle, XCircle, Users, TrendingUp } from "lucide-react"

export default async function DoctorDashboard() {
  const user = await requireAuth(["doctor"])
  const supabase = await createClient()

  // Get statistics
  const { data: allRecords } = await supabase.from("visit_records").select("status, created_at").neq("status", "draft")

  const totalRecords = allRecords?.length || 0
  const pendingRecords = allRecords?.filter((r) => r.status === "pending").length || 0
  const approvedRecords = allRecords?.filter((r) => r.status === "approved").length || 0
  const rejectedRecords = allRecords?.filter((r) => r.status === "rejected").length || 0

  // Get today's reviews
  const today = new Date().toISOString().split("T")[0]
  const todayReviews = allRecords?.filter((r) => r.created_at.startsWith(today)).length || 0

  // Get total patients
  const { data: patients } = await supabase.from("patients").select("id")
  const totalPatients = patients?.length || 0

  // Get total VHVs
  const { data: vhvs } = await supabase.from("users").select("id").eq("role", "vhv")
  const totalVHVs = vhvs?.length || 0

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, Dr. {user.full_name}</p>
          </div>

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{pendingRecords}</div>
                <p className="text-xs text-muted-foreground">Awaiting your review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRecords}</div>
                <p className="text-xs text-muted-foreground">All visit records</p>
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
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{rejectedRecords}</div>
                <p className="text-xs text-muted-foreground">Needs revision</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPatients}</div>
                <p className="text-xs text-muted-foreground">In the system</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active VHVs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalVHVs}</div>
                <p className="text-xs text-muted-foreground">Village health volunteers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayReviews}</div>
                <p className="text-xs text-muted-foreground">New records today</p>
              </CardContent>
            </Card>
          </div>

          {/* Pending Queue */}
          <PendingQueue />
        </div>
      </main>
    </div>
  )
}
