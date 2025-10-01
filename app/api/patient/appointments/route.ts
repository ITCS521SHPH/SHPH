import { NextRequest, NextResponse } from 'next/server'
import { supabaseApi } from '@/lib/supabase-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId is required' },
        { status: 400 }
      )
    }

    const appointments = await supabaseApi.getPatientAppointments(patientId)
    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Get patient appointments error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get appointments' },
      { status: 500 }
    )
  }
}
