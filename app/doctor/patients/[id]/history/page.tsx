"use client"

import { Suspense, use as usePromise, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { LucideIcon } from 'lucide-react'
import { Activity, ClipboardList, FileText, User } from 'lucide-react'
type ParamsMaybePromise = { id: string } | Promise<{ id: string }>

function isThenable(v: any): v is Promise<any> {
  return v && typeof v.then === 'function'
}

type HistoryRiskDetails = {
  score: number
  factors: string[]
}

type HistoryConditionDetails = {
  categoryId: string | null
  label: string | null
  riskFlag: 'HIGH' | 'MEDIUM' | 'LOW' | null
  color?: string | null
  notes?: string | null
  summary?: string | null
}

type HistorySummaries = {
  allergies?: string | null
  chronicConditions?: string[]
  conditionSummary?: string | null
  conditionLabel?: string | null
}

type HistoryLatestIntake = {
  id: string
  status?: string | null
  submittedAt?: string | null
  updatedAt?: string | null
  payload?: Record<string, unknown> | null
  attachments?: unknown[]
  riskFlags?: Record<string, unknown> | null
}

type HistoryRecordPriority = 'low' | 'medium' | 'high' | 'urgent' | string

type HistoryRecord = {
  id: string
  type: string
  date: string
  title: string
  summary?: string | null
  priority?: HistoryRecordPriority | null
  approved?: boolean
  hasForm?: boolean
  details?: Record<string, unknown> | null
}

const formatDate = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString()
}

const formatDateTime = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

const isPlaceholderValue = (value: unknown) => typeof value === 'string' && value.trim() === '123'

const displayValue = (value: unknown): string | number | undefined => {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return undefined
    return value
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return undefined
    const lowered = trimmed.toLowerCase()
    if (lowered === 'n/a' || lowered === 'na' || lowered === 'none') return undefined
    if (trimmed === '0' || trimmed === '-' || trimmed === '--') return undefined
    if (isPlaceholderValue(trimmed)) return undefined
    return trimmed
  }
  return undefined
}

