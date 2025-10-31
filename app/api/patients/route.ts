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
    
    // Provide user-friendly error messages for common database errors
    const errorMessage = error instanceof Error ? error.message : 'Failed to create patient'
    
    // Check for specific database constraint violations
    if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
      if (errorMessage.includes('national_id')) {
        return NextResponse.json(
          { 
            error: 'A patient with this National ID already exists. Please use a different National ID or leave it empty.',
            code: 'DUPLICATE_NATIONAL_ID'
          },
          { status: 409 }
        )
      }
      if (errorMessage.includes('email')) {
        return NextResponse.json(
          { 
            error: 'A patient with this email already exists. Please use a different email address.',
            code: 'DUPLICATE_EMAIL'
          },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { 
          error: 'This patient already exists in the system. Please check the information and try again.',
          code: 'DUPLICATE_ENTRY'
        },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
