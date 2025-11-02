import { NextResponse } from "next/server"
import * as supabaseApi from "@/lib/supabase-api"
import type { Patient, IntakeSubmission, EmergencyAlert } from "@/lib/types"
import {
  MEDICAL_CONDITION_CATEGORIES,
  MEDICAL_CONDITION_CATEGORY_LOOKUP,
} from "@/lib/medical-condition-categories"
import type { MedicalConditionCategoryId } from "@/lib/medical-condition-categories"

const MS_PER_DAY = 1000 * 60 * 60 * 24
const RECENT_ALERT_WINDOW_DAYS = 30
const DEFAULT_DISTRICT = "Unassigned"

type DistrictRiskLevel = "LOW" | "MEDIUM" | "HIGH"

type RiskFactorKey =
  | "chronic_condition"
  | "structured_condition"
  | "condition_medium"
  | "recent_emergency"
  | "age_60_plus"
  | "pregnancy"
  | "allergies"

type PatientRisk = {
  riskLevel: DistrictRiskLevel
  riskScore: number
  factors: RiskFactorKey[]
}

type DistrictPatient = {
  id: string
  name: string
  riskLevel: PatientRisk["riskLevel"]
  riskScore: number
}

type DistrictConditionStat = {
  categoryId: MedicalConditionCategoryId
  label: string
  riskFlag: "HIGH" | "MEDIUM" | "LOW"
  count: number
  ratio: number
}

type DistrictAggregate = {
  district: string
  displayName: string
  totalPatients: number
  highRiskCount: number
  mediumRiskCount: number
  lowRiskCount: number
  riskScore: number
  factorCounts: Record<RiskFactorKey, number>
  conditionCounts: Partial<Record<MedicalConditionCategoryId, number>>
  patients: DistrictPatient[]
}

const factorKeys: RiskFactorKey[] = [
  "chronic_condition",
  "structured_condition",
  "condition_medium",
  "recent_emergency",
  "age_60_plus",
  "pregnancy",
  "allergies",
]

const FACTOR_LABELS: Record<RiskFactorKey, string> = {
  chronic_condition: "Chronic condition indicators",
  structured_condition: "High-risk condition category",
  condition_medium: "Elevated-risk condition category",
  recent_emergency: "Recent emergency alert",
  age_60_plus: "Age 60+",
  pregnancy: "Pregnancy",
  allergies: "Allergy notes",
}

const FACTOR_WEIGHTS: Record<RiskFactorKey, number> = {
  chronic_condition: 3,
  structured_condition: 4,
  condition_medium: 2,
  recent_emergency: 4,
  age_60_plus: 2,
  pregnancy: 3,
  allergies: 1,
}

const RISK_LEVEL_PRIORITY: Record<DistrictRiskLevel, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
}

const normalizeCategoryKey = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[\s\-\/]+/g, "_")

const resolveMedicalConditionCategory = (value?: string | null): MedicalConditionCategoryId | null => {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const directKey = trimmed as MedicalConditionCategoryId
  if (directKey in MEDICAL_CONDITION_CATEGORY_LOOKUP) {
    return directKey
  }

  const normalizedKey = normalizeCategoryKey(trimmed) as MedicalConditionCategoryId
  if (normalizedKey in MEDICAL_CONDITION_CATEGORY_LOOKUP) {
    return normalizedKey
  }

  const matchedByLabel = MEDICAL_CONDITION_CATEGORIES.find(
    (category) => category.label.toLowerCase() === trimmed.toLowerCase(),
  )
  if (matchedByLabel) {
    return matchedByLabel.id
  }

  return null
}

const toTitleCase = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")

const normalizeDistrict = (value?: string | null) => {
  if (!value || !value.trim()) {
    return {
      key: DEFAULT_DISTRICT.toLowerCase(),
      district: DEFAULT_DISTRICT,
      displayName: DEFAULT_DISTRICT,
    }
  }

  const trimmed = value.trim()
  const title = toTitleCase(trimmed)
  return {
    key: title.toLowerCase(),
    district: title,
    displayName: title,
  }
}

const sortByCreatedAtDesc = (a?: Date, b?: Date) => {
  const aTime = a instanceof Date ? a.getTime() : Number.NEGATIVE_INFINITY
  const bTime = b instanceof Date ? b.getTime() : Number.NEGATIVE_INFINITY
  return bTime - aTime
}

