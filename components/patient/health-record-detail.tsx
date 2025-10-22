"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Activity, FileText, User, ArrowLeft, ClipboardList } from "lucide-react"
import { intakesApi } from "@/lib/api"

export function PatientRecordDetail({ submissionId }: { submissionId: string }) {
  const router = useRouter()
  const [record, setRecord] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await intakesApi.getById(submissionId)
        setRecord(data)
      } catch (e: any) {
        setError(e?.message || "Failed to load record")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [submissionId])

  if (loading) return <div className="p-6 text-sm">Loading record...</div>
  if (error) return <div className="p-6 text-red-500 text-sm">{error}</div>
  if (!record) return <div className="p-6 text-sm">Not found.</div>

  const p = record.payload || {}

  const isPlaceholder = (v: any) => typeof v === "string" && v.trim() === "123"
  const displayValue = (v: any) => {
    if (v === undefined || v === null) return undefined
    if (typeof v === "string") {
      const t = v.trim()
      if (t === "" || t.toLowerCase() === "n/a" || t === "0" || t === "-" || t === "--" || isPlaceholder(t)) return undefined
      return t
    }
    return v
  }

  const InfoRow = ({ label, value }: { label: string; value?: string | number }) => {
    const v = displayValue(value)
    return (
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm">{v !== undefined ? String(v) : "Not recorded"}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-semibold">Health Record</h1>
          <Badge className="ml-auto" variant="secondary">{record.status}</Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* 1. Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-4 w-4"/> Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow label="Name" value={`${p.patientBasics?.firstName || ''} ${p.patientBasics?.lastName || ''}`.trim() || undefined} />
            <InfoRow label="Date of Birth" value={p.patientBasics?.dob ? new Date(p.patientBasics.dob).toLocaleDateString() : undefined} />
            <InfoRow label="Contact" value={p.patientBasics?.contactPhone} />
            <InfoRow label="Visit Date" value={p.visitMeta?.visitDateTime ? new Date(p.visitMeta.visitDateTime).toLocaleString() : undefined} />
            <InfoRow label="Location" value={p.visitMeta?.locationText} />
            {p.symptoms?.chiefComplaint && <InfoRow label="Chief Complaint" value={p.symptoms?.chiefComplaint} />}
          </CardContent>
        </Card>

        {/* 2. Vital Signs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4"/> Vital Signs</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoRow label="Temperature" value={displayValue(p.vitals?.temp) !== undefined ? `${p.vitals.temp} °C` : undefined} />
            <InfoRow label="Blood Pressure" value={p.vitals?.systolic !== undefined && p.vitals?.diastolic !== undefined && !isPlaceholder(p.vitals?.systolic) && !isPlaceholder(p.vitals?.diastolic) ? `${p.vitals.systolic}/${p.vitals.diastolic} mmHg` : undefined} />
            <InfoRow label="Heart Rate" value={displayValue(p.vitals?.hr) !== undefined ? `${p.vitals.hr} bpm` : undefined} />
            <InfoRow label="SpO2" value={displayValue(p.vitals?.spo2) !== undefined ? `${p.vitals.spo2}%` : undefined} />
            <InfoRow label="Glucose" value={displayValue(p.vitals?.glucose) !== undefined ? `${p.vitals.glucose} mg/dL` : undefined} />
          </CardContent>
        </Card>

        {/* 3. Physical Function & Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ClipboardList className="h-4 w-4"/> Physical Function & Performance</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoRow label="Dyspnea Score" value={p.assessments?.physicalFunction?.dyspneaScore} />
            <InfoRow label="Balance Score" value={p.assessments?.physicalFunction?.balanceScore} />
            <InfoRow label="IPAQ Score" value={p.assessments?.physicalFunction?.ipaqScore} />
            <InfoRow label="Sit-to-Stand Reps" value={p.assessments?.physicalFunction?.sitToStandReps} />
            <InfoRow label="6-Min Walk (m)" value={p.assessments?.physicalFunction?.sixMinuteWalk} />
            <InfoRow label="SPPB Score" value={p.assessments?.physicalFunction?.sppbScore} />
            <InfoRow label="Grip Strength (R)" value={p.assessments?.physicalFunction?.gripStrengthRight} />
            <InfoRow label="Grip Strength (L)" value={p.assessments?.physicalFunction?.gripStrengthLeft} />
          </CardContent>
        </Card>

        {/* 4. Mental, Cognitive & Fatigue Assessment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4"/> Mental, Cognitive & Fatigue Assessment</CardTitle>
          </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoRow label="MoCA Score" value={p.assessments?.mentalCognitive?.mocaScore} />
            <InfoRow label="Fatigue Severity" value={p.assessments?.mentalCognitive?.fatigueSeverityScale} />
            <InfoRow label="FACIT Fatigue" value={p.assessments?.mentalCognitive?.facitFatigueScale} />
            <InfoRow label="Chalder Fatigue" value={p.assessments?.mentalCognitive?.chalderFatigueScale} />
            <InfoRow label="GAD-7" value={p.assessments?.mentalCognitive?.gad7Score} />
            <InfoRow label="HADS Anxiety" value={p.assessments?.mentalCognitive?.hadsAnxietyScore} />
            <InfoRow label="HADS Depression" value={p.assessments?.mentalCognitive?.hadsDepressionScore} />
            <InfoRow label="Beck Score" value={p.assessments?.mentalCognitive?.beckScore} />
            <InfoRow label="IES-R" value={p.assessments?.mentalCognitive?.iesrScore} />
          </CardContent>
        </Card>

        {/* 5. VHV Notes & Visit Confirmation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4"/> VHV Notes & Visit Confirmation</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="Visit Date/Time" value={p.visitMeta?.visitDateTime ? new Date(p.visitMeta.visitDateTime).toLocaleString() : undefined} />
              <InfoRow label="Location" value={p.visitMeta?.locationText} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Patient Concerns</div>
              <div className="text-sm whitespace-pre-wrap">{p.vhvNotes?.patientConcerns || "Not recorded"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">VHV Observations</div>
              <div className="text-sm whitespace-pre-wrap">{p.vhvNotes?.vhvObservations || "Not recorded"}</div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
