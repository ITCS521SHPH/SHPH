import { requireAuth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { VisitForm } from "@/components/vhv/visit-form/visit-form"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ patientId: string }>
}

export default async function NewVisitPage({ params }: PageProps) {
  const { patientId } = await params
  const user = await requireAuth(["vhv"])
  const supabase = await createClient()

  // Get patient details
  const { data: patient, error } = await supabase
    .from("patients")
    .select(`
      id,
      patient_id,
      date_of_birth,
      gender,
      address,
      emergency_contact,
      emergency_phone,
      users!inner(full_name, email, phone)
    `)
    .eq("id", patientId)
    .eq("assigned_vhv_id", user.id)
    .single()

  if (error || !patient) {
    notFound()
  }

  const age = patient.date_of_birth
    ? Math.floor((new Date().getTime() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/vhv">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">New Visit Record</h1>
              <p className="text-muted-foreground">Create a new visit record for the patient</p>
            </div>
          </div>

          {/* Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="font-medium">{patient.users.full_name}</p>
                </div>
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
                  <p className="text-sm font-medium text-muted-foreground">Contact</p>
                  <p className="font-medium">{patient.users.phone || patient.users.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Emergency Contact</p>
                  <p className="font-medium">{patient.emergency_contact || "Not specified"}</p>
                </div>
              </div>
              {patient.address && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="font-medium">{patient.address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visit Form */}
          <VisitForm patientId={patientId} />
        </div>
      </main>
    </div>
  )
}
