import { NextRequest, NextResponse } from 'next/server'
import * as supabaseApi from '@/lib/supabase-api'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Admin API: Getting patients...')
    
    const patients = await supabaseApi.getPatients()
    
    console.log('✅ Admin API: Patients loaded:', patients.length)
    
    return NextResponse.json(patients)
  } catch (error) {
    console.error('❌ Admin API: Error getting patients:', error)
    return NextResponse.json(
      { error: 'Failed to get patients' },
      { status: 500 }
    )
  }
}