const buildLatestApprovedIntakeMap = (intakes: IntakeSubmission[]) => {
  const latest = new Map<string, IntakeSubmission>()
  const approved = intakes.filter((intake) => (intake.status || "").toString().toUpperCase() === "APPROVED")
  approved.sort((a, b) => sortByCreatedAtDesc(a.createdAt, b.createdAt))
  approved.forEach((intake) => {
    if (!latest.has(intake.patientId)) {
      latest.set(intake.patientId, intake)
    }
  })
  return latest
}

const buildRecentAlertsMap = (alerts: EmergencyAlert[]) => {
  const recent = new Map<string, EmergencyAlert[]>()
  if (!alerts || alerts.length === 0) {
    return recent
  }
  const cutoff = Date.now() - RECENT_ALERT_WINDOW_DAYS * MS_PER_DAY
  alerts.forEach((alert) => {
    const created = alert.createdAt instanceof Date ? alert.createdAt : new Date(alert.createdAt)
    if (!created || Number.isNaN(created.getTime())) {
      return
    }
    if (created.getTime() < cutoff) {
      return
    }
    const bucket = recent.get(alert.patientId) ?? []
    bucket.push(alert)
    recent.set(alert.patientId, bucket)
  })
  return recent
}

const computePatientRisk = (
  patient: Patient & { medicalHistory?: string | null; allergies?: string | null },
  intake?: IntakeSubmission,
  alerts?: EmergencyAlert[],
): PatientRisk => {
  const factors = new Set<RiskFactorKey>()

  const categoryId = (patient as any).medicalConditionCategory as string | null | undefined
  const notes =
    (patient as any).medicalConditionNotes ??
    (patient as any).medicalHistory ??
    (patient as any).medicalCondition ??
    null
  const categoryMeta =
    categoryId && MEDICAL_CONDITION_CATEGORY_LOOKUP[categoryId as keyof typeof MEDICAL_CONDITION_CATEGORY_LOOKUP]

  if (categoryMeta) {
    if (categoryMeta.riskFlag === "HIGH") {
      factors.add("structured_condition")
    } else if (categoryMeta.riskFlag === "MEDIUM") {
      factors.add("condition_medium")
    }
  }

  if (categoryId && ["CHRONIC", "CARDIOMETABOLIC", "RESPIRATORY"].includes(categoryId)) {
    factors.add("chronic_condition")
  }

  if (categoryId === "MATERNAL") {
    factors.add("pregnancy")
  }

  if (categoryId === "ELDERLY_FRAILTY") {
    factors.add("age_60_plus")
  }

  if (!categoryMeta && typeof notes === "string" && notes.trim().length > 0) {
    factors.add("chronic_condition")
  }

  if (typeof patient.allergies === "string" && patient.allergies.trim().length > 0) {
    factors.add("allergies")
  }

  const flags = intake?.payload?.riskFlags
  if (flags?.hasChronic) {
    factors.add("chronic_condition")
  }
  if (flags?.isAge60Plus) {
    factors.add("age_60_plus")
  }
  if (flags?.isPregnant) {
    factors.add("pregnancy")
  }

  if (alerts && alerts.length > 0) {
    factors.add("recent_emergency")
  }

  let score = 0
  factors.forEach((factor) => {
    score += FACTOR_WEIGHTS[factor] ?? 1
  })

  if (categoryMeta?.riskFlag === "HIGH" && score < 5) {
    score = 5
  } else if (categoryMeta?.riskFlag === "MEDIUM" && score < 2) {
    score = 2
  }

  const riskLevel: PatientRisk["riskLevel"] = score >= 5 ? "HIGH" : score >= 2 ? "MEDIUM" : "LOW"

  return {
    riskLevel,
    riskScore: score,
    factors: Array.from(factors),
  }
}

