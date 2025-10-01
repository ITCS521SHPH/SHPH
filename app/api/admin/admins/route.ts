import { NextRequest, NextResponse } from 'next/server'
import { supabaseApi } from '@/lib/supabase-api'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Admin API: Getting admins...')
    
    const admins = await supabaseApi.getAdmins()
    
    console.log('✅ Admin API: Admins loaded:', admins.length)
    
    return NextResponse.json(admins)
  } catch (error) {
    console.error('❌ Admin API: Error getting admins:', error)
    return NextResponse.json(
      { error: 'Failed to get admins' },
      { status: 500 }
    )
  }
}
