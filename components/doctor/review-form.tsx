"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, MessageSquare, Loader2, AlertCircle } from "lucide-react"

interface VisitRecord {
  id: string
  created_at: string
  symptoms: string
  blood_pressure: string | null
  heart_rate: number | null
  temperature: number | null
  notes: string | null
  status: string
  patients: {
    patient_id: string
    date_of_birth: string | null
    gender: string | null
    users: {
      full_name: string
      email: string
    }
  }
  users: {
    full_name: string
    email: string
  }
}

interface ReviewFormProps {
  record: VisitRecord
}

export function ReviewForm({ record }: ReviewFormProps) {
  const [doctorNotes, setDoctorNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const supabase = createClient()

  const handleReview = async (action: "approve" | "reject") => {
    if (action === "reject" && !doctorNotes.trim()) {
      setError("Please provide notes when rejecting a record")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from("visit_records")
        .update({
          status: action === "approve" ? "approved" : "rejected",
          doctor_notes: doctorNotes.trim() || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", record.id)

      if (error) throw error

      toast({
        title: `Record ${action === "approve" ? "Approved" : "Rejected"}`,
        description: `Visit record for ${record.patients.users.full_name} has been ${action}d.`,
      })

      router.push("/doctor")
      router.refresh()
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Review Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const age = record.patients.date_of_birth
    ? Math.floor(
        (new Date().getTime() - new Date(record.patients.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
      )
    : null

  return (
    <div className="space-y-6">
      {/* Patient Information */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="font-medium">{record.patients.users.full_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Patient ID</p>
              <p className="font-medium">{record.patients.patient_id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Age</p>
              <p className="font-medium">{age ? `${age} years` : "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gender</p>
              <Badge variant="outline" className="capitalize">
                {record.patients.gender || "Not specified"}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="font-medium">{record.patients.users.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">VHV</p>
              <p className="font-medium">{record.users.full_name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visit Details */}
      <Card>
        <CardHeader>
          <CardTitle>Visit Details</CardTitle>
          <CardDescription>Recorded on {new Date(record.created_at).toLocaleString()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Symptoms</h3>
            <p className="text-sm bg-muted p-3 rounded-lg">{record.symptoms}</p>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium mb-2">Vital Signs</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">Blood Pressure</p>
                <p className="font-medium">{record.blood_pressure || "Not recorded"}</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">Heart Rate</p>
                <p className="font-medium">{record.heart_rate ? `${record.heart_rate} BPM` : "Not recorded"}</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">Temperature</p>
                <p className="font-medium">{record.temperature ? `${record.temperature}°C` : "Not recorded"}</p>
              </div>
            </div>
          </div>

          {record.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">VHV Notes</h3>
                <p className="text-sm bg-muted p-3 rounded-lg">{record.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Review Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Doctor Review
          </CardTitle>
          <CardDescription>Add your notes and approve or reject this record</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doctorNotes">Doctor Notes</Label>
            <Textarea
              id="doctorNotes"
              placeholder="Add your diagnosis, treatment recommendations, or other notes..."
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Notes are required when rejecting a record and recommended for approved records.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={() => handleReview("approve")} disabled={isLoading} className="flex-1" variant="default">
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Approve Record
            </Button>
            <Button
              onClick={() => handleReview("reject")}
              disabled={isLoading}
              className="flex-1"
              variant="destructive"
            >
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
              Reject Record
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
