"use client"

import dynamic from "next/dynamic"
import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowUpDown, RefreshCcw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { getDistrictAnchor } from "@/lib/district-geo"
import {
  MEDICAL_CONDITION_CATEGORIES,
  MEDICAL_CONDITION_CATEGORY_LOOKUP,
  type MedicalConditionCategoryId,
} from "@/lib/medical-condition-categories"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type DistrictRiskLevel = "LOW" | "MEDIUM" | "HIGH"

type DistrictRiskFactor = {
  factor: string
  label: string
  count: number
}

type DistrictPatientSummary = {
  id: string
  name: string
  riskLevel: DistrictRiskLevel
  riskScore: number
}

type DistrictConditionStat = {
  categoryId: MedicalConditionCategoryId
  label: string
  riskFlag: "HIGH" | "MEDIUM" | "LOW"
  count: number
  ratio: number
}

type DistrictSummary = {
  district: string
  displayName: string
  totalPatients: number
  highRiskCount: number
  mediumRiskCount: number
  lowRiskCount: number
  highRiskRatio: number
  riskScore: number
  riskLevel: DistrictRiskLevel
  topFactors: DistrictRiskFactor[]
  notablePatients: DistrictPatientSummary[]
  conditionBreakdown: DistrictConditionStat[]
  dominantCondition: DistrictConditionStat | null
}

type DistrictRiskResponse = {
  generatedAt: string
  factorLabels: Record<string, string>
  totals: {
    totalPatients: number
    withDistrict: number
    withoutDistrict: number
    highRisk: number
    mediumRisk: number
    lowRisk: number
  }
  hotspots: DistrictSummary[]
  districts: DistrictSummary[]
  overallFactors: DistrictRiskFactor[]
  conditionCategories: Array<{
    categoryId: string
    label: string
    riskFlag: "HIGH" | "MEDIUM" | "LOW"
    count: number
  }>
  parameters: {
    factorWeights: Record<string, number>
    recentAlertWindowDays: number
  }
}

type Props = {
  data: DistrictRiskResponse | null | undefined
  loading: boolean
  error: string | null
  onRetry: () => void
}

const RISK_BADGE_VARIANT: Record<DistrictRiskLevel, "destructive" | "secondary" | "outline"> = {
  HIGH: "destructive",
  MEDIUM: "secondary",
  LOW: "outline",
}

const FALLBACK_CONDITION_COLOR = "#94A3B8"

const CONDITION_COLOR_MAP: Record<MedicalConditionCategoryId, string> = MEDICAL_CONDITION_CATEGORIES.reduce(
  (acc, category) => {
    acc[category.id] = category.color
    return acc
  },
  {} as Record<MedicalConditionCategoryId, string>,
)

const getConditionColor = (categoryId: MedicalConditionCategoryId) =>
  CONDITION_COLOR_MAP[categoryId] ?? FALLBACK_CONDITION_COLOR

const RISK_LEVEL_COLORS: Record<DistrictRiskLevel, string> = {
  HIGH: "#DC2626",
  MEDIUM: "#F97316",
  LOW: "#22C55E",
}

const RISK_LEVEL_PRIORITY: Record<DistrictRiskLevel, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
}

const MapContainer: any = dynamic(async () => (await import("react-leaflet")).MapContainer as any, { ssr: false })
const TileLayer: any = dynamic(async () => (await import("react-leaflet")).TileLayer as any, { ssr: false })
const Circle: any = dynamic(async () => (await import("react-leaflet")).Circle as any, { ssr: false })
const Tooltip: any = dynamic(async () => (await import("react-leaflet")).Tooltip as any, { ssr: false })

const formatPercent = (ratio: number) => {
  if (!Number.isFinite(ratio) || ratio <= 0) return "0%"
  return `${Math.round(ratio * 100)}%`
}

const formatUpdatedAt = (timestamp?: string) => {
  if (!timestamp) return "-"
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString()
}

