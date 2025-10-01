import { NextRequest, NextResponse } from 'next/server'
import { supabaseApi } from '@/lib/supabase-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { appointmentId, patientId, requestedDate, requestedTime, reason, preferredAlternatives } = body

    if (!appointmentId || !patientId || !requestedDate || !requestedTime) {
      return NextResponse.json(
        { error: 'appointmentId, patientId, requestedDate, and requestedTime are required' },
        { status: 400 }
      )
    }

    const result = await supabaseApi.createRescheduleRequest({
      appointmentId,
      patientId,
      requestedDate,
      requestedTime,
      reason,
      preferredAlternatives
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Create reschedule request error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create reschedule request' },
      { status: 500 }
    )
  }
}
