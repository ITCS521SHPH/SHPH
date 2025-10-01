import { NextRequest, NextResponse } from 'next/server'
import { supabaseApi } from '@/lib/supabase-api'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Admin API: Getting doctors...')
    
    const doctors = await supabaseApi.getDoctors()
    
    console.log('✅ Admin API: Doctors loaded:', doctors.length)
    
    return NextResponse.json(doctors)
  } catch (error) {
    console.error('❌ Admin API: Error getting doctors:', error)
    return NextResponse.json(
      { error: 'Failed to get doctors' },
      { status: 500 }
    )
  }
}
