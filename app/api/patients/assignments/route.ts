import { NextRequest, NextResponse } from 'next/server'
import { supabaseApi } from '@/lib/supabase-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get('doctorId')

    if (!doctorId) {
      return NextResponse.json(
        { error: 'doctorId is required' },
        { status: 400 }
      )
    }

    const result = await supabaseApi.getAssignmentsWithDetails(doctorId)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Get assignments error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get assignments' },
      { status: 500 }
    )
  }
}
