import { NextRequest, NextResponse } from 'next/server'
import * as supabaseApi from '@/lib/supabase-api'

function parseDate(input?: string | null): Date | null {
  if (!input) return null
  const d = new Date(input)
  return isNaN(d.getTime()) ? null : d
}

function inRange(d: Date | undefined, from?: Date | null, to?: Date | null): boolean {
  if (!d) return false
  if (from && d < from) return false
  if (to && d > to) return false
  return true
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } },
) {
  try {
    const { id: patientId } = await (context as any).params
    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const from = parseDate(searchParams.get('from'))
    const to = parseDate(searchParams.get('to'))
    const q = (searchParams.get('q') || '').trim().toLowerCase()
    const priority = (searchParams.get('priority') || '').trim().toLowerCase()

    // Fetch core datasets in parallel
    const [patient, appointments, visits, medications, vitals, tasks, intakes, alerts] = await Promise.all([
      supabaseApi.getPatientById(patientId),
      supabaseApi.getPatientAppointments(patientId).catch(() => []),
      supabaseApi.getPatientVisits(patientId).catch(() => []),
      supabaseApi.getPatientMedications(patientId).catch(() => []),
      supabaseApi.getPatientVitalSigns(patientId).catch(() => []),
      supabaseApi.getTasksByPatient(patientId).catch(() => []),
      supabaseApi.getIntakes(patientId).catch(() => []),
      supabaseApi.getEmergencyAlertsByPatient(patientId).catch(() => []),
    ])

    // Only approved intake submissions
    const approvedIntakes = (intakes || []).filter((i: any) => (i.status || '').toString() === 'APPROVED')

    // Compute risk level: simple heuristic
    // High if allergies present, chronic/medical condition present, or recent approved intake with risk flag
    const hasAllergies = !!(patient as any)?.allergies || !!(patient as any)?.medicalHistory
    const hasMedicalCondition = !!(patient as any)?.medicalCondition
    const latestApprovedIntake = approvedIntakes
      .slice()
      .sort((a: any, b: any) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))[0]
    const intakeHasChronic = !!(latestApprovedIntake?.payload?.riskFlags?.hasChronic)
    const riskLevel = ((): 'LOW' | 'MEDIUM' | 'HIGH' => {
      if (hasAllergies || hasMedicalCondition || intakeHasChronic) return 'HIGH'
      return 'LOW'
    })()

    // Helpers for cleaning embedded schemas from task descriptions
    const stripFormSchema = (text?: string) => {
      if (!text) return ''
      try {
        return text.replace(/<FORM_SCHEMA>[\s\S]*?<\/FORM_SCHEMA>/gi, '').trim()
      } catch {
        return text
      }
    }
    const extractFormSummary = (text?: string) => {
      if (!text) return ''
      try {
        const m = text.match(/<FORM_SCHEMA>([\s\S]*?)<\/FORM_SCHEMA>/i)
        if (m && m[1]) {
          const parsed = JSON.parse(m[1].trim())
          const qs = Array.isArray(parsed?.questions) ? parsed.questions : []
          if (qs.length > 0 && qs[0]?.text) return `Form: ${qs[0].text}`
          if (qs.length > 0) return `Form with ${qs.length} question${qs.length > 1 ? 's' : ''}`
          return 'Form task'
        }
      } catch {
        // ignore parse errors
      }
      return ''
    }

    // Normalize to unified records
    type Rec = {
      id: string
      type: string
      date: string
      title: string
      summary?: string
      priority?: 'low' | 'medium' | 'high' | 'urgent'
      approved?: boolean
      hasForm?: boolean
    }

    const records: Rec[] = []

    for (const a of appointments || []) {
      const date = (a as any).scheduledDate || (a as any).createdAt
      records.push({
        id: (a as any).id,
        type: 'appointment',
        date: new Date(date).toISOString(),
        title: 'Appointment',
        summary: (a as any).reason || (a as any).notes || '',
      })
    }
    for (const v of visits || []) {
      const dt = (v as any).visitDate || (v as any).createdAt
      records.push({
        id: (v as any).id,
        type: 'visit',
        date: new Date(dt).toISOString(),
        title: `Visit (${(v as any).visitType || 'routine'})`,
        summary: (v as any).notes || '',
      })
    }
    for (const m of medications || []) {
      const dt = (m as any).startDate || (m as any).createdAt
      const end = (m as any).endDate ? ` until ${(m as any).endDate}` : ''
      records.push({
        id: (m as any).id,
        type: 'medication',
        date: new Date(dt).toISOString(),
        title: (m as any).name || 'Medication',
        summary: `${(m as any).dosage || ''} ${(m as any).frequency || ''}${end}`.trim(),
      })
    }
    for (const vs of vitals || []) {
      const dt = (vs as any).recordedAt || (vs as any).createdAt
      const parts: string[] = []
      if ((vs as any).temperature != null) parts.push(`Temp: ${(vs as any).temperature}`)
      if ((vs as any).heartRate != null) parts.push(`HR: ${(vs as any).heartRate}`)
      if ((vs as any).bloodPressureSystolic != null && (vs as any).bloodPressureDiastolic != null) {
        parts.push(`BP: ${(vs as any).bloodPressureSystolic}/${(vs as any).bloodPressureDiastolic}`)
      }
      records.push({
        id: (vs as any).id,
        type: 'vital_signs',
        date: new Date(dt).toISOString(),
        title: 'Vital Signs',
        summary: parts.join(' | '),
      })
    }
    for (const t of tasks || []) {
      const dt = (t as any).createdAt
      const pr = ((t as any).priority || 'medium').toString().toLowerCase() as Rec['priority']
      const rawDesc = (t as any).description || ''
      const clean = stripFormSchema(rawDesc)
      const formNote = extractFormSummary(rawDesc)
      const hasForm = /<FORM_SCHEMA>[\s\S]*?<\/FORM_SCHEMA>/i.test(rawDesc)
      records.push({
        id: (t as any).id,
        type: 'task',
        date: new Date(dt).toISOString(),
        title: (t as any).title || 'Task',
        summary: (clean || formNote || '').trim(),
        priority: pr,
        hasForm,
      })
    }
    for (const s of approvedIntakes || []) {
      const dt = (s as any).createdAt
      const cc = (s as any).payload?.symptoms?.chiefComplaint
      records.push({
        id: (s as any).id,
        type: 'intake',
        date: new Date(dt).toISOString(),
        title: 'Approved Intake',
        summary: cc || 'Intake submission',
        approved: true,
      })
    }
    for (const e of alerts || []) {
      const dt = (e as any).createdAt
      const pr = ((e as any).priority || 'MEDIUM').toString().toLowerCase() as Rec['priority']
      records.push({
        id: (e as any).id,
        type: 'emergency_alert',
        date: new Date(dt).toISOString(),
        title: 'Emergency Alert',
        summary: (e as any).description || '',
        priority: pr,
      })
    }

    // Apply filters
    const fromDate = from || null
    const toDate = to || null
    const filtered = records.filter((r) => {
      const rd = new Date(r.date)
      if (!inRange(rd, fromDate, toDate)) return false
      if (q) {
        const hay = `${r.title} ${r.summary || ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (priority) {
        if (!r.priority || r.priority !== priority) return false
      }
      return true
    })

    return NextResponse.json({
      patient: patient || null,
      riskLevel,
      summaries: {
        allergies: (patient as any)?.allergies || null,
        chronicConditions:
          (latestApprovedIntake?.payload?.chronicConditions?.conditions || [])
            .map((c: any) => c?.condition || c)
            .filter(Boolean) || [],
      },
      records: filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    })
  } catch (error) {
    console.error('[doctor][history] Error:', error)
    return NextResponse.json({ error: 'Failed to load patient history' }, { status: 500 })
  }
}
