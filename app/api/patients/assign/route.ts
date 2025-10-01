import { NextRequest, NextResponse } from 'next/server'
import { supabaseApi } from '@/lib/supabase-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, vhvId, doctorId, tasks } = body

    if (!patientId || !vhvId || !doctorId) {
      return NextResponse.json(
        { error: 'patientId, vhvId, and doctorId are required' },
        { status: 400 }
      )
    }

    const result = await supabaseApi.assignPatient({
      patientId,
      vhvId,
      doctorId,
      tasks
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Patient assignment error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to assign patient' },
      { status: 500 }
    )
  }
}
