import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get a list of patients and VHVs to use for test data
    const { data: patients } = await supabase
      .from('patients')
      .select('id')
      .limit(10)
    
    const { data: vhvs } = await supabase
      .from('vhvs')
      .select('id')
      .limit(10)
    
    if (!patients || patients.length === 0) {
      return NextResponse.json(
        { error: 'No patients found. Please create patients first.' },
        { status: 400 }
      )
    }
    
    if (!vhvs || vhvs.length === 0) {
      return NextResponse.json(
        { error: 'No VHVs found. Please create VHVs first.' },
        { status: 400 }
      )
    }
    
    // Create 10 test intake submissions with SUBMITTED status
    const testSubmissions = []
    const now = new Date()
    
    for (let i = 0; i < 10; i++) {
      const patient = patients[i % patients.length]
      const vhv = vhvs[i % vhvs.length]
      
      const testPayload = {
        visitMeta: {
          visitDateTime: new Date(now.getTime() - i * 86400000).toISOString(), // Different dates
          vhvId: vhv.id,
          locationText: `Test Location ${i + 1}`,
        },
        patientBasics: {
          firstName: `Test${i + 1}`,
          lastName: `Patient${i + 1}`,
          dob: '1990-01-01',
          contactPhone: `081234567${i}`,
        },
        symptoms: {
          chiefComplaint: `Test complaint ${i + 1}: Patient reports various symptoms for review`,
          onsetDays: Math.floor(Math.random() * 30),
        },
        vitals: {
          temp: 36.5 + Math.random() * 2,
          systolic: 110 + Math.floor(Math.random() * 30),
          diastolic: 70 + Math.floor(Math.random() * 20),
          hr: 60 + Math.floor(Math.random() * 40),
          spo2: 95 + Math.floor(Math.random() * 5),
        },
        vhvNotes: {
          patientConcerns: `Test patient concerns ${i + 1}`,
          vhvObservations: `Test VHV observations ${i + 1}`,
        },
      }
      
      testSubmissions.push({
        patient_id: patient.id,
        vhv_id: vhv.id,
        status: 'SUBMITTED',
        payload: testPayload,
        attachments: [],
      })
    }
    
    const { data: insertedData, error } = await supabase
      .from('intake_submissions')
      .insert(testSubmissions)
      .select()
    
    if (error) {
      console.error('Error creating test data:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      count: insertedData?.length || 0,
      message: `Created ${insertedData?.length || 0} test review submissions`,
      submissions: insertedData,
    })
    
  } catch (error) {
    console.error('Create test review data error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create test data' },
      { status: 500 }
    )
  }
}

