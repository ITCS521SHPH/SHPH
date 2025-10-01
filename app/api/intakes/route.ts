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
    const patientId = searchParams.get('patientId') || undefined
    const vhvId = searchParams.get('vhvId') || undefined

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
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Intake ID is required' },
        { status: 400 }
      )
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
