export type MedicalConditionCategoryId =
  | "NONE"
  | "CHRONIC"
  | "CARDIOMETABOLIC"
  | "RESPIRATORY"
  | "MATERNAL"
  | "ELDERLY_FRAILTY"
  | "MOBILITY_DISABILITY"
  | "MENTAL_HEALTH"
  | "INFECTIOUS"
  | "OTHER"

export type MedicalConditionCategory = {
  id: MedicalConditionCategoryId
  label: string
  description: string
  riskFlag: "HIGH" | "MEDIUM" | "LOW"
  color: string
}

export const MEDICAL_CONDITION_CATEGORIES: MedicalConditionCategory[] = [
  {
    id: "NONE",
    label: "No ongoing condition",
    description: "Patient has no known chronic or ongoing condition at this time.",
    riskFlag: "LOW",
    color: "#94A3B8",
  },
  {
    id: "CHRONIC",
    label: "Chronic disease (general)",
    description: "Long-term conditions such as hypertension or diabetes requiring continuous management.",
    riskFlag: "HIGH",
    color: "#1D4ED8",
  },
  {
    id: "CARDIOMETABOLIC",
    label: "Cardiometabolic",
    description: "Heart disease, stroke history, kidney disease, or metabolic syndrome.",
    riskFlag: "HIGH",
    color: "#8B5CF6",
  },
  {
    id: "RESPIRATORY",
    label: "Respiratory",
    description: "Asthma, COPD, tuberculosis history, or other chronic lung conditions.",
    riskFlag: "HIGH",
    color: "#0EA5E9",
  },
  {
    id: "MATERNAL",
    label: "Pregnancy / maternal health",
    description: "Current pregnancy, postpartum complications, or high-risk maternal conditions.",
    riskFlag: "HIGH",
    color: "#EC4899",
  },
  {
    id: "ELDERLY_FRAILTY",
    label: "Elderly / frailty",
    description: "Age 60+ with frailty, fall risk, or daily living limitations.",
    riskFlag: "MEDIUM",
    color: "#F59E0B",
  },
  {
    id: "MOBILITY_DISABILITY",
    label: "Mobility or disability",
    description: "Mobility limitations, disabilities, or rehabilitation needs impacting daily care.",
    riskFlag: "MEDIUM",
    color: "#6366F1",
  },
  {
    id: "MENTAL_HEALTH",
    label: "Mental health",
    description: "Depression, anxiety, cognitive decline, or other behavioral health concerns.",
    riskFlag: "MEDIUM",
    color: "#22C55E",
  },
  {
    id: "INFECTIOUS",
    label: "Infectious disease follow-up",
    description: "Tuberculosis, HIV, dengue recovery, or other infectious disease monitoring.",
    riskFlag: "HIGH",
    color: "#EF4444",
  },
  {
    id: "OTHER",
    label: "Other condition",
    description: "Condition not covered above. Please document details in notes.",
    riskFlag: "MEDIUM",
    color: "#14B8A6",
  },
]

export const HIGH_RISK_MEDICAL_CATEGORY_IDS = new Set<MedicalConditionCategoryId>([
  "CHRONIC",
  "CARDIOMETABOLIC",
  "RESPIRATORY",
  "MATERNAL",
  "INFECTIOUS",
])

export const MEDICAL_CONDITION_CATEGORY_LOOKUP = MEDICAL_CONDITION_CATEGORIES.reduce<
  Record<MedicalConditionCategoryId, MedicalConditionCategory>
>((acc, category) => {
  acc[category.id] = category
  return acc
}, {} as any)

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/(^\w|\s\w)/g, (match) => match.toUpperCase())

export const formatMedicalConditionSummary = (
  category?: string | null,
  notes?: string | null,
): string => {
  const trimmedNotes = notes?.trim() || ""
  const key = category?.trim() as MedicalConditionCategoryId | undefined
  const lookup = key ? MEDICAL_CONDITION_CATEGORY_LOOKUP[key] : undefined
  const label =
    lookup?.label ||
    (category && category !== "NONE" ? toTitleCase(category) : "")

  if (label && trimmedNotes) {
    return `${label}: ${trimmedNotes}`
  }
  if (label) {
    return label
  }
  if (trimmedNotes) {
    return trimmedNotes
  }
  return "Not specified"
}

export const encodeMedicalConditionPayload = (
  category?: string | null,
  notes?: string | null,
): string | null => {
  const trimmedCategory = category?.trim() || ""
  const trimmedNotes = notes?.trim() || ""

  if (!trimmedCategory && !trimmedNotes) {
    return null
  }

  const payload = {
    category: trimmedCategory || null,
    notes: trimmedNotes || null,
  }

  try {
    return JSON.stringify(payload)
  } catch {
    return trimmedNotes || trimmedCategory || null
  }
}

export const decodeMedicalConditionPayload = (
  value?: string | null,
): { category: string | null; notes: string | null } => {
  if (!value) {
    return { category: null, notes: null }
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return { category: null, notes: null }
  }

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed)
      const category =
        typeof parsed?.category === "string" && parsed.category.trim().length > 0
          ? parsed.category.trim()
          : null
      const notes =
        typeof parsed?.notes === "string" && parsed.notes.trim().length > 0
          ? parsed.notes.trim()
          : null
      return { category, notes }
    } catch {
      // treat as plain string
    }
  }

  if (trimmed in MEDICAL_CONDITION_CATEGORY_LOOKUP) {
    return {
      category: trimmed as MedicalConditionCategoryId,
      notes: null,
    }
  }

  const normalized = trimmed.toUpperCase().replace(/\s+/g, "_")
  if (normalized in MEDICAL_CONDITION_CATEGORY_LOOKUP) {
    return {
      category: normalized as MedicalConditionCategoryId,
      notes: null,
    }
  }

  const matchedByLabel = MEDICAL_CONDITION_CATEGORIES.find(
    (category) => category.label.toLowerCase() === trimmed.toLowerCase(),
  )
  if (matchedByLabel) {
    return {
      category: matchedByLabel.id,
      notes: null,
    }
  }

  return { category: null, notes: trimmed }
}
