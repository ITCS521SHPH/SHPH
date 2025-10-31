"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

type Question = { id: string; text: string; type?: string; options?: string[] }

function extractFormSchema(description?: string): { questions: Question[] } | null {
  if (!description) return null
  try {
    const m = description.match(/<FORM_SCHEMA>([\s\S]*?)<\/FORM_SCHEMA>/i)
    if (m && m[1]) return JSON.parse(m[1].trim())
  } catch {
    // ignore
  }
  return null
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="mb-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 bg-muted rounded">
        <div className="h-2 bg-primary rounded" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

type TaskRow = {
  id: string
  title: string
  description: string
  status: string
  formResponse?: any
  district?: string
}

function buildAggregates(tasks: TaskRow[]) {
  type Agg = {
    type: "categorical" | "text" | "number"
    counts?: Record<string, number>
    samples?: string[]
    min?: number
    max?: number
    sum?: number
    n?: number
  }

  const byQuestion = new Map<string, Agg>()
  for (const t of tasks) {
    const schema = extractFormSchema(t.description)
    const qMap = new Map<string, Question>()
    if (schema?.questions) {
      for (const q of schema.questions) qMap.set(q.id, q)
    }
    const resp = t.formResponse || {}
    for (const key of Object.keys(resp)) {
      const q = qMap.get(key)
      const qText = (q?.text || key).toString()
      const val = resp[key]

      // Decide type
      const isNumber = typeof val === "number" || (typeof val === "string" && /^-?\d+(\.\d+)?$/.test(val))
      const isCategorical = !!(q?.options && q.options.length) || typeof val === "string"

      const current = byQuestion.get(qText)
      if (isNumber) {
        const num = typeof val === "number" ? val : parseFloat(val)
        const next: Agg = current || { type: "number", min: num, max: num, sum: 0, n: 0 }
        next.min = Math.min(next.min ?? num, num)
        next.max = Math.max(next.max ?? num, num)
        next.sum = (next.sum ?? 0) + num
        next.n = (next.n ?? 0) + 1
        next.type = "number"
        byQuestion.set(qText, next)
      } else if (isCategorical) {
        const label = String(val)
        const next: Agg = current || { type: "categorical", counts: {} }
        next.counts![label] = (next.counts![label] || 0) + 1
        next.type = "categorical"
        byQuestion.set(qText, next)
      } else {
        const text = typeof val === "string" ? val : JSON.stringify(val)
        const next: Agg = current || { type: "text", samples: [] }
        if (text && !next.samples!.includes(text)) next.samples!.push(text)
        next.type = "text"
        byQuestion.set(qText, next)
      }
    }
  }
  return byQuestion
}

export function PatientTaskResults({ patientId }: { patientId: string }) {
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/tasks?patientId=${patientId}`)
        if (!res.ok) throw new Error("Failed to load tasks")
        const data = await res.json()
        const rows: TaskRow[] = (data || [])
          .filter((t: any) => t && t.status === "completed" && t.formResponse)
          .map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description || "",
            status: t.status,
            formResponse: t.formResponse,
          }))
        setTasks(rows)
      } catch (e: any) {
        setError(e?.message || "Failed to load tasks")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [patientId])

  const aggregates = useMemo(() => buildAggregates(tasks), [tasks])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Results</CardTitle>
        <CardDescription>Submissions from VHVs for this patient</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {!loading && !error && tasks.length === 0 && (
          <div className="text-sm text-muted-foreground">No submitted results yet.</div>
        )}
        {!loading && !error && tasks.length > 0 && (
          <div className="space-y-6">
            <div className="text-xs text-muted-foreground">{tasks.length} completed task(s)</div>
            {[...aggregates.entries()].map(([qText, agg]) => {
              if (agg.type === "categorical") {
                const counts = agg.counts || {}
                const max = Math.max(...Object.values(counts))
                return (
                  <div key={qText}>
                    <div className="font-medium mb-2">{qText}</div>
                    {Object.entries(counts).map(([label, count]) => (
                      <Bar key={label} label={label} value={count} max={max} />
                    ))}
                    <Separator className="my-2" />
                  </div>
                )
              }
              if (agg.type === "number") {
                const avg = (agg.sum ?? 0) / (agg.n || 1)
                return (
                  <div key={qText}>
                    <div className="font-medium mb-1">{qText}</div>
                    <div className="text-sm text-muted-foreground">Avg {avg.toFixed(1)} · Min {agg.min} · Max {agg.max}</div>
                    <Separator className="my-2" />
                  </div>
                )
              }
              const samples = (agg.samples || []).slice(0, 3)
              return (
                <div key={qText}>
                  <div className="font-medium mb-1">{qText}</div>
                  {samples.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No responses</div>
                  ) : (
                    <ul className="list-disc pl-5 text-sm">
                      {samples.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  )}
                  <Separator className="my-2" />
                </div>
              )
            })}

            <div>
              <div className="font-medium mb-2">Submissions</div>
              <div className="space-y-2">
                {tasks.map((t) => {
                  const schema = extractFormSchema(t.description)
                  const qMap = new Map<string, string>()
                  if (schema?.questions) schema.questions.forEach((q) => qMap.set(q.id, q.text))
                  return (
                  <div key={t.id} className="border rounded p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{t.title}</div>
                      <Badge variant="secondary">Completed</Badge>
                    </div>
                    <div className="mt-2 grid gap-1">
                      {Object.entries(t.formResponse || {}).map(([k, v]) => {
                        const label = qMap.get(String(k)) || String(k)
                        return (
                          <div key={k} className="text-sm text-muted-foreground">
                            <span className="font-medium">{label}:</span> {String(v)}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )})}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function AreaTaskResults({ doctorId }: { doctorId: string }) {
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/area-tasks?doctorId=${doctorId}`)
        if (!res.ok) throw new Error("Failed to load area tasks")
        const data = await res.json()
        const rows: TaskRow[] = (data || [])
          .filter((t: any) => t && t.status === "completed" && t.formResponse)
          .map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description || "",
            status: t.status,
            formResponse: t.formResponse,
            district: t.district,
          }))
        setTasks(rows)
      } catch (e: any) {
        setError(e?.message || "Failed to load area tasks")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [doctorId])

  const aggregatesByDistrict = useMemo(() => {
    const map = new Map<string, ReturnType<typeof buildAggregates>>()
    const byDistrict = new Map<string, TaskRow[]>()
    for (const t of tasks) {
      const key = t.district || "(Unknown district)"
      const arr = byDistrict.get(key) || []
      arr.push(t)
      byDistrict.set(key, arr)
    }
    for (const [district, arr] of byDistrict.entries()) {
      map.set(district, buildAggregates(arr))
    }
    return map
  }, [tasks])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Area Task Results</CardTitle>
        <CardDescription>Aggregated submissions by district</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {!loading && !error && tasks.length === 0 && (
          <div className="text-sm text-muted-foreground">No area task results yet.</div>
        )}
        {!loading && !error && tasks.length > 0 && (
          <div className="space-y-8">
            {[...aggregatesByDistrict.entries()].map(([district, aggs]) => (
              <div key={district}>
                <div className="font-medium mb-2">{district}</div>
                {[...aggs.entries()].map(([qText, agg]) => {
                  if (agg.type === "categorical") {
                    const counts = agg.counts || {}
                    const max = Math.max(...Object.values(counts))
                    return (
                      <div key={qText} className="mb-3">
                        <div className="font-medium mb-1">{qText}</div>
                        {Object.entries(counts).map(([label, count]) => (
                          <Bar key={label} label={label} value={count} max={max} />
                        ))}
                      </div>
                    )
                  }
                  if (agg.type === "number") {
                    const avg = (agg.sum ?? 0) / (agg.n || 1)
                    return (
                      <div key={qText} className="mb-3">
                        <div className="font-medium mb-1">{qText}</div>
                        <div className="text-sm text-muted-foreground">Avg {avg.toFixed(1)} · Min {agg.min} · Max {agg.max}</div>
                      </div>
                    )
                  }
                  const samples = (agg.samples || []).slice(0, 2)
                  return (
                    <div key={qText} className="mb-3">
                      <div className="font-medium mb-1">{qText}</div>
                      {samples.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No responses</div>
                      ) : (
                        <ul className="list-disc pl-5 text-sm">
                          {samples.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                })}
                <Separator className="my-4" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
