-- ========================================
-- COMPLETE DATABASE SCHEMA SETUP (SAFE VERSION)
-- ========================================
-- This version safely handles existing tables and constraints
-- Copy and paste this ENTIRE file into Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/cmprakkctummmforgkyy/editor
-- ========================================

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ========================================
-- STEP 1: CREATE PASSWORD FUNCTIONS
-- ========================================

CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 8));
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_password(password text, hashed_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN crypt(password, hashed_password) = hashed_password;
END;
$$;

-- ========================================
-- STEP 2: CREATE AUTHENTICATE USER FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION public.authenticate_user(input_email text, input_password text)
RETURNS TABLE(user_id text, user_type text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check admins table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admins') THEN
    RETURN QUERY
    SELECT id::text, 'ADMIN'::text
    FROM public.admins
    WHERE email = input_email
      AND public.verify_password(input_password, password_hash) = true
      AND is_active = true;
  END IF;

  -- Check doctors table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctors') THEN
    RETURN QUERY
    SELECT id::text, 'DOCTOR'::text
    FROM public.doctors
    WHERE email = input_email
      AND public.verify_password(input_password, password_hash) = true
      AND is_active = true;
  END IF;

  -- Check vhvs table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vhvs') THEN
    RETURN QUERY
    SELECT id::text, 'VHV'::text
    FROM public.vhvs
    WHERE email = input_email
      AND public.verify_password(input_password, password_hash) = true
      AND is_active = true;
  END IF;

  -- Check patients table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patients') THEN
    RETURN QUERY
    SELECT id::text, 'PATIENT'::text
    FROM public.patients
    WHERE email = input_email
      AND email IS NOT NULL
      AND password_hash IS NOT NULL
      AND public.verify_password(input_password, password_hash) = true
      AND is_active = true;
  END IF;
END;
$$;

-- ========================================
-- STEP 3: CREATE ROLE TABLES
-- ========================================

-- Create admins table
CREATE TABLE IF NOT EXISTS public.admins (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    email text NOT NULL,
    password_hash text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create doctors table
CREATE TABLE IF NOT EXISTS public.doctors (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    email text NOT NULL,
    password_hash text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone text,
    license_number text NOT NULL,
    specialization text,
    experience_years integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create vhvs table
CREATE TABLE IF NOT EXISTS public.vhvs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    email text NOT NULL,
    password_hash text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone text,
    license_number text NOT NULL,
    specialization text,
    experience_years integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ========================================
-- STEP 4: CREATE SUPPORTING TABLES
-- ========================================

CREATE TABLE IF NOT EXISTS public.assignments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    vhv_id uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    patient_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    vhv_id uuid,
    priority text DEFAULT 'medium'::text,
    status text DEFAULT 'pending'::text,
    due_date timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.intake_submissions (
    id text NOT NULL DEFAULT gen_random_uuid()::text,
    patient_id uuid NOT NULL,
    vhv_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'DRAFT'::text,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    attachments jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.emergency_alerts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL,
    doctor_id uuid,
    vhv_id uuid,
    priority text DEFAULT 'medium'::text,
    status text DEFAULT 'active'::text,
    description text NOT NULL,
    location text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    acknowledged_at timestamp with time zone,
    resolved_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.appointments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    scheduled_date date NOT NULL,
    scheduled_time time without time zone NOT NULL,
    appointment_type text DEFAULT 'consultation'::text,
    status text DEFAULT 'scheduled'::text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.visits (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL,
    vhv_id uuid NOT NULL,
    visit_date date NOT NULL,
    visit_time time without time zone NOT NULL,
    visit_type text DEFAULT 'routine'::text,
    status text DEFAULT 'scheduled'::text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.medications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL,
    name text NOT NULL,
    dosage text NOT NULL,
    frequency text NOT NULL,
    start_date date NOT NULL,
    end_date date,
    prescribed_by uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vital_signs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL,
    recorded_by uuid,
    blood_pressure_systolic integer,
    blood_pressure_diastolic integer,
    heart_rate integer,
    temperature numeric,
    weight numeric,
    height numeric,
    oxygen_saturation integer,
    recorded_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reschedule_requests (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL,
    appointment_id uuid NOT NULL,
    new_date date NOT NULL,
    new_time time without time zone NOT NULL,
    reason text,
    status text DEFAULT 'pending'::text,
    requested_at timestamp with time zone DEFAULT now(),
    processed_at timestamp with time zone,
    processed_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ========================================
-- STEP 5: ADD PRIMARY KEYS (IF NOT EXISTS)
-- ========================================

DO $$ 
BEGIN
    -- Admins
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admins_pkey') THEN
        ALTER TABLE public.admins ADD CONSTRAINT admins_pkey PRIMARY KEY (id);
    END IF;
    
    -- Doctors
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'doctors_pkey') THEN
        ALTER TABLE public.doctors ADD CONSTRAINT doctors_pkey PRIMARY KEY (id);
    END IF;
    
    -- VHVs
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vhvs_pkey') THEN
        ALTER TABLE public.vhvs ADD CONSTRAINT vhvs_pkey PRIMARY KEY (id);
    END IF;
    
    -- Assignments
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignments_pkey') THEN
        ALTER TABLE public.assignments ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);
    END IF;
    
    -- Tasks
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_pkey') THEN
        ALTER TABLE public.tasks ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);
    END IF;
    
    -- Intake Submissions
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'intake_submissions_pkey') THEN
        ALTER TABLE public.intake_submissions ADD CONSTRAINT intake_submissions_pkey PRIMARY KEY (id);
    END IF;
    
    -- Emergency Alerts
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'emergency_alerts_pkey') THEN
        ALTER TABLE public.emergency_alerts ADD CONSTRAINT emergency_alerts_pkey PRIMARY KEY (id);
    END IF;
    
    -- Appointments
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_pkey') THEN
        ALTER TABLE public.appointments ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);
    END IF;
    
    -- Visits
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'visits_pkey') THEN
        ALTER TABLE public.visits ADD CONSTRAINT visits_pkey PRIMARY KEY (id);
    END IF;
    
    -- Medications
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'medications_pkey') THEN
        ALTER TABLE public.medications ADD CONSTRAINT medications_pkey PRIMARY KEY (id);
    END IF;
    
    -- Vital Signs
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vital_signs_pkey') THEN
        ALTER TABLE public.vital_signs ADD CONSTRAINT vital_signs_pkey PRIMARY KEY (id);
    END IF;
    
    -- Reschedule Requests
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reschedule_requests_pkey') THEN
        ALTER TABLE public.reschedule_requests ADD CONSTRAINT reschedule_requests_pkey PRIMARY KEY (id);
    END IF;
