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

    const profile = await supabaseApi.getVHVProfile(vhvId)

    if (!profile) {
      return NextResponse.json(
        { error: 'VHV profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Get VHV profile error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get VHV profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { vhvId, phone, district } = body

    if (!vhvId) {
      return NextResponse.json(
        { error: 'vhvId is required' },
        { status: 400 }
      )
    }

    const updates: { phone?: string | null; district?: string | null } = {}

    if (phone !== undefined) {
      if (phone !== null && typeof phone !== 'string') {
        return NextResponse.json(
          { error: 'phone must be a string' },
          { status: 400 }
        )
      }
      updates.phone = phone
    }

    if (district !== undefined) {
      if (district !== null && typeof district !== 'string') {
        return NextResponse.json(
          { error: 'district must be a string' },
          { status: 400 }
        )
      }
      updates.district = district
    }

    const result = await supabaseApi.updateVHVProfile(vhvId, updates)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Update VHV profile error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update VHV profile' },
      { status: 500 }
    )
  }
}
