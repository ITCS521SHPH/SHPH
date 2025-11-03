import { NextRequest, NextResponse } from 'next/server'
import { supabaseApi } from '@/lib/supabase-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, vhvId } = body

    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId is required' },
        { status: 400 }
      )
    }

    const result = await supabaseApi.createIntake(patientId, vhvId)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Create intake error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create intake' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id') || undefined
    const patientId = searchParams.get('patientId') || undefined
    const vhvId = searchParams.get('vhvId') || undefined

    if (id) {
      const single = await supabaseApi.getIntakeById(id)
      if (!single) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      return NextResponse.json(single)
    }

    if (!patientId && !vhvId) {
      return NextResponse.json(
        { error: 'patientId or vhvId is required' },
        { status: 400 }
      )
    }

    const result = await supabaseApi.getIntakes(patientId, vhvId)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Get intakes error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get intakes' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...rawUpdate } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Intake ID is required' },
        { status: 400 }
      )
    }

    // If payload is not provided, map flat VHV form fields into the structured payload
    let updateData: any = { ...rawUpdate }

    const looksLikeFlatForm =
      !('payload' in rawUpdate) &&
      (
        'patientFullName' in rawUpdate ||
        'oxygenSaturation' in rawUpdate ||
        'bloodPressureSystolic' in rawUpdate ||
        'heartRate' in rawUpdate ||
        'patientConcerns' in rawUpdate ||
        'vhvObservations' in rawUpdate
      )

    if (looksLikeFlatForm) {
      const normalizeString = (value: unknown): string | undefined => {
        if (value === null || value === undefined) return undefined
        const text = String(value).trim()
        return text.length > 0 ? text : undefined
      }
      const normalizeNumber = (value: unknown): number | undefined => {
        if (value === null || value === undefined || value === '') return undefined
        const num = Number(value)
        return Number.isFinite(num) ? num : undefined
      }

      const [firstName, ...restLast] = (rawUpdate.patientFullName || '').toString().trim().split(' ')
      const lastName = restLast.join(' ').trim()

      const mappedPayload = {
        visitMeta: {
          visitDateTime: new Date().toISOString(),
          vhvId: undefined,
          locationText: '',
        },
        patientBasics: {
          firstName: (firstName || '').trim(),
          lastName: (lastName || '').trim(),
          dob: '',
          contactPhone: normalizeString((rawUpdate as any).contact) || '',
          hospitalNumber: normalizeString(rawUpdate.hospitalNumber),
        },
        symptoms: {
          chiefComplaint: normalizeString(rawUpdate.patientConcerns) || '',
        },
        vitals: {
          temp: normalizeNumber(rawUpdate.temperature),
          systolic: normalizeNumber(rawUpdate.bloodPressureSystolic),
          diastolic: normalizeNumber(rawUpdate.bloodPressureDiastolic),
          hr: normalizeNumber(rawUpdate.heartRate),
          spo2: normalizeNumber(rawUpdate.oxygenSaturation),
          glucose: normalizeNumber(rawUpdate.bloodGlucose),
        },
        assessments: {
          physicalFunction: {
            dyspneaScore: normalizeString((rawUpdate as any).dyspneaScore),
            balanceScore: normalizeString((rawUpdate as any).balanceScore),
            ipaqScore: normalizeString((rawUpdate as any).ipaqScore),
            sitToStandReps: normalizeString((rawUpdate as any).sitToStandReps),
            sixMinuteWalk: normalizeString((rawUpdate as any).sixMinuteWalk),
            sppbScore: normalizeString((rawUpdate as any).sppbScore),
            gripStrengthRight: normalizeString((rawUpdate as any).gripStrengthRight),
            gripStrengthLeft: normalizeString((rawUpdate as any).gripStrengthLeft),
          },
          mentalCognitive: {
            mocaScore: normalizeString((rawUpdate as any).mocaScore),
            fatigueSeverityScale: normalizeString((rawUpdate as any).fatigueSeverityScale),
            facitFatigueScale: normalizeString((rawUpdate as any).facitFatigueScale),
            chalderFatigueScale: normalizeString((rawUpdate as any).chalderFatigueScale),
            gad7Score: normalizeString((rawUpdate as any).gad7Score),
            hadsAnxietyScore: normalizeString((rawUpdate as any).hadsAnxietyScore),
            hadsDepressionScore: normalizeString((rawUpdate as any).hadsDepressionScore),
            beckScore: normalizeString((rawUpdate as any).beckScore),
            iesrScore: normalizeString((rawUpdate as any).iesrScore),
          },
        },
        vhvNotes: {
          patientConcerns: normalizeString(rawUpdate.patientConcerns) || '',
          vhvObservations: normalizeString(rawUpdate.vhvObservations) || '',
        },
      }

      updateData = { ...rawUpdate, payload: mappedPayload }
    } else if (!('payload' in rawUpdate) && (('visitMeta' in rawUpdate) || ('patientBasics' in rawUpdate) || ('vitals' in rawUpdate))) {
      // Caller sent the structured payload fields at root; wrap into payload
      updateData = { ...rawUpdate, payload: rawUpdate }
    }

    const result = await supabaseApi.updateIntake(id, updateData)
    return NextResponse.json(result)

  } catch (error) {
    console.error('Update intake error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update intake' },
      { status: 500 }
    )
  }
}
