import { NextRequest, NextResponse } from 'next/server'
import { supabaseApi } from '@/lib/supabase-api'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Admin API: Getting VHVs...')
    
    const vhvs = await supabaseApi.getVHVs()
    
    console.log('✅ Admin API: VHVs loaded:', vhvs.length)
    
    return NextResponse.json(vhvs)
  } catch (error) {
    console.error('❌ Admin API: Error getting VHVs:', error)
    return NextResponse.json(
      { error: 'Failed to get VHVs' },
      { status: 500 }
    )
  }
}
