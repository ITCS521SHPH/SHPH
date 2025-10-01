import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      firstName, 
      lastName, 
      dob, 
      address, 
      phone, 
      nationalId, 
      email, 
      password 
    } = body

    // Validate required fields
    if (!firstName || !lastName || !dob || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create user in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for patients
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: 'PATIENT'
      }
    })

    if (authError) {
      console.error('Auth user creation failed:', authError)
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 400 }
      )
    }

    const userId = authData.user.id

    // Insert patient data directly in patients table
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .insert({
        id: userId, // Use the same ID as the user
        email,
        password_hash: '', // Will be managed by Supabase Auth
        first_name: firstName,
        last_name: lastName,
        dob,
        address,
        phone,
        national_id: nationalId,
        is_active: true
      })
      .select()
      .single()

    if (patientError) {
      console.error('Patient data insertion failed:', patientError)
      // Clean up auth user if patient insertion fails
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: 'Failed to create patient record' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      patient: {
        id: patientData.id,
        firstName: patientData.first_name,
        lastName: patientData.last_name,
        dob: patientData.dob,
        address: patientData.address,
        phone: patientData.phone,
        nationalId: patientData.national_id,
        email
      }
    })

  } catch (error) {
    console.error('Create patient error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
