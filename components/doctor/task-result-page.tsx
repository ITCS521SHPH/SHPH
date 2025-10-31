"use client"

import { use as usePromise, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart as RechartsBarChart,
  Bar as RechartsBar,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type ParamsMaybePromise = { id: string } | Promise<{ id: string }>

type QuestionMeta = {
  id: string
  label: string
  type?: string
  options?: string[]
}

type CategoricalAgg = {
  type: "categorical"
  counts: Record<string, number>
}

type NumericAgg = {
  type: "number"
  min: number
  max: number
  sum: number
  n: number
}

type TextAgg = {
  type: "text"
  samples: string[]
}

type Aggregate = CategoricalAgg | NumericAgg | TextAgg

const CHART_COLORS = [
  "#6366F1",
  "#F97316",
  "#10B981",
  "#EC4899",
  "#22D3EE",
  "#F59E0B",
  "#8B5CF6",
  "#14B8A6",
  "#F43F5E",
  "#3B82F6",
]

function isThenable(value: any): value is Promise<any> {
  return value && typeof value.then === "function"
}

function coerceDate(value: any): Date | null {
  if (!value) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function formatDate(value: any, options?: Intl.DateTimeFormatOptions) {
  const date = coerceDate(value)
  if (!date) return null
  const formatter = new Intl.DateTimeFormat(undefined, options ?? { dateStyle: "medium", timeStyle: "short" })
  return formatter.format(date)
}

function toTitleCase(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase())
}

function extractFormSchema(description?: string): { questions?: any[] } | null {
  if (!description) return null
  try {
    const match = description.match(/<FORM_SCHEMA>([\s\S]*?)<\/FORM_SCHEMA>/i)
    if (match && match[1]) {
      return JSON.parse(match[1].trim())
    }
  } catch (error) {
    console.error("[task-results] Failed to parse schema", error)
  }
  return null
}

function stripFormSchema(text?: string) {
  if (!text) return ""
  try {
    return text.replace(/<FORM_SCHEMA>[\s\S]*?<\/FORM_SCHEMA>/gi, "").trim()
  } catch {
    return text
  }
}

function toCleanString(value: any): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value.trim()
  return String(value)
}

function aggregateSubmissions(entries: any[], seedSchema?: { questions?: any[] }) {
  const metaById = new Map<string, QuestionMeta>()
  const order: string[] = []

  const registerMeta = (meta: QuestionMeta) => {
    const existing = metaById.get(meta.id)
    if (!existing) {
      metaById.set(meta.id, {
        id: meta.id,
        label: meta.label || meta.id,
        type: meta.type,
        options: meta.options ? [...new Set(meta.options.map(toCleanString))] : undefined,
      })
      order.push(meta.id)
    } else {
      if (!existing.label && meta.label) existing.label = meta.label
      if (!existing.type && meta.type) existing.type = meta.type
      if (meta.options && meta.options.length) {
        const set = new Set(existing.options || [])
        meta.options.forEach((opt) => set.add(toCleanString(opt)))
        existing.options = Array.from(set)
      }
    }
  }

  seedSchema?.questions?.forEach((q: any) => {
    registerMeta({
      id: String(q.id),
      label: toCleanString(q.text) || String(q.id),
      type: q.type,
      options: Array.isArray(q.options) ? q.options : undefined,
    })
  })

  entries.forEach((entry) => {
    const schema = extractFormSchema(entry?.description)
    schema?.questions?.forEach((q: any) => {
      registerMeta({
        id: String(q.id),
        label: toCleanString(q.text) || String(q.id),
        type: q.type,
        options: Array.isArray(q.options) ? q.options : undefined,
      })
    })
  })

  const aggregates = new Map<string, Aggregate>()

  const isNumeric = (value: any) => {
    if (typeof value === "number") return !Number.isNaN(value)
    if (typeof value === "string" && value.trim() !== "") {
      const n = Number(value)
      return !Number.isNaN(n)
    }
    return false
  }

  entries.forEach((entry) => {
    const responses = entry?.formResponse || {}
    for (const rawKey of Object.keys(responses)) {
      const key = String(rawKey)
      if (!metaById.has(key)) {
        registerMeta({ id: key, label: key })
      }

      const meta = metaById.get(key)!
      const value = responses[key]
      const hasOptions = Array.isArray(meta.options) && meta.options.length > 0
      const typeHint = meta.type ? meta.type.toLowerCase() : undefined
      const isCloseEnded = typeHint === "close" || hasOptions

      const existing = aggregates.get(key)

      if (!isCloseEnded && isNumeric(value)) {
        const num = typeof value === "number" ? value : Number(value)
        const next: NumericAgg =
          existing && existing.type === "number"
            ? (existing as NumericAgg)
            : { type: "number", min: num, max: num, sum: 0, n: 0 }
        next.min = Math.min(next.min ?? num, num)
        next.max = Math.max(next.max ?? num, num)
        next.sum += num
        next.n += 1
        aggregates.set(key, next)
        continue
      }

      if (isCloseEnded && (typeof value === "string" || Array.isArray(value))) {
        const next: CategoricalAgg =
          existing && existing.type === "categorical"
            ? (existing as CategoricalAgg)
            : { type: "categorical", counts: {} }
        if (!next.counts) {
          next.counts = {}
        }
        const addCount = (option: any) => {
          const label = toCleanString(option)
          if (!label) return
          next.counts[label] = (next.counts[label] || 0) + 1
        }
        if (Array.isArray(value)) {
          value.forEach(addCount)
        } else {
          addCount(value)
        }
        aggregates.set(key, next)
        continue
      }

      const next: TextAgg =
        existing && existing.type === "text"
          ? (existing as TextAgg)
          : { type: "text", samples: [] }
      if (!Array.isArray(next.samples)) {
        next.samples = []
      }
      const textValue = toCleanString(value)
      if (textValue && !next.samples.includes(textValue)) {
        next.samples.push(textValue)
      }
      aggregates.set(key, next)
    }
  })

  return { order, metaById, aggregates }
}