const riskLevelLabel = (level: DistrictRiskLevel) => {
  switch (level) {
    case "HIGH":
      return "High risk"
    case "MEDIUM":
      return "Elevated risk"
    default:
      return "Stable"
  }
}

const ConditionSegments = ({ breakdown }: { breakdown: DistrictConditionStat[] }) => {
  const segments = (breakdown ?? []).slice(0, 3)
  const hasMeaningfulData = segments.some((segment) => segment.count > 0)

  if (!hasMeaningfulData) {
    return <div className="h-2 rounded-full bg-muted/60" />
  }

  const fallbackGrow = segments.length > 0 ? 1 / segments.length : 1

  return (
    <div className="flex h-2 overflow-hidden rounded-full border border-border bg-muted/30">
      {segments.map((segment) => {
        const grow = segment.ratio > 0 ? segment.ratio : fallbackGrow
        return (
          <span
            key={segment.categoryId}
            className="h-full"
            style={{
              backgroundColor: getConditionColor(segment.categoryId),
              flexGrow: grow,
              flexBasis: 0,
            }}
            title={`${segment.label}: ${segment.count} patients`}
          />
        )
      })}
    </div>
  )
}

const ConditionChip = ({ condition }: { condition: DistrictConditionStat }) => (
  <span className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs">
    <span
      className="h-2 w-2 rounded-full"
      style={{ backgroundColor: getConditionColor(condition.categoryId) }}
      aria-hidden
    />
    <span className="font-medium text-foreground">{condition.label}</span>
    <span className="text-muted-foreground">{formatPercent(condition.ratio)}</span>
  </span>
)

const SortIndicator = ({
  active,
  direction,
}: {
  active: boolean
  direction: "asc" | "desc"
}) => {
  if (!active) {
    return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
  }
  return (
    <span className="text-[10px] font-semibold text-muted-foreground">
      {direction === "asc" ? "▲" : "▼"}
    </span>
  )
}

type SortField = "district" | "riskLevel" | "riskRatio" | "totalPatients"

const CONDITION_FILTER_OPTIONS: Array<{
  value: MedicalConditionCategoryId | "ALL"
  label: string
}> = [
  { value: "ALL", label: "All condition types" },
  ...MEDICAL_CONDITION_CATEGORIES.map((category) => ({
    value: category.id,
    label: category.label,
  })),
]

const LoadingState = () => (
  <Card>
    <CardHeader>
      <CardTitle>District risk overview</CardTitle>
      <CardDescription>Aggregating patient risk indicators...</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <div key={key} className="rounded-md border p-4">
            <div className="mb-2 h-4 w-24 animate-pulse bg-muted" />
            <div className="h-6 w-16 animate-pulse bg-muted" />
          </div>
        ))}
      </div>
      <div className="h-56 rounded-md border p-6">
        <div className="h-full w-full animate-pulse rounded-md bg-muted" />
      </div>
    </CardContent>
  </Card>
)

const EmptyState = ({ onRetry }: { onRetry: () => void }) => (
  <Card>
    <CardHeader>
      <CardTitle>District risk overview</CardTitle>
      <CardDescription>No risk signals detected yet.</CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col items-start gap-3">
      <p className="text-sm text-muted-foreground">
        Risk analytics will appear once patients have documented health risk indicators such as chronic conditions,
        emergencies, or intake submissions with flagged risk factors.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCcw className="mr-2 h-4 w-4" />
        Refresh now
      </Button>
    </CardContent>
  </Card>
)

const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <Card>
    <CardHeader>
      <CardTitle>District risk overview</CardTitle>
      <CardDescription>Unable to load risk analytics.</CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col items-start gap-3">
      <p className="text-sm text-red-600">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCcw className="mr-2 h-4 w-4" />
        Retry
      </Button>
    </CardContent>
  </Card>
)

