import { NextRequest, NextResponse } from 'next/server'
import { supabaseApi } from '@/lib/supabase-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, priority, description, location } = body

    if (!patientId || !priority) {
      return NextResponse.json(
        { error: 'patientId and priority are required' },
        { status: 400 }
      )
    }

    const emergencyAlert = await supabaseApi.createEmergencyAlert({
      patientId,
      priority,
      description,
      location
    })

    return NextResponse.json(emergencyAlert)
  } catch (error) {
    console.error('Create emergency alert error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create emergency alert' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const patientId = searchParams.get('patientId')
    const doctorId = searchParams.get('doctorId')
    const vhvId = searchParams.get('vhvId')

    // Convert status to lowercase for database query
    const dbStatus = status ? status.toLowerCase() : undefined
    const dbPriority = priority ? priority.toLowerCase() : undefined

    let alerts
    if (patientId) {
      alerts = await supabaseApi.getEmergencyAlertsByPatient(patientId)
    } else if (doctorId) {
      alerts = await supabaseApi.getEmergencyAlertsByDoctor(doctorId, dbStatus)
    } else if (vhvId) {
      alerts = await supabaseApi.getEmergencyAlertsByVHV(vhvId, dbStatus)
    } else {
      alerts = await supabaseApi.getEmergencyAlerts(dbStatus, dbPriority)
    }

    return NextResponse.json(alerts)
  } catch (error) {
    console.error('Get emergency alerts error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get emergency alerts' },
      { status: 500 }
    )
  }
}
