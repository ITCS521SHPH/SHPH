import { NextRequest, NextResponse } from 'next/server'
import { supabaseApi } from '@/lib/supabase-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vhvId = searchParams.get('vhvId')

    if (!vhvId) {
      return NextResponse.json(
        { error: 'vhvId is required' },
        { status: 400 }
      )
    }

    const result = await supabaseApi.getAssignmentsByVHV(vhvId)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Get VHV assignments error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get VHV assignments' },
      { status: 500 }
    )
  }
}