const finalizeDistrictAggregate = (aggregate: DistrictAggregate) => {
  const { highRiskCount, totalPatients } = aggregate
  const highRiskRatio = totalPatients > 0 ? highRiskCount / totalPatients : 0
  const riskLevel: DistrictRiskLevel =
    highRiskCount >= 10 || highRiskRatio >= 0.4 ? "HIGH" : highRiskRatio >= 0.2 ? "MEDIUM" : "LOW"

  const topFactors = Object.entries(aggregate.factorCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([factor, count]) => ({
      factor: factor as RiskFactorKey,
      label: FACTOR_LABELS[factor as RiskFactorKey],
      count,
    }))

  const highRiskPatients = aggregate.patients.filter((patient) => patient.riskLevel === "HIGH")
  const prioritizedPatients =
    highRiskPatients.length > 0 ? highRiskPatients : aggregate.patients.slice(0, 10 /* fallback scope */)

  const notablePatients = prioritizedPatients
    .slice()
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 3)

  const conditionBreakdown: DistrictConditionStat[] = Object.entries(aggregate.conditionCounts)
    .filter(([, count]) => typeof count === "number" && count > 0)
    .map(([categoryId, count]) => {
      const typedCategory = categoryId as MedicalConditionCategoryId
      const meta = MEDICAL_CONDITION_CATEGORY_LOOKUP[typedCategory as keyof typeof MEDICAL_CONDITION_CATEGORY_LOOKUP]
      return {
        categoryId: typedCategory,
        label: meta?.label ?? toTitleCase(categoryId.replace(/_/g, " ")),
        riskFlag: meta?.riskFlag ?? "LOW",
        count,
        ratio: aggregate.totalPatients > 0 ? count / aggregate.totalPatients : 0,
      }
    })
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return a.categoryId.localeCompare(b.categoryId)
    })

  const dominantCondition =
    conditionBreakdown.find((condition) => condition.categoryId !== "NONE") ?? conditionBreakdown[0] ?? null

  return {
    district: aggregate.district,
    displayName: aggregate.displayName,
    totalPatients: aggregate.totalPatients,
    highRiskCount: aggregate.highRiskCount,
    mediumRiskCount: aggregate.mediumRiskCount,
    lowRiskCount: aggregate.lowRiskCount,
    highRiskRatio,
    riskScore: aggregate.riskScore,
    riskLevel,
    topFactors,
    notablePatients,
    conditionBreakdown,
    dominantCondition,
  }
}

