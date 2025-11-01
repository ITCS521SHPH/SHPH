"use client"

import { Suspense, use as usePromise, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { PatientTaskResults } from '@/components/doctor/task-results'

type ParamsMaybePromise = { id: string } | Promise<{ id: string }>

function isThenable(v: any): v is Promise<any> {
  return v && typeof v.then === 'function'
}

function HistoryContent({ params }: { params: ParamsMaybePromise }) {
  const router = useRouter()
  const sp = useSearchParams()
  const patientId = isThenable(params) ? (usePromise(params) as { id: string }).id : (params as any).id
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [records, setRecords] = useState<any[]>([])
  const [patient, setPatient] = useState<any>(null)
  const [riskLevel, setRiskLevel] = useState<'LOW'|'MEDIUM'|'HIGH'>('LOW')
  const [summaries, setSummaries] = useState<{ allergies?: string|null, chronicConditions?: string[] }>({})

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
      setPatient(data.patient)
      setRiskLevel(data.riskLevel || 'LOW')
      setSummaries(data.summaries || {})
      setRecords(data.records || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const riskBadgeVariant = useMemo(() => {
    switch (riskLevel) {
      case 'HIGH': return 'destructive'
      case 'MEDIUM': return 'secondary'
      default: return 'default'
    }
  }, [riskLevel]) as any

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="font-medium">{patient.firstName} {patient.lastName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Risk Level</div>
                <Badge variant={riskBadgeVariant}>{riskLevel}</Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Allergies</div>
                <div className="font-medium">{summaries.allergies || 'None reported'}</div>
              </div>
              <div className="md:col-span-3">
                <div className="text-sm text-muted-foreground">Chronic Conditions</div>
                <div className="font-medium">{(summaries.chronicConditions || []).join(', ') || 'None'}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No patient loaded</div>
          )}
        </CardContent>
      </Card>

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
          {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}
          {!loading && !error && records.length === 0 && (
            <div className="text-sm text-muted-foreground">No records found.</div>
          )}
          <div className="space-y-3">
            {records.map((r) => (
              <div key={`${r.type}_${r.id}`} className="border rounded-md p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium capitalize">{r.type.replace('_', ' ')}</div>
                  <div className="text-xs text-muted-foreground">{new Date(r.date).toLocaleString()}</div>
                </div>
                <div className="mt-1 text-sm">{r.title}</div>
                {r.summary && <div className="text-sm text-muted-foreground mt-1">{r.summary}</div>}
                <div className="mt-2 flex gap-2">
                  {r.hasForm && <Badge variant="outline">Form Task</Badge>}
                  {r.priority && <Badge variant="secondary">Priority: {r.priority}</Badge>}
                  {r.approved && <Badge>Approved</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PatientHistoryPage({ params }: { params: ParamsMaybePromise }) {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-6">Loading history…</div>}>
      <HistoryContent params={params} />
    </Suspense>
  )
}
