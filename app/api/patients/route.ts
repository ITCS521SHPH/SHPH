import { NextRequest, NextResponse } from 'next/server'
import { supabaseApi } from '@/lib/supabase-api'

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

    // If email and password provided, use the admin create patient endpoint logic
    if (email && password) {
      const response = await fetch(`${request.nextUrl.origin}/api/admin/create-patient`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, ...patientData }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create patient')
      }

      return NextResponse.json(await response.json())
    } else {
      // Create patient without user account
      const result = await supabaseApi.createPatient(patientData)
      return NextResponse.json(result)
    }

  } catch (error) {
    console.error('Create patient error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create patient' },
      { status: 500 }
    )
  }
}
