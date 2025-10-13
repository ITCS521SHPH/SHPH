import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY


// Create Supabase client only if environment variables are available
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null

// Database types (matching our SQL schema)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'ADMIN' | 'DOCTOR' | 'VHV' | 'PATIENT'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          role: 'ADMIN' | 'DOCTOR' | 'VHV' | 'PATIENT'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'ADMIN' | 'DOCTOR' | 'VHV' | 'PATIENT'
          created_at?: string
          updated_at?: string
        }
      }
      health_workers: {
        Row: {
          id: string
          user_id: string
          type: 'DOCTOR' | 'VHV'
          license_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'DOCTOR' | 'VHV'
          license_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'DOCTOR' | 'VHV'
          license_number?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      doctors: {
        Row: {
          id: string
          email: string
          password_hash: string
          first_name: string
          last_name: string
          phone: string | null
          district: string | null
          license_number: string
          specialization: string | null
          experience_years: number | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          first_name: string
          last_name: string
          phone?: string | null
          district?: string | null
          license_number: string
          specialization?: string | null
          experience_years?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          district?: string | null
          license_number?: string
          specialization?: string | null
          experience_years?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          user_id: string | null
          national_id: string | null
          email: string | null
          password_hash: string | null
          first_name: string
          last_name: string
          dob: string
          phone: string | null
          address: string | null
          district: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          medical_history: string | null
          allergies: string | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          national_id?: string | null
          email?: string | null
          password_hash?: string | null
          first_name: string
          last_name: string
          dob: string
          phone?: string | null
          address?: string | null
          district?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          medical_history?: string | null
          allergies?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          national_id?: string | null
          email?: string | null
          password_hash?: string | null
          first_name?: string
          last_name?: string
          dob?: string
          phone?: string | null
          address?: string | null
          district?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          medical_history?: string | null
          allergies?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          patient_id: string
          vhv_id: string
          doctor_id: string
          status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
          assigned_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          vhv_id: string
          doctor_id: string
          status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
          assigned_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          vhv_id?: string
          doctor_id?: string
          status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
          assigned_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          patient_id: string
          vhv_id: string
          doctor_id: string
          priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          due_date: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          patient_id: string
          vhv_id: string
          doctor_id: string
          priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          patient_id?: string
          vhv_id?: string
          doctor_id?: string
          priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      intake_submissions: {
        Row: {
          id: string
          patient_id: string
          vhv_id: string
          status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED'
          payload: any
          attachments: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          vhv_id: string
          status?: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED'
          payload: any
          attachments?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          vhv_id?: string
          status?: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED'
          payload?: any
          attachments?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      review_actions: {
        Row: {
          id: string
          submission_id: string
          reviewer_id: string
          action: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT'
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          reviewer_id: string
          action: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT'
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          reviewer_id?: string
          action?: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT'
          comment?: string | null
          created_at?: string
        }
      }
      emergency_alerts: {
        Row: {
          id: string
          patient_id: string
          patient_name: string
          triggered_by: string
          priority: 'CRITICAL' | 'HIGH' | 'MEDIUM'
          status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'CANCELLED'
          description: string | null
          location: string | null
          assigned_doctor_id: string | null
          assigned_vhv_id: string | null
          acknowledged_by: string | null
          acknowledged_at: string | null
          resolved_by: string | null
          resolved_at: string | null
          response_time: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          patient_name: string
          triggered_by: string
          priority: 'CRITICAL' | 'HIGH' | 'MEDIUM'
          status?: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'CANCELLED'
          description?: string | null
          location?: string | null
          assigned_doctor_id?: string | null
          assigned_vhv_id?: string | null
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          response_time?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          patient_name?: string
          triggered_by?: string
          priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM'
          status?: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'CANCELLED'
          description?: string | null
          location?: string | null
          assigned_doctor_id?: string | null
          assigned_vhv_id?: string | null
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          response_time?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      emergency_responses: {
        Row: {
          id: string
          alert_id: string
          responder_id: string
          responder_role: 'ADMIN' | 'DOCTOR' | 'VHV' | 'PATIENT'
          response_type: 'ACKNOWLEDGED' | 'EN_ROUTE' | 'ON_SCENE' | 'RESOLVED'
          notes: string | null
          estimated_arrival: string | null
          created_at: string
        }
        Insert: {
          id?: string
          alert_id: string
          responder_id: string
          responder_role: 'ADMIN' | 'DOCTOR' | 'VHV' | 'PATIENT'
          response_type: 'ACKNOWLEDGED' | 'EN_ROUTE' | 'ON_SCENE' | 'RESOLVED'
          notes?: string | null
          estimated_arrival?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          alert_id?: string
          responder_id?: string
          responder_role?: 'ADMIN' | 'DOCTOR' | 'VHV' | 'PATIENT'
          response_type?: 'ACKNOWLEDGED' | 'EN_ROUTE' | 'ON_SCENE' | 'RESOLVED'
          notes?: string | null
          estimated_arrival?: string | null
          created_at?: string
        }
      }
      emergency_contacts: {
        Row: {
          id: string
          patient_id: string
          name: string
          relationship: string
          phone: string
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          name: string
          relationship: string
          phone: string
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          name?: string
          relationship?: string
          phone?: string
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          actor_user_id: string
          entity_type: string
          entity_id: string
          action: string
          before_data: any | null
          after_data: any | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_user_id: string
          entity_type: string
          entity_id: string
          action: string
          before_data?: any | null
          after_data?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          actor_user_id?: string
          entity_type?: string
          entity_id?: string
          action?: string
          before_data?: any | null
          after_data?: any | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper functions for authentication
export const signInWithPassword = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Helper function to get user role from database
export const getUserRole = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
  
  return { data, error }
}
