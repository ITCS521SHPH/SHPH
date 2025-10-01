import { NextRequest, NextResponse } from 'next/server'
import { supabaseApi } from '@/lib/supabase-api'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Admin API: Getting users...')
    
    const users = await supabaseApi.getUsers()
    
    console.log('✅ Admin API: Users loaded:', users.length)
    
    return NextResponse.json(users)
  } catch (error) {
    console.error('❌ Admin API: Error getting users:', error)
    return NextResponse.json(
      { error: 'Failed to get users' },
      { status: 500 }
    )
  }
}
