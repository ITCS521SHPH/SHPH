import { NextRequest, NextResponse } from 'next/server'
import { supabaseApi } from '@/lib/supabase-api'

export async function GET(request: NextRequest) {
  try {
    console.log('📈 Admin API: Getting dashboard stats...')
    
    const stats = await supabaseApi.getDashboardStats()
    
    console.log('✅ Admin API: Stats loaded:', stats)
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('❌ Admin API: Error getting stats:', error)
    return NextResponse.json(
      { error: 'Failed to get dashboard stats' },
      { status: 500 }
    )
  }
}
