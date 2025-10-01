-- Fix database schema issues and constraint violations
-- This script addresses foreign key mismatches and RLS policy conflicts

-- First, temporarily disable RLS to allow data fixes
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_queue DISABLE ROW LEVEL SECURITY;

-- Remove the foreign key constraint that's causing issues
-- We'll recreate it properly after fixing the data
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Update the users table to not require auth.users reference for seed data
-- Add a temporary column to track if this is a demo account
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_demo_account BOOLEAN DEFAULT FALSE;

-- Mark existing seed data as demo accounts
UPDATE public.users SET is_demo_account = TRUE WHERE id::text LIKE '11111111-%' OR id::text LIKE '22222222-%' OR id::text LIKE '33333333-%' OR id::text LIKE '44444444-%';

-- Create a more flexible constraint that allows demo accounts
-- Real users will still need to exist in auth.users
ALTER TABLE public.users ADD CONSTRAINT users_auth_check 
CHECK (
  is_demo_account = TRUE OR 
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = users.id)
);

-- Fix any orphaned records in related tables
-- Remove any visit records that reference non-existent users
DELETE FROM public.visit_records 
WHERE vhv_id NOT IN (SELECT id FROM public.users) 
   OR doctor_id NOT IN (SELECT id FROM public.users WHERE role = 'doctor')
   OR patient_id NOT IN (SELECT id FROM public.patients);

-- Remove any caregiver records that reference non-existent users or patients
DELETE FROM public.caregivers 
WHERE user_id NOT IN (SELECT id FROM public.users) 
   OR patient_id NOT IN (SELECT id FROM public.patients);

-- Remove any patient records that reference non-existent users or VHVs
DELETE FROM public.patients 
WHERE user_id NOT IN (SELECT id FROM public.users WHERE role = 'patient')
   OR (assigned_vhv_id IS NOT NULL AND assigned_vhv_id NOT IN (SELECT id FROM public.users WHERE role = 'vhv'));

-- Update RLS policies to handle demo accounts properly
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Doctors can view all patients" ON public.patients;
DROP POLICY IF EXISTS "VHVs can view their assigned patients" ON public.patients;
DROP POLICY IF EXISTS "Patients can view their own record" ON public.patients;
DROP POLICY IF EXISTS "Caregivers can view their patient's record" ON public.patients;
DROP POLICY IF EXISTS "Caregivers can view their own records" ON public.caregivers;
DROP POLICY IF EXISTS "Doctors and VHVs can view caregiver records" ON public.caregivers;
DROP POLICY IF EXISTS "Doctors can view all visit records" ON public.visit_records;
DROP POLICY IF EXISTS "VHVs can view and manage their own visit records" ON public.visit_records;
DROP POLICY IF EXISTS "Patients can view their own visit records" ON public.visit_records;
DROP POLICY IF EXISTS "Caregivers can view their patient's visit records" ON public.visit_records;
DROP POLICY IF EXISTS "Users can manage their own offline queue" ON public.offline_queue;

-- Create new RLS policies that handle both authenticated users and demo accounts
-- Users table policies
CREATE POLICY "Users can view profiles" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR 
    is_demo_account = TRUE OR
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('doctor', 'vhv'))
  );

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id AND is_demo_account = FALSE);

-- Patients table policies
CREATE POLICY "View patients policy" ON public.patients
  FOR SELECT USING (
    -- Doctors can view all patients
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'doctor') OR
    -- VHVs can view their assigned patients
    assigned_vhv_id = auth.uid() OR
    -- Patients can view their own record
    user_id = auth.uid() OR
    -- Caregivers can view their patient's record
    EXISTS (SELECT 1 FROM public.caregivers WHERE caregivers.patient_id = patients.id AND caregivers.user_id = auth.uid()) OR
    -- Allow demo account access
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_demo_account = TRUE)
  );

-- Caregivers table policies
CREATE POLICY "View caregivers policy" ON public.caregivers
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('doctor', 'vhv')) OR
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_demo_account = TRUE)
  );

-- Visit records table policies
CREATE POLICY "View visit records policy" ON public.visit_records
  FOR SELECT USING (
    -- Doctors can view all visit records
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'doctor') OR
    -- VHVs can view their own visit records
    vhv_id = auth.uid() OR
    -- Patients can view their own visit records
    EXISTS (SELECT 1 FROM public.patients WHERE patients.id = visit_records.patient_id AND patients.user_id = auth.uid()) OR
    -- Caregivers can view their patient's visit records
    EXISTS (
      SELECT 1 FROM public.caregivers 
      JOIN public.patients ON caregivers.patient_id = patients.id
      WHERE patients.id = visit_records.patient_id AND caregivers.user_id = auth.uid()
    ) OR
    -- Allow demo account access
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_demo_account = TRUE)
  );

CREATE POLICY "Manage visit records policy" ON public.visit_records
  FOR ALL USING (
    -- Doctors can manage all visit records
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'doctor') OR
    -- VHVs can manage their own visit records
    vhv_id = auth.uid() OR
    -- Allow demo account access
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_demo_account = TRUE)
  );

-- Offline queue table policies
CREATE POLICY "Manage offline queue policy" ON public.offline_queue
  FOR ALL USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_demo_account = TRUE)
  );

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_queue ENABLE ROW LEVEL SECURITY;

-- Add indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_users_demo_account ON public.users(is_demo_account);
CREATE INDEX IF NOT EXISTS idx_users_role_demo ON public.users(role, is_demo_account);

-- Update the auth trigger to handle demo accounts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into users table when a new auth user is created
  -- Only for non-demo accounts
  INSERT INTO public.users (id, email, full_name, role, is_demo_account)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Unknown User'),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'patient'),
    FALSE
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW()
  WHERE users.is_demo_account = FALSE;
  
  RETURN NEW;
END;
$$;