function dedupeAreaEntries(entries: any[]) {
  const byVhv = new Map<string, any>()
  const sorted = entries
    .slice()
    .sort((a, b) => {
      const ta = new Date(a?.completedAt || a?.updatedAt || a?.createdAt || 0).getTime()
      const tb = new Date(b?.completedAt || b?.updatedAt || b?.createdAt || 0).getTime()
      return tb - ta
    })

  for (const entry of sorted) {
    const key = String(entry?.vhvId || entry?.vhv_id || "unknown")
    if (!byVhv.has(key)) {
      byVhv.set(key, entry)
    }
  }

  return Array.from(byVhv.values())
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string | null }) {
  return (
    <div className="rounded-md border bg-card p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-lg font-semibold text-foreground">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  )
}

export default function TaskResultPage({ params }: { params: ParamsMaybePromise }) {
  const router = useRouter()
  const { id } = isThenable(params) ? (usePromise(params) as { id: string }) : (params as { id: string })

  const [task, setTask] = useState<any>(null)
  const [kind, setKind] = useState<"patient" | "area" | null>(null)
  const [related, setRelated] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartPreferences, setChartPreferences] = useState<Record<string, "pie" | "bar">>({})

  useEffect(() => {
    const loadTask = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/tasks/${id}`)
        if (!res.ok) {
          const message = await res.json().catch(() => ({ error: "Failed to load task" }))
          throw new Error(message.error || "Failed to load task")
        }
        const data = await res.json()
        setTask(data.task)
        setKind(data.kind)
      } catch (err: any) {
        setError(err?.message || "Failed to load task")
      } finally {
        setLoading(false)
      }
    }
    loadTask()
  }, [id])

  useEffect(() => {
    const loadRelated = async () => {
      if (!task) {
        setRelated([])
        return
      }

      try {
        let response: Response | null = null
        if (kind === "patient" && task.patientId) {
          response = await fetch(`/api/tasks?patientId=${task.patientId}`)
        } else if (kind === "area" && task.doctorId) {
          response = await fetch(`/api/area-tasks?doctorId=${task.doctorId}`)
        }

        if (!response || !response.ok) {
          setRelated([])
          return
        }

        const data = await response.json()
        const filtered = (data || [])
          .filter((entry: any) => entry && entry.id !== task.id)
          .filter((entry: any) => (entry.status || "").toString().toLowerCase() === "completed")
          .filter((entry: any) => entry.formResponse)
          .filter((entry: any) => (entry.title || "") === (task.title || ""))
          .filter((entry: any) => (kind === "area" ? (entry.district || "") === (task.district || "") : true))

        setRelated(kind === "area" ? dedupeAreaEntries(filtered) : filtered)
      } catch (err) {
        console.error("[task-results] Failed to load related submissions", err)
        setRelated([])
      }
    }

    loadRelated()
  }, [kind, task?.id, task?.patientId, task?.doctorId, task?.title, task?.district])

  const submissions = useMemo(() => {
    if (!task) return []
    if (kind === "area") {
      return dedupeAreaEntries([task, ...related])
    }
    return [task, ...related]
  }, [kind, task, related])

  const primarySchema = useMemo(() => extractFormSchema(task?.description), [task?.description])

  const { order, metaById, aggregates } = useMemo(
    () => aggregateSubmissions(submissions, primarySchema || undefined),
    [submissions, primarySchema],
  )

  const questionSummaries = useMemo(() => {
    return order.map((id) => ({
      id,
      meta: metaById.get(id) || { id, label: id },
      aggregate: aggregates.get(id),
    }))
  }, [order, metaById, aggregates])

  const submissionCount = submissions.length
  const isAreaTask = kind === "area"
  const questionCount = questionSummaries.length

  const answeredCount = useMemo(() => {
    return questionSummaries.reduce((total, item) => {
      const agg = item.aggregate
      if (!agg) return total
      if (agg.type === "categorical") {
        const countTotal = Object.values(agg.counts || {}).reduce((acc, value) => acc + value, 0)
        return countTotal > 0 ? total + 1 : total
      }
      if (agg.type === "number") {
        return agg.n > 0 ? total + 1 : total
      }
      if (agg.type === "text") {
        return (agg.samples || []).length > 0 ? total + 1 : total
      }
      return total
    }, 0)
  }, [questionSummaries])

  const uniqueResponderCount = useMemo(() => {
    const responders = new Set<string>()
    submissions.forEach((entry) => {
      const responderId = entry?.vhvId || entry?.vhv_id
      if (responderId) responders.add(String(responderId))
    })
    return responders.size
  }, [submissions])

  const lastSubmittedAt = useMemo(() => {
    const timestamps = submissions
      .map((entry) =>
        coerceDate(
          entry?.completedAt ||
            entry?.completed_at ||
            entry?.updatedAt ||
            entry?.updated_at ||
            entry?.createdAt ||
            entry?.created_at,
        ),
      )
      .filter(Boolean) as Date[]
    if (timestamps.length === 0) return null
    return timestamps.sort((a, b) => b.getTime() - a.getTime())[0]
  }, [submissions])

  const cleanedDescription = useMemo(
    () => (task?.description ? stripFormSchema(task.description) : ""),
    [task?.description],
  )

  const dueDateLabel = formatDate(task?.dueDate, { dateStyle: "medium" })
  const createdLabel = formatDate(task?.createdAt)
  const updatedLabel = formatDate(task?.updatedAt)
  const completedLabel = formatDate(task?.completedAt)
  const lastSubmittedLabel = lastSubmittedAt ? formatDate(lastSubmittedAt) : null

  const status = (task?.status || "").toString().toLowerCase()
  const statusLabel = status ? status.replace(/_/g, " ") : ""
  const statusBadgeVariant =
    status === "completed" ? "secondary" : status === "in_progress" ? "default" : "outline"

  const priority = (task?.priority || "").toString().toLowerCase()
  const priorityLabel = priority ? priority.replace(/_/g, " ") : ""
  const priorityBadgeVariant =
    priority === "urgent" ? "destructive" : priority === "high" ? "default" : priority === "medium" ? "secondary" : "outline"

  const typeBadgeLabel = kind ? (isAreaTask ? "Area Task" : "Patient Task") : ""

  const statusDisplay = statusLabel ? toTitleCase(statusLabel) : ""
  const priorityDisplay = priorityLabel ? toTitleCase(priorityLabel) : ""

  const summaryDetails = useMemo(() => {
    if (!task) return [] as Array<{ label: string; value: ReactNode; hint?: string }>
    const items: Array<{ label: string; value: ReactNode; hint?: string }> = []
    items.push({ label: "Task ID", value: task.id })
    if (isAreaTask) {
      items.push({ label: "District", value: task?.district || "—" })
    } else if (kind === "patient") {
      items.push({ label: "Patient ID", value: task?.patientId || "—" })
    }
    if (task?.vhvId) {
      items.push({ label: "Assigned VHV", value: task.vhvId })
    }
    if (task?.doctorId) {
      items.push({ label: "Doctor ID", value: task.doctorId })
    }
    if (createdLabel) {
      items.push({ label: "Created", value: createdLabel })
    }
    if (updatedLabel && updatedLabel !== createdLabel) {
      items.push({ label: "Last Updated", value: updatedLabel })
    }
    if (dueDateLabel) {
      items.push({ label: "Due Date", value: dueDateLabel })
    }
    if (completedLabel) {
      items.push({ label: "Completed", value: completedLabel })
    }
    if (lastSubmittedLabel) {
      items.push({ label: "Last Submission", value: lastSubmittedLabel })
    }
    return items
  }, [task, isAreaTask, kind, createdLabel, updatedLabel, dueDateLabel, completedLabel, lastSubmittedLabel])

  const coverage = questionCount > 0 ? Math.round((answeredCount / questionCount) * 100) : 0

  const statCards = useMemo(() => {
    const stats: Array<{ label: string; value: string; hint?: string | null }> = []
    stats.push({
      label: "Total Submissions",
      value: submissionCount.toString(),
      hint:
        uniqueResponderCount > 0
          ? `${uniqueResponderCount} unique VHV${uniqueResponderCount > 1 ? "s" : ""}`
          : null,
    })
    if (questionCount > 0) {
      stats.push({
        label: "Questions Answered",
        value: `${answeredCount}/${questionCount}`,
        hint: `${coverage}% coverage`,
      })
    }
    if (lastSubmittedLabel) {
      stats.push({
        label: "Last Submission",
        value: lastSubmittedLabel,
        hint: submissionCount > 1 ? "Most recent VHV entry" : null,
      })
    }
    if (status === "completed" && completedLabel) {
      stats.push({
        label: "Marked Completed",
        value: completedLabel,
        hint: "Task completion timestamp",
      })
    }
    return stats
  }, [
    submissionCount,
    uniqueResponderCount,
    questionCount,
    answeredCount,
    coverage,
    lastSubmittedLabel,
    status,
    completedLabel,
  ])

  const categoricalData = useMemo(() => {
    const map = new Map<
      string,
      {
        data: Array<{ option: string; count: number; pct: number; color: string }>
        total: number
      }
    >()
    questionSummaries.forEach(({ id, meta, aggregate }) => {
      if (!aggregate || aggregate.type !== "categorical") return
      const counts = aggregate.counts || {}
      const optionSource = meta.options || []
      const allOptions = Array.from(new Set([...optionSource, ...Object.keys(counts)]))
      const total = allOptions.reduce((acc, opt) => acc + (counts[opt] || 0), 0)
      const ordered = allOptions.sort(
        (a, b) => (counts[b] || 0) - (counts[a] || 0) || a.localeCompare(b),
      )
      const data = ordered.map((opt, idx) => ({
        option: opt,
        count: counts[opt] || 0,
        pct: total > 0 ? Math.round(((counts[opt] || 0) / total) * 100) : 0,
        color: CHART_COLORS[idx % CHART_COLORS.length],
      }))
      map.set(id, { data, total })
    })
    return map
  }, [questionSummaries])

  const getChartTypeForQuestion = (questionId: string, defaultType: "pie" | "bar" = "pie") =>
    chartPreferences[questionId] ?? defaultType

  const updateChartTypeForQuestion = (questionId: string, type: "pie" | "bar") => {
    setChartPreferences((prev) => {
      if (prev[questionId] === type) return prev
      return { ...prev, [questionId]: type }
    })
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Task Results</h1>
          <p className="text-sm text-muted-foreground">Review aggregated submissions and individual responses from VHVs.</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Back to tasks
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {status && <Badge variant={statusBadgeVariant}>{statusDisplay || status.toUpperCase()}</Badge>}
            {typeBadgeLabel && <Badge variant="outline">{typeBadgeLabel}</Badge>}
            {priorityDisplay && <Badge variant={priorityBadgeVariant}>{priorityDisplay}</Badge>}
            {isAreaTask && task?.district && <Badge variant="outline">District: {task.district}</Badge>}
            {questionCount > 0 && <Badge variant="outline">Questions: {questionCount}</Badge>}
            <Badge variant="outline">Submissions: {submissionCount}</Badge>
            {uniqueResponderCount > 0 && <Badge variant="outline">Responders: {uniqueResponderCount}</Badge>}
          </div>
          <div>
            <CardTitle>{task?.title || "Task"}</CardTitle>
            <CardDescription>
              {isAreaTask
                ? "Aggregated area task insights from village health volunteers."
                : "Aggregated patient task insights from village health volunteers."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {cleanedDescription && <p className="text-sm text-muted-foreground max-w-3xl">{cleanedDescription}</p>}

          {summaryDetails.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Task Overview</div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {summaryDetails.map((item) => (
                  <div key={item.label} className="rounded-md border bg-muted/40 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</div>
                    <div className="mt-1 text-sm font-medium text-foreground">{item.value}</div>
                    {item.hint ? <div className="text-xs text-muted-foreground mt-1">{item.hint}</div> : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && !error && statCards.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Highlights</div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => (
                  <StatCard key={stat.label} label={stat.label} value={stat.value} hint={stat.hint} />
                ))}
              </div>
            </div>
          )}

          {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}

          {!loading && !error && (
            <div className="space-y-4">
              <Separator />
              <div>
                <h3 className="text-lg font-semibold">Question Responses</h3>
                <p className="text-sm text-muted-foreground">
                  {questionSummaries.length > 0
                    ? "Responses are listed below in the same order as the task form."
                    : "No questionnaire items were configured for this task."}
                </p>
              </div>

              {questionSummaries.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                  This task did not include form questions.
                </div>
              ) : (
                <div className="space-y-4">
                  {questionSummaries.map(({ id, meta, aggregate }) => {
                    const questionType = (meta.type || aggregate?.type || "").toString().toLowerCase()
                    const typeBadge = aggregate
                      ? aggregate.type === "categorical"
                        ? "Multiple Choice"
                        : aggregate.type === "number"
                          ? "Numeric"
                          : aggregate.type === "text"
                            ? "Text"
                            : questionType
                            ? toTitleCase(questionType)
                            : "Response"
                      : questionType
                      ? toTitleCase(questionType)
                      : "Response"

                    if (!aggregate) {
                      return (
                        <div key={id} className="rounded-lg border p-4">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-medium">{meta.label}</div>
                            <Badge variant="outline">{typeBadge}</Badge>
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">No responses yet.</div>
                        </div>
                      )
                    }

                    if (aggregate.type === "categorical") {
                      const categorical = categoricalData.get(id)
                      const hasData = categorical && categorical.total > 0
                      const chartType = getChartTypeForQuestion(id, "pie")

                      return (
                        <div key={id} className="rounded-lg border p-4 space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="font-medium">{meta.label}</div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">Multiple Choice</Badge>
                              {hasData && (
                                <div className="flex items-center gap-2">
                                  <Label
                                    htmlFor={`chart-type-${id}`}
                                    className="text-xs uppercase tracking-wide text-muted-foreground"
                                  >
                                    Chart
                                  </Label>
                                  <Select
                                    value={chartType}
                                    onValueChange={(value) => updateChartTypeForQuestion(id, value as "pie" | "bar")}
                                  >
                                    <SelectTrigger id={`chart-type-${id}`} className="h-8 w-36">
                                      <SelectValue placeholder="Chart type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pie">Pie chart</SelectItem>
                                      <SelectItem value="bar">Bar chart</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                          </div>

                          {!hasData ? (
                            <div className="text-sm text-muted-foreground">No responses yet.</div>
                          ) : (
                            <>
                              {chartType === "bar" ? (
                                <div className="h-[300px] w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <RechartsBarChart
                                      data={categorical!.data}
                                      margin={{ top: 16, right: 24, left: 0, bottom: 24 }}
                                    >
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="option" />
                                      <YAxis allowDecimals={false} />
                                      <Tooltip
                                        formatter={(value: number, _name, payload: any) => [
                                          `${value} responses`,
                                          payload?.payload?.option,
                                        ]}
                                      />
                                      <RechartsBar dataKey="count" radius={[6, 6, 0, 0]}>
                                        {categorical!.data.map((entry) => (
                                          <Cell key={entry.option} fill={entry.color} />
                                        ))}
                                      </RechartsBar>
                                    </RechartsBarChart>
                                  </ResponsiveContainer>
                                </div>
                              ) : (
                                <div className="h-[280px] w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={categorical!.data}
                                        dataKey="count"
                                        nameKey="option"
                                        innerRadius={60}
                                        outerRadius={110}
                                        paddingAngle={2}
                                        cornerRadius={6}
                                      >
                                        {categorical!.data.map((entry) => (
                                          <Cell key={entry.option} fill={entry.color} />
                                        ))}
                                      </Pie>
                                      <Tooltip
                                        formatter={(value: number, _name, payload: any) => [
                                          `${value} responses`,
                                          payload?.payload?.option,
                                        ]}
                                      />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                              )}

                              <div className="grid gap-2 sm:grid-cols-2">
                                {categorical!.data.map((item) => (
                                  <div
                                    key={item.option}
                                    className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2 text-sm"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                                      <span className="font-medium">{item.option}</span>
                                    </div>
                                    <span className="text-muted-foreground">
                                      {item.count} ({item.pct}%)
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )
                    }

                    if (aggregate.type === "number") {
                      const avg = aggregate.n > 0 ? aggregate.sum / aggregate.n : 0
                      const chartData = [
                        { label: "Minimum", value: Number.isFinite(aggregate.min) ? aggregate.min : 0 },
                        { label: "Average", value: Number.isFinite(avg) ? Number(avg.toFixed(2)) : 0 },
                        { label: "Maximum", value: Number.isFinite(aggregate.max) ? aggregate.max : 0 },
                      ]
                      const values = chartData.map((item) => item.value)
                      const minValue = Math.min(...values, 0)
                      const maxValue = Math.max(...values, 0)
                      const domain: [number, number] =
                        minValue === maxValue
                          ? [minValue - 1, maxValue + 1]
                          : [Math.min(minValue, 0), Math.max(maxValue, 0)]

                      return (
                        <div key={id} className="rounded-lg border p-4 space-y-4">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-medium">{meta.label}</div>
                            <Badge variant="outline">Numeric</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Responses captured from {aggregate.n} submission{aggregate.n === 1 ? "" : "s"}.
                          </div>
                          <div className="h-[260px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsBarChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 16 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="label" />
                                <YAxis domain={domain} />
                                <Tooltip formatter={(value: number) => [value, "Value"]} />
                                <RechartsBar dataKey="value" radius={[6, 6, 0, 0]}>
                                  {chartData.map((item, index) => (
                                    <Cell key={item.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                  ))}
                                </RechartsBar>
                              </RechartsBarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )
                    }

                    const samples = (aggregate.samples || []).slice(0, 8)
                    return (
                      <div key={id} className="rounded-lg border p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium">{meta.label}</div>
                          <Badge variant="outline">Text</Badge>
                        </div>
                        {samples.length === 0 ? (
                          <div className="text-sm text-muted-foreground">No responses yet.</div>
                        ) : (
                          <div className="space-y-2">
                            {samples.map((sample, idx) => (
                              <div key={idx} className="rounded-md border bg-muted/30 px-3 py-2 text-sm leading-relaxed">
                                {sample}
                              </div>
                            ))}
                            {aggregate.samples.length > samples.length ? (
                              <div className="text-xs text-muted-foreground">
                                Showing {samples.length} of {aggregate.samples.length} unique responses.
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
