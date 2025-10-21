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
          contactPhone: '',
        },
        symptoms: {
          chiefComplaint: (rawUpdate.patientConcerns || '').toString().trim(),
        },
        vitals: {
          temp:
            rawUpdate.temperature !== undefined && `${rawUpdate.temperature}` !== ''
              ? Number(rawUpdate.temperature)
              : undefined,
          systolic:
            rawUpdate.bloodPressureSystolic !== undefined && `${rawUpdate.bloodPressureSystolic}` !== ''
              ? Number(rawUpdate.bloodPressureSystolic)
              : undefined,
          diastolic:
            rawUpdate.bloodPressureDiastolic !== undefined && `${rawUpdate.bloodPressureDiastolic}` !== ''
              ? Number(rawUpdate.bloodPressureDiastolic)
              : undefined,
          hr:
            rawUpdate.heartRate !== undefined && `${rawUpdate.heartRate}` !== ''
              ? Number(rawUpdate.heartRate)
              : undefined,
          spo2:
            rawUpdate.oxygenSaturation !== undefined && `${rawUpdate.oxygenSaturation}` !== ''
              ? Number(rawUpdate.oxygenSaturation)
              : undefined,
          glucose:
            rawUpdate.bloodGlucose !== undefined && `${rawUpdate.bloodGlucose}` !== ''
              ? Number(rawUpdate.bloodGlucose)
              : undefined,
        },
        vhvNotes: {
          patientConcerns: (rawUpdate.patientConcerns || '').toString().trim(),
          vhvObservations: (rawUpdate.vhvObservations || '').toString().trim(),
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