const formatKeyLabel = (key: string) =>
  key
    .replace(/[_\-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase())

function HistoryContent({ params }: { params: ParamsMaybePromise }) {
  const router = useRouter()
  const sp = useSearchParams()
  const patientId = isThenable(params) ? (usePromise(params) as { id: string }).id : (params as any).id
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [patient, setPatient] = useState<any>(null)
  const [riskLevel, setRiskLevel] = useState<'LOW'|'MEDIUM'|'HIGH'>('LOW')
  const [riskDetails, setRiskDetails] = useState<HistoryRiskDetails | null>(null)
  const [conditionDetails, setConditionDetails] = useState<HistoryConditionDetails | null>(null)
  const [summaries, setSummaries] = useState<HistorySummaries>({})
  const [latestIntake, setLatestIntake] = useState<HistoryLatestIntake | null>(null)

  const [from, setFrom] = useState(sp.get('from') || '')
  const [to, setTo] = useState(sp.get('to') || '')
  const [q, setQ] = useState(sp.get('q') || '')
  const [priority, setPriority] = useState(sp.get('priority') || '')

  const fetchHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      const p = new URLSearchParams()
      if (from) p.set('from', from)
      if (to) p.set('to', to)
      if (q) p.set('q', q)
      if (priority) p.set('priority', priority)
      const res = await fetch(`/api/doctor/patients/${patientId}/history?${p.toString()}`)
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || 'Failed to load history')
      }
      const data = await res.json()
      const incomingRecords = Array.isArray(data.records) ? (data.records as HistoryRecord[]) : []
      setPatient(data.patient)
      setRiskLevel(data.riskLevel || 'LOW')
      setRiskDetails(data.riskDetails || null)
      setConditionDetails(data.condition || null)
      setSummaries(data.summaries || {})
      setRecords(incomingRecords)
      setLatestIntake(data.latestIntake || null)
    } catch (e: any) {
      setError(e?.message || 'Failed to load history')
      setRiskDetails(null)
      setConditionDetails(null)
      setLatestIntake(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleViewFullIntake = () => {
    if (!latestIntake?.id) return
    try {
      router.push(`/patient/records/${latestIntake.id}`)
    } catch (error) {
      console.error('Failed to navigate to intake record', error)
    }
  }

  const riskBadgeVariant = useMemo(() => {
    switch (riskLevel) {
      case 'HIGH': return 'destructive'
      case 'MEDIUM': return 'secondary'
      default: return 'default'
    }
  }, [riskLevel]) as any

  const conditionBadgeVariant = useMemo(() => {
    if (!conditionDetails?.riskFlag) return 'outline'
    switch (conditionDetails.riskFlag) {
      case 'HIGH':
        return 'destructive'
      case 'MEDIUM':
        return 'secondary'
      default:
        return 'outline'
    }
  }, [conditionDetails?.riskFlag]) as any

  const conditionColor = conditionDetails?.color || '#94A3B8'
  const conditionPriorityText = conditionDetails?.riskFlag
    ? conditionDetails.riskFlag.toLowerCase()
    : null
  const riskFactorList = useMemo(
    () => (riskDetails?.factors || []).filter((factor) => typeof factor === 'string' && factor.trim().length > 0),
    [riskDetails],
  )
  const chronicList = summaries.chronicConditions || []
  const conditionSummaryText = conditionDetails?.summary || summaries.conditionSummary || null

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patient History</h1>
          <p className="text-sm text-muted-foreground">Review approved medical records and background</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>Back</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {patient ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Name</div>
                <div className="font-medium">{patient.firstName} {patient.lastName}</div>
              </div>
              <div> 
                <div className="text-sm text-muted-foreground mb-1">Risk Level</div>
                <div className="flex items-center gap-2">
                  <Badge variant={riskBadgeVariant}>{riskLevel}</Badge>
                  {typeof riskDetails?.score === 'number' && (
                    <span className="text-xs text-muted-foreground">Score {riskDetails.score}</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Condition Type</div>
                {conditionDetails?.label ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 rounded-full border border-white/40"
                        style={{ backgroundColor: conditionColor }}
                      />
                      <Badge variant={conditionBadgeVariant}>{conditionDetails.label}</Badge>
                    </div>
                    {conditionPriorityText && (
                      <p className="text-xs text-muted-foreground capitalize">{conditionPriorityText} priority</p>
                    )}
                  </div>
                ) : (
                  <div className="font-medium text-muted-foreground">Not documented</div>
                )}
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Allergies</div>
                <div className="font-medium">{summaries.allergies || 'None reported'}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-sm text-muted-foreground mb-1">Condition Summary</div>
                <div className="font-medium">
                  {conditionSummaryText || 'No detailed notes recorded.'}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="text-sm text-muted-foreground mb-1">Chronic Conditions</div>
                <div className="font-medium">
                  {chronicList.length > 0 ? chronicList.join(', ') : 'None recorded'}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No patient loaded</div>
          )}
      </CardContent>
    </Card>

    <HealthAssessmentCard
      intake={latestIntake}
      onViewFull={latestIntake?.id ? handleViewFullIntake : undefined}
    />

    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <Label className="mb-3">From</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label className="mb-3">To</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label className="mb-3">Keyword</Label>
              <Input placeholder="Search notes, diagnoses, meds" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div>
              <Label className="mb-3">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v === 'any' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-5 flex gap-2">
              <Button onClick={fetchHistory}>Apply</Button>
              <Button variant="outline" onClick={() => { setFrom(''); setTo(''); setQ(''); setPriority(''); fetchHistory() }}>Reset</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}
          {!loading && !error && records.length === 0 && (
            <div className="text-sm text-muted-foreground">No records found.</div>
          )}
            <div className="space-y-3">
              {records.map((r) => (
                <div key={`${r.type}_${r.id}`} className="border rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium capitalize">{r.type.replace('_', ' ')}</div>
                    <div className="text-xs text-muted-foreground">{formatDateTime(r.date) ?? r.date}</div>
                  </div>
                  <div className="mt-1 text-sm">{r.title}</div>
                  {r.summary && <div className="text-sm text-muted-foreground mt-1">{r.summary}</div>}
                  <div className="mt-2 flex gap-2">
                    {r.hasForm && <Badge variant="outline">Form Task</Badge>}
                    {r.priority && <Badge variant="secondary">Priority: {r.priority}</Badge>}
                    {r.approved && <Badge>Approved</Badge>}
                  </div>
                  {(r.type === 'task' || r.type === 'intake') && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {r.type === 'task' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            try {
                              router.push(`/doctor/tasks/${r.id}/results`)
                            } catch (error) {
                              console.error('Failed to navigate to task results', error)
                            }
                          }}
                          disabled={!r.hasForm}
                        >
                          View Results
                        </Button>
                      )}
                      {r.type === 'intake' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            try {
                              router.push(`/patient/records/${r.id}`)
                            } catch (error) {
                              console.error('Failed to navigate to intake record', error)
                            }
                          }}
                        >
                          View Health Record
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      {/* Results aggregated from completed tasks
      <PatientTaskResults patientId={patientId} /> */}
    </div>
  )
}