const RiskSummaryCards = ({ data }: { data: DistrictRiskResponse }) => {
  const { conditionCategories = [] } = data
  const totalConditionPatients = conditionCategories.reduce((sum, condition) => sum + condition.count, 0)
  const topConditions = conditionCategories.slice(0, 3)

  if (topConditions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Condition insights</CardTitle>
          <CardDescription>Add patient condition data to see the dominant health concerns.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const rankLabels = ["Top condition type", "Second most common", "Third most common"]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {topConditions.map((condition, index) => {
        const share = totalConditionPatients > 0 ? Math.round((condition.count / totalConditionPatients) * 100) : null

        return (
          <Card key={condition.categoryId}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{rankLabels[index] ?? `Condition rank ${index + 1}`}</CardTitle>
              <Badge variant="secondary">#{index + 1}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{condition.count}</div>
              <p className="text-sm font-semibold">{condition.label}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {share !== null ? `${share}% of condition-tagged patients – ` : ""}
                {condition.riskFlag.toLowerCase()} priority
              </p>
              {share !== null && (
                <div className="mt-3">
                  <Progress value={Math.min(share, 100)} />
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
      {topConditions.length < 3 &&
        Array.from({ length: 3 - topConditions.length }).map((_, placeholderIndex) => (
          <Card key={`condition-placeholder-${placeholderIndex}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Awaiting more data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Capture additional patient condition notes to unlock this ranking.
              </p>
            </CardContent>
          </Card>
        ))}
    </div>
  )
}

const HotspotList = ({ hotspots }: { hotspots: DistrictSummary[] }) => {
  if (!hotspots || hotspots.length === 0) {
    return <p className="text-sm text-muted-foreground">No hotspot districts detected at this time.</p>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {hotspots.map((district) => (
        <Card key={district.district} className="border-primary/40 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">{district.displayName}</CardTitle>
              <Badge variant={RISK_BADGE_VARIANT[district.riskLevel]}>{riskLevelLabel(district.riskLevel)}</Badge>
            </div>
          <CardDescription>
            {district.highRiskCount} of {district.totalPatients} patients flagged - {formatPercent(district.highRiskRatio)} high risk
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Condition mix</p>
            <div className="mt-2 space-y-2">
              <ConditionSegments breakdown={district.conditionBreakdown ?? []} />
              <div className="flex flex-wrap gap-1.5">
                {district.conditionBreakdown.length === 0 ? (
                  <span className="text-xs text-muted-foreground">No documented condition types</span>
                ) : (
                  district.conditionBreakdown.slice(0, 3).map((condition) => (
                    <ConditionChip key={`${district.district}-${condition.categoryId}`} condition={condition} />
                  ))
                )}
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Leading high-risk factors</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {district.topFactors.length === 0 && (
                <span className="text-sm text-muted-foreground">None</span>
                )}
                {district.topFactors.map((factor) => (
                  <Badge key={factor.factor} variant="secondary">
                    {factor.label} - {factor.count}
                  </Badge>
                ))}
              </div>
            </div>
            {district.notablePatients.length > 0 && (
              <div>
                <p className="text-xs uppercase text-muted-foreground">Notable patients</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {district.notablePatients.map((patient) => (
                    <li key={patient.id} className="flex items-center justify-between">
                      <span>{patient.name}</span>
                      <span className="text-xs text-muted-foreground">None</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

const DistrictTable = ({ districts }: { districts: DistrictSummary[] }) => {
  const [sortField, setSortField] = useState<SortField>("riskLevel")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [conditionFilter, setConditionFilter] = useState<MedicalConditionCategoryId | "ALL">("ALL")

  if (!districts || districts.length === 0) {
    return <p className="text-sm text-muted-foreground">No district level records found.</p>
  }

  const filteredDistricts = useMemo(() => {
    if (conditionFilter === "ALL") {
      return districts
    }
    return districts.filter((district) =>
      (district.conditionBreakdown ?? []).some(
        (condition) => condition.categoryId === conditionFilter && condition.count > 0,
      ),
    )
  }, [districts, conditionFilter])

  const sortedDistricts = useMemo(() => {
    const copy = filteredDistricts.slice()
    copy.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case "district":
          comparison = a.displayName.localeCompare(b.displayName)
          break
        case "totalPatients":
          comparison = a.totalPatients - b.totalPatients
          break
        case "riskRatio":
          comparison = a.highRiskRatio - b.highRiskRatio
          break
        case "riskLevel":
        default:
          comparison = RISK_LEVEL_PRIORITY[a.riskLevel] - RISK_LEVEL_PRIORITY[b.riskLevel]
          if (comparison === 0) {
            comparison = a.highRiskRatio - b.highRiskRatio
          }
          break
      }
      return sortDirection === "asc" ? comparison : -comparison
    })
    return copy
  }, [filteredDistricts, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection(field === "district" ? "asc" : "desc")
    }
  }

  if (sortedDistricts.length === 0) {
    const selectedCategory =
      conditionFilter === "ALL"
        ? undefined
        : MEDICAL_CONDITION_CATEGORY_LOOKUP[conditionFilter as MedicalConditionCategoryId]
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>No districts match the selected filter.</span>
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setConditionFilter("ALL")}>
              Clear filter
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {selectedCategory
            ? `No districts currently track the condition type “${selectedCategory.label}”.`
            : "No districts available for the selected filters."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Filter by condition type:</span>
          <Select
            value={conditionFilter}
            onValueChange={(value) => setConditionFilter(value as MedicalConditionCategoryId | "ALL")}
          >
            <SelectTrigger className="h-8 w-[220px] text-xs">
              <SelectValue placeholder="All condition types" />
            </SelectTrigger>
            <SelectContent>
              {CONDITION_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-xs text-muted-foreground">
          Showing {sortedDistricts.length} of {districts.length} districts
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-xs uppercase text-muted-foreground">
              <th className="py-3 pr-4 text-left font-medium">#</th>
              <th className="py-3 pr-4 text-left font-medium">
                <button
                  type="button"
                  className="flex items-center gap-1 font-medium uppercase tracking-wide"
                  onClick={() => handleSort("district")}
                >
                  District
                  <SortIndicator active={sortField === "district"} direction={sortDirection} />
                </button>
              </th>
              <th className="py-3 pr-4 text-left font-medium">
                <button
                  type="button"
                  className="flex items-center gap-1 font-medium uppercase tracking-wide"
                  onClick={() => handleSort("riskLevel")}
                >
                  Risk level
                  <SortIndicator active={sortField === "riskLevel"} direction={sortDirection} />
                </button>
              </th>
              <th className="py-3 pr-4 text-right font-medium">
                <button
                  type="button"
                  className="flex items-center justify-end gap-1 font-medium uppercase tracking-wide"
                  onClick={() => handleSort("totalPatients")}
                >
                  Patients
                  <SortIndicator active={sortField === "totalPatients"} direction={sortDirection} />
                </button>
              </th>
              <th className="py-3 pr-4 text-right font-medium">
                <button
                  type="button"
                  className="flex items-center justify-end gap-1 font-medium uppercase tracking-wide"
                  onClick={() => handleSort("riskRatio")}
                >
                  Risk ratio
                  <SortIndicator active={sortField === "riskRatio"} direction={sortDirection} />
                </button>
              </th>
              <th className="py-3 pr-4 text-left font-medium">Condition mix</th>
              <th className="py-3 pr-4 text-left font-medium">Leading risk factors</th>
              <th className="py-3 pr-0 text-left font-medium">Notable patients</th>
            </tr>
          </thead>
          <tbody>
            {sortedDistricts.map((district, idx) => (
              <tr key={district.district} className="border-b last:border-b-0 align-top">
                <td className="py-3 pr-4 text-muted-foreground">{idx + 1}</td>
                <td className="py-3 pr-4 font-medium">{district.displayName}</td>
                <td className="py-3 pr-4">
                  <Badge variant={RISK_BADGE_VARIANT[district.riskLevel]}>{riskLevelLabel(district.riskLevel)}</Badge>
                </td>
                <td className="py-3 pr-4 text-right">{district.totalPatients}</td>
                <td className="py-3 pr-4 text-right">{formatPercent(district.highRiskRatio)}</td>
                <td className="py-3 pr-4">
                  <div className="space-y-2">
                    <ConditionSegments breakdown={district.conditionBreakdown ?? []} />
                    <div className="flex flex-wrap gap-1.5">
                      {district.conditionBreakdown.length === 0 ? (
                        <span className="text-xs text-muted-foreground">No documented condition types</span>
                      ) : (
                        district.conditionBreakdown.slice(0, 3).map((condition) => (
                          <ConditionChip key={`${district.district}-${condition.categoryId}`} condition={condition} />
                        ))
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex flex-wrap gap-2">
                    {district.topFactors.length === 0 && <span className="text-xs text-muted-foreground">None</span>}
                    {district.topFactors.map((factor) => (
                      <Badge key={factor.factor} variant="secondary">
                        {factor.label} - {factor.count}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="py-3 pr-0">
                  {district.notablePatients.length === 0 ? (
                    <span className="text-xs text-muted-foreground">None</span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {district.notablePatients.map((patient) => (
                        <Badge key={patient.id} variant="outline">
                          {patient.name} ({patient.riskScore})
                        </Badge>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const RiskHeatMap = ({ districts }: { districts: DistrictSummary[] }) => {
  const mapRef = useRef<any>(null)

  const points = useMemo(() => {
    if (!districts) return []
    return districts
      .map((district) => {
        const anchorTuple = getDistrictAnchor(district.district)
        if (!anchorTuple || anchorTuple.length !== 2) return null
        const [lat, lng] = anchorTuple
        return {
          district,
          anchor: { lat, lng },
        }
      })
      .filter(Boolean) as Array<{ district: DistrictSummary; anchor: { lat: number; lng: number } }>
  }, [districts])

  const center = useMemo(() => ({ lat: 13.7563, lng: 100.5018 }), [])

  useEffect(() => {
    const mapInstance = mapRef.current
    if (!mapInstance || points.length === 0) return
    const L = (window as any).L
    if (!L) return
    try {
      const bounds = new L.LatLngBounds(points.map((point) => point.anchor))
      mapInstance.fitBounds(bounds.pad(0.2), { maxZoom: 12 })
    } catch (error) {
      console.warn("Failed to fit map bounds for district risk map:", error)
    }
  }, [points])

  if (points.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No district coordinates available for risk map display.
      </p>
    )
  }

  const getRadius = (district: DistrictSummary) => {
    const base = 600
    const extra = Math.min(district.totalPatients, 40) * 40
    return base + extra
  }

  return (
    <div className="space-y-4">
      <div className="h-[360px] overflow-hidden rounded-md border">
        <MapContainer
          center={center}
          zoom={11}
          scrollWheelZoom={false}
          className="h-full w-full"
          whenCreated={(mapInstance: any) => {
            mapRef.current = mapInstance
          }}
          preferCanvas
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {points.map(({ district, anchor }) => {
              const color = RISK_LEVEL_COLORS[district.riskLevel]
              const breakdown = district.conditionBreakdown ?? []
              const topConditions = breakdown.slice(0, 3)

              return (
                <Circle
                  key={district.district}
                center={[anchor.lat, anchor.lng]}
                  radius={getRadius(district)}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.28,
                    weight: 1.25,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                    <div className="space-y-1.5 text-xs">
                      <p className="font-semibold">{district.displayName}</p>
                      <p>Risk level: {riskLevelLabel(district.riskLevel)}</p>
                      <p>
                        High-risk patients: {district.highRiskCount} ({formatPercent(district.highRiskRatio)})
                      </p>
                      <p>Total patients: {district.totalPatients}</p>
                      <div className="pt-1">
                        <ConditionSegments breakdown={breakdown} />
                      </div>
                      {topConditions.length > 0 && (
                        <div className="space-y-0.5">
                          {topConditions.map((condition) => (
                            <p key={`${district.district}-${condition.categoryId}`}>
                              {condition.label}: {condition.count}
                            {condition.ratio > 0 ? ` (${formatPercent(condition.ratio)})` : ""}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </Tooltip>
              </Circle>
              )
            })}
          </MapContainer>
        </div>
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {Object.entries(RISK_LEVEL_COLORS).map(([level, color]) => (
          <span key={level} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full border border-white/40 shadow" style={{ backgroundColor: color }} />
            <span className="text-foreground">{riskLevelLabel(level as DistrictRiskLevel)}</span>
          </span>
        ))}
      </div>
      <details className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
        <summary className="cursor-pointer text-sm font-medium text-foreground">Legend & Explanation</summary>
        <div className="mt-2 space-y-2">
          <p>Risk levels are assigned based on the share of high-risk patients per district:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>High risk: ≥ 40% high-risk patients or at least 10 high-risk cases.</li>
            <li>Medium risk: 20% – 39% high-risk patients.</li>
            <li>Low risk: &lt; 20% high-risk patients.</li>
          </ul>
          <p>Colour segments in each tooltip reflect the top three recorded condition types for that district.</p>
          <div className="flex flex-wrap gap-3 pt-1 text-xs">
            {MEDICAL_CONDITION_CATEGORIES.map((category) => (
              <span key={category.id} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full border border-white/40"
                  style={{ backgroundColor: category.color }}
                  aria-hidden
                />
                <span>{category.label}</span>
              </span>
            ))}
          </div>
        </div>
      </details>
    </div>
  )
}

export function DistrictRiskPanel({ data, loading, error, onRetry }: Props) {
  if (loading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />
  }

  if (!data) {
    return <EmptyState onRetry={onRetry} />
  }

  const conditionCategories = data.conditionCategories ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">District risk overview</h2>
          <p className="text-xs text-muted-foreground mt-3">Updated {formatUpdatedAt(data.generatedAt)}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh data
        </Button>
      </div>

      <RiskSummaryCards data={data} />

      <Card>
        <CardHeader>
          <CardTitle>District risk map</CardTitle>
          <CardDescription>Hover over each circle to see the dominant condition mix and risk drivers.</CardDescription>
        </CardHeader>
        <CardContent>
          <RiskHeatMap districts={data.districts} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Condition breakdown</CardTitle>
          <CardDescription>Most common recorded condition types among monitored patients.</CardDescription>
        </CardHeader>
        <CardContent>
          {conditionCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No patients have documented condition types yet.</p>
          ) : (
            <div className="space-y-3">
              {conditionCategories.slice(0, 6).map((condition) => (
                <div key={condition.categoryId} className="flex items-center justify-between rounded-md border p-2">
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full border border-white/40"
                      style={{
                        backgroundColor: getConditionColor(condition.categoryId as MedicalConditionCategoryId),
                      }}
                      aria-hidden
                    />
                    <div>
                      <p className="font-medium text-sm">{condition.label}</p>
                    <p className="text-xs text-muted-foreground capitalize">{condition.riskFlag.toLowerCase()} priority</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{condition.count} patients</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hotspot districts</CardTitle>
          <CardDescription>
            Prioritize awareness campaigns in districts with the highest concentration of at-risk patients.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HotspotList hotspots={data.hotspots} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>District details</CardTitle>
          <CardDescription>
            Full breakdown of patient counts, risk ratios, and dominant risk factors across each mapped district.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DistrictTable districts={data.districts} />
          <Separator />
          <p className="text-xs text-muted-foreground">
            Recent emergencies consider alerts in the past {data.parameters.recentAlertWindowDays} days. Risk scores weight
            chronic conditions and emergencies more heavily than age-based factors.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