END $$;

-- ========================================
-- STEP 6: ADD UNIQUE CONSTRAINTS
-- ========================================

DO $$ 
BEGIN
    -- Admins email
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admins_email_key') THEN
        ALTER TABLE public.admins ADD CONSTRAINT admins_email_key UNIQUE (email);
    END IF;
    
    -- Doctors email
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'doctors_email_key') THEN
        ALTER TABLE public.doctors ADD CONSTRAINT doctors_email_key UNIQUE (email);
    END IF;
    
    -- Doctors license
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'doctors_license_number_key') THEN
        ALTER TABLE public.doctors ADD CONSTRAINT doctors_license_number_key UNIQUE (license_number);
    END IF;
    
    -- VHVs email
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vhvs_email_key') THEN
        ALTER TABLE public.vhvs ADD CONSTRAINT vhvs_email_key UNIQUE (email);
    END IF;
    
    -- VHVs license
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vhvs_license_number_key') THEN
        ALTER TABLE public.vhvs ADD CONSTRAINT vhvs_license_number_key UNIQUE (license_number);
    END IF;
END $$;

-- ========================================
-- STEP 7: CREATE INDEXES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_assignments_patient_id ON public.assignments(patient_id);
CREATE INDEX IF NOT EXISTS idx_assignments_doctor_id ON public.assignments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_assignments_vhv_id ON public.assignments(vhv_id);
CREATE INDEX IF NOT EXISTS idx_tasks_patient_id ON public.tasks(patient_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_patient_id ON public.emergency_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON public.emergency_alerts(status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON public.visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_vhv_id ON public.visits(vhv_id);
CREATE INDEX IF NOT EXISTS idx_medications_patient_id ON public.medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_patient_id ON public.vital_signs(patient_id);

-- ========================================
-- STEP 8: INSERT DEMO USERS
-- ========================================

-- Insert demo admin
INSERT INTO public.admins (id, email, password_hash, first_name, last_name, is_active)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'admin@shph.com',
  public.hash_password('password123'),
  'Admin',
  'User',
  true
) ON CONFLICT (email) DO NOTHING;

-- Insert demo doctors
INSERT INTO public.doctors (id, email, password_hash, first_name, last_name, license_number, specialization, experience_years, is_active)
VALUES 
(
  '22222222-2222-2222-2222-222222222222',
  'dr.smith@shph.com',
  public.hash_password('password123'),
  'Sarah',
  'Smith',
  'MD001',
  'General Practice',
  10,
  true
),
(
  '22222222-2222-2222-2222-222222222223',
  'dr.johnson@shph.com',
  public.hash_password('password123'),
  'John',
  'Johnson',
  'MD002',
  'Cardiology',
  15,
  true
)
ON CONFLICT (email) DO NOTHING;

-- Insert demo VHVs
INSERT INTO public.vhvs (id, email, password_hash, first_name, last_name, license_number, specialization, experience_years, is_active)
VALUES 
(
  '33333333-3333-3333-3333-333333333333',
  'vhv.mary@shph.com',
  public.hash_password('password123'),
  'Mary',
  'Chen',
  'VHV001',
  'Community Health',
  5,
  true
),
(
  '33333333-3333-3333-3333-333333333334',
  'vhv.robert@shph.com',
  public.hash_password('password123'),
  'Robert',
  'Lee',
  'VHV002',
  'Family Health',
  7,
  true
)
ON CONFLICT (email) DO NOTHING;

-- Insert demo patient (with login credentials) - update existing patients table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'email') THEN
        INSERT INTO public.patients (id, email, password_hash, first_name, last_name, phone, national_id, dob, address, is_active)
        VALUES (
          '44444444-4444-4444-4444-444444444444',
          'patient@shph.com',
          public.hash_password('password123'),
          'John',
          'Doe',
          '555-0123',
          'NAT001',
          '1985-06-15',
          '123 Main St',
          true
        ) ON CONFLICT (email) DO NOTHING;
    END IF;
