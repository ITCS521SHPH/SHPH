import { requireAuth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { ReviewForm } from "@/components/doctor/review-form"
import { PatientHistory } from "@/components/doctor/patient-history"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ recordId: string }>
}

export default async function ReviewRecordPage({ params }: PageProps) {
  const { recordId } = await params
  const user = await requireAuth(["doctor"])
  const supabase = await createClient()

  // Get the visit record
  const { data: record, error } = await supabase
    .from("visit_records")
    .select(`
      id,
      created_at,
      symptoms,
      blood_pressure,
      heart_rate,
      temperature,
      notes,
      status,
      patients!inner(
        id,
        patient_id,
        date_of_birth,
        gender,
        users!inner(full_name, email)
      ),
      users!vhv_id(full_name, email)
    `)
    .eq("id", recordId)
    .eq("status", "pending")
    .single()

  if (error || !record) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/doctor">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Review Visit Record</h1>
              <p className="text-muted-foreground">Patient: {record.patients.users.full_name}</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ReviewForm record={record} />
            </div>
            <div>
              <PatientHistory patientId={record.patients.id} currentRecordId={recordId} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