export async function GET() {
  try {
    const [patients, intakes, alerts] = await Promise.all([
      supabaseApi.getPatients(),
      supabaseApi.getIntakes(),
      supabaseApi.getEmergencyAlerts(),
    ])

    const patientList = Array.isArray(patients) ? patients : []
    const intakeList = Array.isArray(intakes) ? intakes : []
    const alertList = Array.isArray(alerts) ? alerts : []

    const latestIntakes = buildLatestApprovedIntakeMap(intakeList)
    const recentAlerts = buildRecentAlertsMap(alertList)

    const districtAggregates = new Map<string, DistrictAggregate>()

    const factorTotals: Record<RiskFactorKey, number> = {
      chronic_condition: 0,
      structured_condition: 0,
      condition_medium: 0,
      recent_emergency: 0,
      age_60_plus: 0,
      pregnancy: 0,
      allergies: 0,
    }

    const conditionTotals = new Map<
      string,
      {
        label: string
        riskFlag: "HIGH" | "MEDIUM" | "LOW"
        count: number
      }
    >()

    const totals = {
      totalPatients: patientList.length,
      withDistrict: 0,
      withoutDistrict: 0,
      highRisk: 0,
      mediumRisk: 0,
      lowRisk: 0,
    }

    patientList.forEach((patient) => {
      const latestIntake = latestIntakes.get(patient.id)
      const patientAlerts = recentAlerts.get(patient.id)
      const risk = computePatientRisk(patient, latestIntake, patientAlerts)

      const { key, district, displayName } = normalizeDistrict(patient.district)
      if (district === DEFAULT_DISTRICT) {
        totals.withoutDistrict += 1
      } else {
        totals.withDistrict += 1
      }

      const aggregate =
        districtAggregates.get(key) ??
        ({
          district,
          displayName,
          totalPatients: 0,
          highRiskCount: 0,
          mediumRiskCount: 0,
          lowRiskCount: 0,
      riskScore: 0,
      factorCounts: factorKeys.reduce((acc, factor) => {
        acc[factor] = 0
        return acc
      }, {} as Record<RiskFactorKey, number>),
      conditionCounts: {} as Partial<Record<MedicalConditionCategoryId, number>>,
      patients: [],
    } satisfies DistrictAggregate)

      aggregate.totalPatients += 1
      aggregate.riskScore += risk.riskScore
      aggregate.patients.push({
        id: patient.id,
        name:
          (patient as any).name ||
          [patient.firstName, patient.lastName].filter(Boolean).join(" ").trim() ||
          "Patient",
        riskLevel: risk.riskLevel,
        riskScore: risk.riskScore,
      })

      const rawConditionCategory = (patient as any).medicalConditionCategory as string | null | undefined
      const conditionCategory = resolveMedicalConditionCategory(rawConditionCategory ?? undefined)
      if (conditionCategory) {
        aggregate.conditionCounts[conditionCategory] = (aggregate.conditionCounts[conditionCategory] ?? 0) + 1
        const meta =
          MEDICAL_CONDITION_CATEGORY_LOOKUP[conditionCategory as keyof typeof MEDICAL_CONDITION_CATEGORY_LOOKUP]
        const existing =
          conditionTotals.get(conditionCategory) ??
          {
            label: meta?.label ?? toTitleCase(conditionCategory.replace(/_/g, " ").toLowerCase()),
            riskFlag: meta?.riskFlag ?? "LOW",
            count: 0,
          }
        existing.count += 1
        conditionTotals.set(conditionCategory, existing)
      }

      if (risk.riskLevel === "HIGH") {
        totals.highRisk += 1
        aggregate.highRiskCount += 1
        risk.factors.forEach((factor) => {
          aggregate.factorCounts[factor] = (aggregate.factorCounts[factor] ?? 0) + 1
          factorTotals[factor] = (factorTotals[factor] ?? 0) + 1
        })
      } else if (risk.riskLevel === "MEDIUM") {
        totals.mediumRisk += 1
      } else {
        totals.lowRisk += 1
      }

      districtAggregates.set(key, aggregate)
    })

    const districts = Array.from(districtAggregates.values()).map(finalizeDistrictAggregate)

    const sortedHotspots = districts
      .filter((district) => district.totalPatients > 0)
      .sort((a, b) => {
        const levelDiff = RISK_LEVEL_PRIORITY[b.riskLevel] - RISK_LEVEL_PRIORITY[a.riskLevel]
        if (levelDiff !== 0) return levelDiff
        if (b.highRiskRatio !== a.highRiskRatio) return b.highRiskRatio - a.highRiskRatio
        if (b.riskScore !== a.riskScore) return b.riskScore - a.riskScore
        return b.highRiskCount - a.highRiskCount
      })

    const hotspots = sortedHotspots.slice(0, 5)

    const conditionPriority: Record<"HIGH" | "MEDIUM" | "LOW", number> = {
      HIGH: 2,
      MEDIUM: 1,
      LOW: 0,
    }

    const conditionCategories = Array.from(conditionTotals.entries())
      .sort((a, b) => {
        if (b[1].count !== a[1].count) return b[1].count - a[1].count
        const priorityDiff = conditionPriority[b[1].riskFlag] - conditionPriority[a[1].riskFlag]
        if (priorityDiff !== 0) return priorityDiff
        return a[0].localeCompare(b[0])
      })
      .map(([categoryId, info]) => ({
        categoryId,
        label: info.label,
        riskFlag: info.riskFlag,
        count: info.count,
      }))

    const overallFactors = Object.entries(factorTotals)
      .filter(([, count]) => count > 0)
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1]
        const [aKey, bKey] = [a[0] as RiskFactorKey, b[0] as RiskFactorKey]
        const weightDiff = (FACTOR_WEIGHTS[bKey] ?? 0) - (FACTOR_WEIGHTS[aKey] ?? 0)
        if (weightDiff !== 0) return weightDiff
        return aKey.localeCompare(bKey)
      })
      .map(([factor, count]) => ({
        factor: factor as RiskFactorKey,
        label: FACTOR_LABELS[factor as RiskFactorKey],
        count,
      }))

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      factorLabels: FACTOR_LABELS,
      totals,
      hotspots,
      districts,
      overallFactors,
      conditionCategories,
      parameters: {
        factorWeights: FACTOR_WEIGHTS,
        recentAlertWindowDays: RECENT_ALERT_WINDOW_DAYS,
      },
    })
  } catch (error) {
    console.error("[doctor][district-risk] Failed to compute district risk", error)
    return NextResponse.json({ error: "Failed to compute district risk" }, { status: 500 })
  }
}
