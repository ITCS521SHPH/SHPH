import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 創建 Supabase 管理客戶端（使用服務端密鑰）
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, role, firstName, lastName, licenseNumber, specialization, hospitalAffiliation, region, phoneNumber, trainingLevel } = body

    console.log('Creating user with role:', role, 'email:', email)

    // 驗證必需字段
    if (!email || !password || !role || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 哈希密碼
    const { data: hashResult, error: hashError } = await supabaseAdmin
      .rpc('hash_password', { password })
    
    if (hashError) {
      console.error('Password hash error:', hashError)
      return NextResponse.json(
        { error: 'Failed to hash password' },
        { status: 500 }
      )
    }
    
    const passwordHash = hashResult

    let userData: any = null
    let tableName = ''

    // 根據角色創建對應的用戶記錄
    switch (role.toUpperCase()) {
      case 'ADMIN':
        const { data: adminData, error: adminError } = await supabaseAdmin
          .from('admins')
          .insert({
            email,
            password_hash: passwordHash,
            first_name: firstName,
            last_name: lastName,
            phone: phoneNumber || null,
            is_active: true
          })
          .select()
          .single()

        if (adminError) {
          console.error('Admin creation error:', adminError)
          return NextResponse.json(
            { error: adminError.message },
            { status: 400 }
          )
        }
        userData = adminData
        tableName = 'admins'
        break

      case 'DOCTOR':
        const { data: doctorData, error: doctorError } = await supabaseAdmin
          .from('doctors')
          .insert({
            email,
            password_hash: passwordHash,
            first_name: firstName,
            last_name: lastName,
            phone: phoneNumber || null,
            license_number: licenseNumber || `DOC-${Date.now()}`,
            specialization: specialization || null,
            experience_years: 0,
            is_active: true
          })
          .select()
          .single()

        if (doctorError) {
          console.error('Doctor creation error:', doctorError)
          return NextResponse.json(
            { error: doctorError.message },
            { status: 400 }
          )
        }
        userData = doctorData
        tableName = 'doctors'
        break

      case 'VHV':
        const { data: vhvData, error: vhvError } = await supabaseAdmin
          .from('vhvs')
          .insert({
            email,
            password_hash: passwordHash,
            first_name: firstName,
            last_name: lastName,
            phone: phoneNumber || null,
            license_number: licenseNumber || `VHV-${Date.now()}`,
            specialization: specialization || null,
            experience_years: 0,
            is_active: true
          })
          .select()
          .single()

        if (vhvError) {
          console.error('VHV creation error:', vhvError)
          return NextResponse.json(
            { error: vhvError.message },
            { status: 400 }
          )
        }
        userData = vhvData
        tableName = 'vhvs'
        break

      case 'PATIENT':
        const { data: patientData, error: patientError } = await supabaseAdmin
          .from('patients')
          .insert({
            email,
            password_hash: passwordHash,
            first_name: firstName,
            last_name: lastName,
            phone: phoneNumber || null,
            national_id: null,
            dob: '1990-01-01', // Default DOB
            address: null,
            emergency_contact_name: null,
            emergency_contact_phone: null,
            medical_history: null,
            allergies: null,
            is_active: true
          })
          .select()
          .single()

        if (patientError) {
          console.error('Patient creation error:', patientError)
          return NextResponse.json(
            { error: patientError.message },
            { status: 400 }
          )
        }
        userData = patientData
        tableName = 'patients'
        break

      default:
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        )
    }

    console.log('User created successfully in table:', tableName)

    // 返回創建的用戶信息
    return NextResponse.json({
      id: userData.id,
      email: userData.email,
      role: role.toUpperCase(),
      firstName: userData.first_name,
      lastName: userData.last_name,
      name: `${userData.first_name} ${userData.last_name}`,
      status: userData.is_active ? 'active' : 'inactive',
      createdAt: userData.created_at,
      updatedAt: userData.updated_at
    })

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
