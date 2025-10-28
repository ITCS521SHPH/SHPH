import { NextRequest, NextResponse } from 'next/server'
import * as supabaseApi from '@/lib/supabase-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, ...patientData } = body

    if (!patientData.firstName || !patientData.lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      )
    }

    // Always create patient directly in the database (no Supabase Auth user)
    // If email/password provided, we will store the hashed password in patients.password_hash
    const result = await supabaseApi.createPatient({
      ...patientData,
      email,
      password,
    })
    return NextResponse.json(result)

  } catch (error) {
    console.error('Create patient error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create patient' },
      { status: 500 }
    )
  }
}