function HealthAssessmentCard({
  intake,
  onViewFull,
}: {
  intake: HistoryLatestIntake | null
  onViewFull?: () => void
}) {
  const status = intake?.status ?? null
  const submittedAt = intake?.submittedAt ? formatDateTime(intake.submittedAt) : null
  const payload = (intake?.payload ?? null) as Record<string, any> | null
  const hasPayload = payload && Object.keys(payload).length > 0
  const riskEntries =
    intake?.riskFlags && typeof intake.riskFlags === 'object'
      ? Object.entries(intake.riskFlags as Record<string, unknown>).filter(([, value]) => {
          if (value === null || value === undefined) return false
          if (typeof value === 'boolean') return value
          if (typeof value === 'number') return value !== 0
          if (typeof value === 'string') {
            const trimmed = value.trim()
            if (!trimmed || trimmed.toLowerCase() === 'false' || trimmed === '0') return false
            return true
          }
          return true
        })
      : []

  const patientBasics = (payload?.patientBasics ?? {}) as Record<string, any>
  const visitMeta = (payload?.visitMeta ?? {}) as Record<string, any>
  const vitals = (payload?.vitals ?? {}) as Record<string, any>
  const assessments = (payload?.assessments ?? {}) as Record<string, any>
  const physicalFunction = (assessments?.physicalFunction ?? {}) as Record<string, any>
  const mentalCognitive = (assessments?.mentalCognitive ?? {}) as Record<string, any>
  const vhvNotes = (payload?.vhvNotes ?? {}) as Record<string, any>
  const symptoms = (payload?.symptoms ?? {}) as Record<string, any>

  const patientName = `${patientBasics.firstName || ''} ${patientBasics.lastName || ''}`.trim() || undefined
  const dobValue = patientBasics.dob ? formatDate(patientBasics.dob) : undefined
  const contactValue = patientBasics.contactPhone
  const visitDateValue = visitMeta.visitDateTime ? formatDateTime(visitMeta.visitDateTime) : undefined
  const locationValue = visitMeta.locationText
  const chiefComplaintValue = displayValue(symptoms.chiefComplaint)

  const temperatureValue = displayValue(vitals.temp)
  const systolicValue = displayValue(vitals.systolic)
  const diastolicValue = displayValue(vitals.diastolic)
  const heartRateValue = displayValue(vitals.hr)
  const spo2Value = displayValue(vitals.spo2)
  const glucoseValue = displayValue(vitals.glucose)

  const bloodPressureValue =
    systolicValue !== undefined && diastolicValue !== undefined
      ? `${systolicValue}/${diastolicValue} mmHg`
      : undefined

  const visitDateTimeValue = visitMeta.visitDateTime ? formatDateTime(visitMeta.visitDateTime) : undefined
  const patientConcernsValue = displayValue(vhvNotes.patientConcerns)
  const vhvObservationsValue = displayValue(vhvNotes.vhvObservations)

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Health Assessment</CardTitle>
          <p className="text-sm text-muted-foreground">
            Latest approved intake submitted by the assigned VHV
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          {status && <Badge variant="secondary">{status}</Badge>}
          {submittedAt && <span className="text-xs text-muted-foreground">Submitted {submittedAt}</span>}
          {onViewFull && (
            <Button size="sm" variant="outline" onClick={onViewFull}>
              View Full Intake
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!intake ? (
          <div className="text-sm text-muted-foreground">No approved intakes are available yet.</div>
        ) : !hasPayload ? (
          <div className="text-sm text-muted-foreground">
            Intake approved, but structured assessment data is not available for this submission.
          </div>
        ) : (
          <div className="space-y-6">
            {riskEntries.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {riskEntries.map(([key, value]) => {
                  const label = formatKeyLabel(key)
                  const isCritical =
                    value === true || (typeof value === 'string' && value.toLowerCase().includes('high'))
                  const suffix =
                    typeof value === 'string' && value.toLowerCase() !== 'true' && value.toLowerCase() !== 'yes'
                      ? `: ${value}`
                      : ''
                  return (
                    <Badge key={key} variant={isCritical ? 'destructive' : 'secondary'}>
                      {suffix ? `${label}${suffix}` : label}
                    </Badge>
                  )
                })}
              </div>
            )}

            <AssessmentSection icon={User} title="Patient Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AssessmentInfoRow label="Name" value={patientName} />
                <AssessmentInfoRow label="Date of Birth" value={dobValue} />
                <AssessmentInfoRow label="Contact" value={contactValue} />
                <AssessmentInfoRow label="Visit Date" value={visitDateValue} />
                <AssessmentInfoRow label="Location" value={locationValue} />
                <AssessmentInfoRow label="Chief Complaint" value={chiefComplaintValue} />
              </div>
            </AssessmentSection>

            <AssessmentSection icon={Activity} title="Vital Signs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AssessmentInfoRow
                  label="Temperature"
                  value={temperatureValue !== undefined ? `${temperatureValue} deg C` : undefined}
                />
                <AssessmentInfoRow
                  label="Blood Pressure"
                  value={bloodPressureValue}
                />
                <AssessmentInfoRow
                  label="Heart Rate"
                  value={heartRateValue !== undefined ? `${heartRateValue} bpm` : undefined}
                />
                <AssessmentInfoRow
                  label="SpO2"
                  value={spo2Value !== undefined ? `${spo2Value}%` : undefined}
                />
                <AssessmentInfoRow
                  label="Glucose"
                  value={glucoseValue !== undefined ? `${glucoseValue} mg/dL` : undefined}
                />
              </div>
            </AssessmentSection>

            <AssessmentSection icon={ClipboardList} title="Physical Function & Performance">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AssessmentInfoRow
                  label="Dyspnea Score"
                  value={physicalFunction.dyspneaScore}
                />
                <AssessmentInfoRow label="Balance Score" value={physicalFunction.balanceScore} />
                <AssessmentInfoRow label="IPAQ Score" value={physicalFunction.ipaqScore} />
                <AssessmentInfoRow
                  label="Sit-to-Stand Reps"
                  value={physicalFunction.sitToStandReps}
                />
                <AssessmentInfoRow label="6-Min Walk (m)" value={physicalFunction.sixMinuteWalk} />
                <AssessmentInfoRow label="SPPB Score" value={physicalFunction.sppbScore} />
                <AssessmentInfoRow
                  label="Grip Strength (Right)"
                  value={physicalFunction.gripStrengthRight}
                />
                <AssessmentInfoRow
                  label="Grip Strength (Left)"
                  value={physicalFunction.gripStrengthLeft}
                />
              </div>
            </AssessmentSection>

            <AssessmentSection icon={FileText} title="Mental, Cognitive & Fatigue">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AssessmentInfoRow label="MoCA Score" value={mentalCognitive.mocaScore} />
                <AssessmentInfoRow
                  label="Fatigue Severity"
                  value={mentalCognitive.fatigueSeverityScale}
                />
                <AssessmentInfoRow
                  label="FACIT Fatigue"
                  value={mentalCognitive.facitFatigueScale}
                />
                <AssessmentInfoRow
                  label="Chalder Fatigue"
                  value={mentalCognitive.chalderFatigueScale}
                />
                <AssessmentInfoRow label="GAD-7" value={mentalCognitive.gad7Score} />
                <AssessmentInfoRow label="HADS Anxiety" value={mentalCognitive.hadsAnxietyScore} />
                <AssessmentInfoRow
                  label="HADS Depression"
                  value={mentalCognitive.hadsDepressionScore}
                />
                <AssessmentInfoRow label="Beck Score" value={mentalCognitive.beckScore} />
                <AssessmentInfoRow label="IES-R" value={mentalCognitive.iesrScore} />
              </div>
            </AssessmentSection>

            <AssessmentSection icon={FileText} title="Visit Notes">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AssessmentInfoRow
                  label="Visit Date/Time"
                  value={visitDateTimeValue}
                />
                <AssessmentInfoRow label="Location" value={locationValue} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Patient Concerns</div>
                <div className="text-sm whitespace-pre-wrap">
                  {patientConcernsValue ?? 'Not recorded'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">VHV Observations</div>
                <div className="text-sm whitespace-pre-wrap">
                  {vhvObservationsValue ?? 'Not recorded'}
                </div>
              </div>
            </AssessmentSection>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AssessmentSection({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon
  title: string
  children: ReactNode
}) {
  return (
    <div className="rounded-lg border bg-muted/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <div className="text-sm font-medium">{title}</div>
      </div>
      <div className="space-y-3 text-sm">{children}</div>
    </div>
  )
}

function AssessmentInfoRow({ label, value }: { label: string; value?: string | number | null }) {
  const normalized = displayValue(value)
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">
        {normalized !== undefined ? String(normalized) : 'Not recorded'}
      </div>
    </div>
  )
}

export default function PatientHistoryPage({ params }: { params: ParamsMaybePromise }) {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-6">Loading history...</div>}>
      <HistoryContent params={params} />
    </Suspense>
  )
}
