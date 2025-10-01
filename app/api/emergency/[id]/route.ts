import { NextRequest, NextResponse } from 'next/server'
import { supabaseApi } from '@/lib/supabase-api'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { action, userId, notes } = body
    const alertId = params.id

    if (!action || !userId) {
      return NextResponse.json(
        { error: 'action and userId are required' },
        { status: 400 }
      )
    }

    let result
    switch (action) {
      case 'acknowledge':
        result = await supabaseApi.acknowledgeEmergencyAlert(alertId, userId, notes)
        break
      case 'resolve':
        result = await supabaseApi.resolveEmergencyAlert(alertId, userId, notes)
        break
      case 'cancel':
        result = await supabaseApi.cancelEmergencyAlert(alertId, userId, notes)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be acknowledge, resolve, or cancel' },
          { status: 400 }
        )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Update emergency alert error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update emergency alert' },
      { status: 500 }
    )
  }
}