END $$;

-- ========================================
-- STEP 9: VERIFY INSTALLATION
-- ========================================

DO $$
DECLARE
  admin_count INTEGER;
  doctor_count INTEGER;
  vhv_count INTEGER;
  patient_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM public.admins;
  SELECT COUNT(*) INTO doctor_count FROM public.doctors;
  SELECT COUNT(*) INTO vhv_count FROM public.vhvs;
  SELECT COUNT(*) INTO patient_count FROM public.patients;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATABASE SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables created successfully:';
  RAISE NOTICE '  ✓ admins (% records)', admin_count;
  RAISE NOTICE '  ✓ doctors (% records)', doctor_count;
  RAISE NOTICE '  ✓ vhvs (% records)', vhv_count;
  RAISE NOTICE '  ✓ patients (% records)', patient_count;
  RAISE NOTICE '  ✓ assignments';
  RAISE NOTICE '  ✓ tasks';
  RAISE NOTICE '  ✓ intake_submissions';
  RAISE NOTICE '  ✓ emergency_alerts';
  RAISE NOTICE '  ✓ appointments';
  RAISE NOTICE '  ✓ visits';
  RAISE NOTICE '  ✓ medications';
  RAISE NOTICE '  ✓ vital_signs';
  RAISE NOTICE '  ✓ reschedule_requests';
  RAISE NOTICE '';
  RAISE NOTICE 'Demo users created:';
  RAISE NOTICE '  Email: admin@shph.com | Password: password123';
  RAISE NOTICE '  Email: dr.smith@shph.com | Password: password123';
  RAISE NOTICE '  Email: vhv.mary@shph.com | Password: password123';
  RAISE NOTICE '  Email: patient@shph.com | Password: password123';
  RAISE NOTICE '';
  RAISE NOTICE 'Authentication functions installed:';
  RAISE NOTICE '  ✓ hash_password()';
  RAISE NOTICE '  ✓ verify_password()';
  RAISE NOTICE '  ✓ authenticate_user()';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now login to the application!';
  RAISE NOTICE '========================================';
END $$;
