-- ========================================
-- COMPLETE DATABASE SCHEMA SETUP
-- ========================================
-- Copy and paste this ENTIRE file into Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/cmprakkctummmforgkyy/editor
--
-- This will create all necessary tables, functions, and relationships
-- for the healthcare application to work properly.
-- ========================================

-- ========================================
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard/project/cmprakkctummmforgkyy
-- 2. Navigate to SQL Editor (left sidebar)
-- 3. Click "New Query"
-- 4. Copy and paste THIS ENTIRE FILE
-- 5. Click "Run" button
-- 6. Wait for completion message
-- 7. Verify by running: SELECT * FROM admins LIMIT 1;
-- ========================================

-- Your Supabase database is missing most tables. This script will create:
-- ✓ admins, doctors, vhvs tables with authentication
-- ✓ assignments, tasks, intake_submissions, emergency_alerts
-- ✓ appointments, visits, medications, vital_signs, reschedule_requests
-- ✓ All necessary indexes and foreign keys
-- ✓ Password hashing and authentication functions
-- ✓ Sample demo users for testing

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ========================================
-- CREATE ALL TABLES
-- ========================================
-- Note: Using CREATE TABLE IF NOT EXISTS to avoid errors if tables exist

create table if not exists "public"."admins" (
    "id" uuid not null default gen_random_uuid(),
    "email" text not null,
    "password_hash" text not null,
    "first_name" text not null,
    "last_name" text not null,
    "phone" text,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table if not exists "public"."appointments" (
    "id" uuid not null default gen_random_uuid(),
    "patient_id" uuid not null,
    "doctor_id" uuid not null,
    "scheduled_date" date not null,
    "scheduled_time" time without time zone not null,
    "appointment_type" text default 'consultation'::text,
    "status" text default 'scheduled'::text,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table if not exists "public"."assignments" (
    "id" uuid not null default gen_random_uuid(),
    "patient_id" uuid not null,
    "doctor_id" uuid not null,
    "vhv_id" uuid not null,
    "assigned_at" timestamp with time zone default now(),
    "status" text default 'active'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table if not exists "public"."doctors" (
    "id" uuid not null default gen_random_uuid(),
    "email" text not null,
    "password_hash" text not null,
    "first_name" text not null,
    "last_name" text not null,
    "phone" text,
    "license_number" text not null,
    "specialization" text,
    "experience_years" integer default 0,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table if not exists "public"."emergency_alerts" (
    "id" uuid not null default gen_random_uuid(),
    "patient_id" uuid not null,
    "doctor_id" uuid,
    "vhv_id" uuid,
    "priority" text default 'medium'::text,
    "status" text default 'active'::text,
    "description" text not null,
    "location" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "acknowledged_at" timestamp with time zone,
    "resolved_at" timestamp with time zone
);


create table if not exists "public"."intake_submissions" (
    "id" text not null default gen_random_uuid(),
    "patient_id" uuid not null,
    "vhv_id" uuid not null,
    "status" text not null default 'DRAFT'::text,
    "payload" jsonb not null default '{}'::jsonb,
    "attachments" jsonb default '[]'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table if not exists "public"."medications" (
    "id" uuid not null default gen_random_uuid(),
    "patient_id" uuid not null,
    "name" text not null,
    "dosage" text not null,
    "frequency" text not null,
    "start_date" date not null,
    "end_date" date,
    "prescribed_by" uuid,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table if not exists "public"."patients" (
    "id" uuid not null default gen_random_uuid(),
    "email" text,
    "password_hash" text,
    "first_name" text not null,
    "last_name" text not null,
    "phone" text,
    "national_id" text,
    "dob" date,
    "address" text,
    "emergency_contact_name" text,
    "emergency_contact_phone" text,
    "medical_history" text,
    "allergies" text,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "user_id" uuid
);


create table if not exists "public"."reschedule_requests" (
    "id" uuid not null default gen_random_uuid(),
    "patient_id" uuid not null,
    "appointment_id" uuid not null,
    "new_date" date not null,
    "new_time" time without time zone not null,
    "reason" text,
    "status" text default 'pending'::text,
    "requested_at" timestamp with time zone default now(),
    "processed_at" timestamp with time zone,
    "processed_by" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table if not exists "public"."tasks" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text,
    "patient_id" uuid not null,
    "doctor_id" uuid not null,
    "vhv_id" uuid,
    "priority" text default 'medium'::text,
    "status" text default 'pending'::text,
    "due_date" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table if not exists "public"."vhvs" (
    "id" uuid not null default gen_random_uuid(),
    "email" text not null,
    "password_hash" text not null,
    "first_name" text not null,
    "last_name" text not null,
    "phone" text,
    "license_number" text not null,
    "specialization" text,
    "experience_years" integer default 0,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table if not exists "public"."visits" (
    "id" uuid not null default gen_random_uuid(),
    "patient_id" uuid not null,
    "vhv_id" uuid not null,
    "visit_date" date not null,
    "visit_time" time without time zone not null,
    "visit_type" text default 'routine'::text,
    "status" text default 'scheduled'::text,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table if not exists "public"."vital_signs" (
    "id" uuid not null default gen_random_uuid(),
    "patient_id" uuid not null,
    "recorded_by" uuid,
    "blood_pressure_systolic" integer,
    "blood_pressure_diastolic" integer,
    "heart_rate" integer,
    "temperature" numeric,
    "weight" numeric,
    "height" numeric,
    "oxygen_saturation" integer,
    "recorded_at" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now()
);


CREATE UNIQUE INDEX admins_email_key ON public.admins USING btree (email);

CREATE UNIQUE INDEX admins_pkey ON public.admins USING btree (id);

CREATE UNIQUE INDEX appointments_pkey ON public.appointments USING btree (id);

CREATE UNIQUE INDEX assignments_patient_vhv_unique ON public.assignments USING btree (patient_id, vhv_id);

CREATE UNIQUE INDEX assignments_pkey ON public.assignments USING btree (id);

CREATE UNIQUE INDEX doctors_email_key ON public.doctors USING btree (email);

CREATE UNIQUE INDEX doctors_license_number_key ON public.doctors USING btree (license_number);

CREATE UNIQUE INDEX doctors_pkey ON public.doctors USING btree (id);

CREATE UNIQUE INDEX emergency_alerts_pkey ON public.emergency_alerts USING btree (id);

CREATE INDEX idx_appointments_doctor_id ON public.appointments USING btree (doctor_id);

CREATE INDEX idx_appointments_patient_id ON public.appointments USING btree (patient_id);

CREATE INDEX idx_assignments_doctor_id ON public.assignments USING btree (doctor_id);

CREATE INDEX idx_assignments_patient_id ON public.assignments USING btree (patient_id);

CREATE INDEX idx_assignments_patient_vhv ON public.assignments USING btree (patient_id, vhv_id);

CREATE INDEX idx_assignments_vhv_id ON public.assignments USING btree (vhv_id);

CREATE INDEX idx_emergency_alerts_patient_id ON public.emergency_alerts USING btree (patient_id);

CREATE INDEX idx_emergency_alerts_status ON public.emergency_alerts USING btree (status);

CREATE INDEX idx_medications_patient_id ON public.medications USING btree (patient_id);

CREATE INDEX idx_patients_email ON public.patients USING btree (email) WHERE (email IS NOT NULL);

CREATE INDEX idx_patients_user_id ON public.patients USING btree (user_id) WHERE (user_id IS NOT NULL);

CREATE INDEX idx_tasks_patient_id ON public.tasks USING btree (patient_id);

CREATE INDEX idx_visits_patient_id ON public.visits USING btree (patient_id);

CREATE INDEX idx_visits_vhv_id ON public.visits USING btree (vhv_id);

CREATE INDEX idx_vital_signs_patient_id ON public.vital_signs USING btree (patient_id);

CREATE UNIQUE INDEX intake_submissions_pkey ON public.intake_submissions USING btree (id);

CREATE UNIQUE INDEX medications_pkey ON public.medications USING btree (id);

CREATE UNIQUE INDEX patients_email_key ON public.patients USING btree (email);

CREATE UNIQUE INDEX patients_email_unique ON public.patients USING btree (email) NULLS NOT DISTINCT;

CREATE UNIQUE INDEX patients_national_id_key ON public.patients USING btree (national_id);

CREATE UNIQUE INDEX patients_pkey ON public.patients USING btree (id);

CREATE UNIQUE INDEX reschedule_requests_pkey ON public.reschedule_requests USING btree (id);

CREATE UNIQUE INDEX tasks_pkey ON public.tasks USING btree (id);

CREATE UNIQUE INDEX vhvs_email_key ON public.vhvs USING btree (email);

CREATE UNIQUE INDEX vhvs_license_number_key ON public.vhvs USING btree (license_number);

CREATE UNIQUE INDEX vhvs_pkey ON public.vhvs USING btree (id);

CREATE UNIQUE INDEX visits_pkey ON public.visits USING btree (id);

CREATE UNIQUE INDEX vital_signs_pkey ON public.vital_signs USING btree (id);

alter table "public"."admins" add constraint "admins_pkey" PRIMARY KEY using index "admins_pkey";

alter table "public"."appointments" add constraint "appointments_pkey" PRIMARY KEY using index "appointments_pkey";

alter table "public"."assignments" add constraint "assignments_pkey" PRIMARY KEY using index "assignments_pkey";

alter table "public"."doctors" add constraint "doctors_pkey" PRIMARY KEY using index "doctors_pkey";

alter table "public"."emergency_alerts" add constraint "emergency_alerts_pkey" PRIMARY KEY using index "emergency_alerts_pkey";

alter table "public"."intake_submissions" add constraint "intake_submissions_pkey" PRIMARY KEY using index "intake_submissions_pkey";

alter table "public"."medications" add constraint "medications_pkey" PRIMARY KEY using index "medications_pkey";

alter table "public"."patients" add constraint "patients_pkey" PRIMARY KEY using index "patients_pkey";

alter table "public"."reschedule_requests" add constraint "reschedule_requests_pkey" PRIMARY KEY using index "reschedule_requests_pkey";

alter table "public"."tasks" add constraint "tasks_pkey" PRIMARY KEY using index "tasks_pkey";

alter table "public"."vhvs" add constraint "vhvs_pkey" PRIMARY KEY using index "vhvs_pkey";

alter table "public"."visits" add constraint "visits_pkey" PRIMARY KEY using index "visits_pkey";

alter table "public"."vital_signs" add constraint "vital_signs_pkey" PRIMARY KEY using index "vital_signs_pkey";

alter table "public"."admins" add constraint "admins_email_key" UNIQUE using index "admins_email_key";

alter table "public"."appointments" add constraint "appointments_appointment_type_check" CHECK ((appointment_type = ANY (ARRAY['consultation'::text, 'follow_up'::text, 'emergency'::text, 'routine'::text]))) not valid;

alter table "public"."appointments" validate constraint "appointments_appointment_type_check";

alter table "public"."appointments" add constraint "appointments_doctor_id_fkey" FOREIGN KEY (doctor_id) REFERENCES doctors(id) not valid;

alter table "public"."appointments" validate constraint "appointments_doctor_id_fkey";

alter table "public"."appointments" add constraint "appointments_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES patients(id) not valid;

alter table "public"."appointments" validate constraint "appointments_patient_id_fkey";

alter table "public"."appointments" add constraint "appointments_status_check" CHECK ((status = ANY (ARRAY['scheduled'::text, 'confirmed'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text]))) not valid;

alter table "public"."appointments" validate constraint "appointments_status_check";

alter table "public"."assignments" add constraint "assignments_doctor_id_fkey" FOREIGN KEY (doctor_id) REFERENCES doctors(id) not valid;

alter table "public"."assignments" validate constraint "assignments_doctor_id_fkey";

alter table "public"."assignments" add constraint "assignments_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES patients(id) not valid;

alter table "public"."assignments" validate constraint "assignments_patient_id_fkey";

alter table "public"."assignments" add constraint "assignments_patient_vhv_unique" UNIQUE using index "assignments_patient_vhv_unique";

alter table "public"."assignments" add constraint "assignments_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'completed'::text]))) not valid;

alter table "public"."assignments" validate constraint "assignments_status_check";

alter table "public"."assignments" add constraint "assignments_vhv_id_fkey" FOREIGN KEY (vhv_id) REFERENCES vhvs(id) not valid;

alter table "public"."assignments" validate constraint "assignments_vhv_id_fkey";

alter table "public"."doctors" add constraint "doctors_email_key" UNIQUE using index "doctors_email_key";

alter table "public"."doctors" add constraint "doctors_license_number_key" UNIQUE using index "doctors_license_number_key";

alter table "public"."emergency_alerts" add constraint "emergency_alerts_doctor_id_fkey" FOREIGN KEY (doctor_id) REFERENCES doctors(id) not valid;

alter table "public"."emergency_alerts" validate constraint "emergency_alerts_doctor_id_fkey";

alter table "public"."emergency_alerts" add constraint "emergency_alerts_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES patients(id) not valid;

alter table "public"."emergency_alerts" validate constraint "emergency_alerts_patient_id_fkey";

alter table "public"."emergency_alerts" add constraint "emergency_alerts_priority_check" CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))) not valid;

alter table "public"."emergency_alerts" validate constraint "emergency_alerts_priority_check";

alter table "public"."emergency_alerts" add constraint "emergency_alerts_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'acknowledged'::text, 'resolved'::text, 'cancelled'::text]))) not valid;

alter table "public"."emergency_alerts" validate constraint "emergency_alerts_status_check";

alter table "public"."emergency_alerts" add constraint "emergency_alerts_vhv_id_fkey" FOREIGN KEY (vhv_id) REFERENCES vhvs(id) not valid;

alter table "public"."emergency_alerts" validate constraint "emergency_alerts_vhv_id_fkey";

alter table "public"."intake_submissions" add constraint "intake_submissions_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES patients(id) not valid;

alter table "public"."intake_submissions" validate constraint "intake_submissions_patient_id_fkey";

alter table "public"."intake_submissions" add constraint "intake_submissions_status_check" CHECK ((status = ANY (ARRAY['DRAFT'::text, 'SUBMITTED'::text, 'IN_REVIEW'::text, 'APPROVED'::text, 'CHANGES_REQUESTED'::text, 'REJECTED'::text]))) not valid;

alter table "public"."intake_submissions" validate constraint "intake_submissions_status_check";

alter table "public"."intake_submissions" add constraint "intake_submissions_vhv_id_fkey" FOREIGN KEY (vhv_id) REFERENCES vhvs(id) not valid;

alter table "public"."intake_submissions" validate constraint "intake_submissions_vhv_id_fkey";

alter table "public"."medications" add constraint "medications_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES patients(id) not valid;

alter table "public"."medications" validate constraint "medications_patient_id_fkey";

alter table "public"."medications" add constraint "medications_prescribed_by_fkey" FOREIGN KEY (prescribed_by) REFERENCES doctors(id) not valid;

alter table "public"."medications" validate constraint "medications_prescribed_by_fkey";

alter table "public"."patients" add constraint "patients_email_key" UNIQUE using index "patients_email_key";

alter table "public"."patients" add constraint "patients_email_unique" UNIQUE using index "patients_email_unique";

alter table "public"."patients" add constraint "patients_national_id_key" UNIQUE using index "patients_national_id_key";

alter table "public"."reschedule_requests" add constraint "reschedule_requests_appointment_id_fkey" FOREIGN KEY (appointment_id) REFERENCES appointments(id) not valid;

alter table "public"."reschedule_requests" validate constraint "reschedule_requests_appointment_id_fkey";

alter table "public"."reschedule_requests" add constraint "reschedule_requests_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES patients(id) not valid;

alter table "public"."reschedule_requests" validate constraint "reschedule_requests_patient_id_fkey";

alter table "public"."reschedule_requests" add constraint "reschedule_requests_processed_by_fkey" FOREIGN KEY (processed_by) REFERENCES doctors(id) not valid;

alter table "public"."reschedule_requests" validate constraint "reschedule_requests_processed_by_fkey";

alter table "public"."reschedule_requests" add constraint "reschedule_requests_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'cancelled'::text]))) not valid;

alter table "public"."reschedule_requests" validate constraint "reschedule_requests_status_check";

alter table "public"."tasks" add constraint "tasks_doctor_id_fkey" FOREIGN KEY (doctor_id) REFERENCES doctors(id) not valid;

alter table "public"."tasks" validate constraint "tasks_doctor_id_fkey";

alter table "public"."tasks" add constraint "tasks_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES patients(id) not valid;

alter table "public"."tasks" validate constraint "tasks_patient_id_fkey";

alter table "public"."tasks" add constraint "tasks_priority_check" CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))) not valid;

alter table "public"."tasks" validate constraint "tasks_priority_check";

alter table "public"."tasks" add constraint "tasks_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text]))) not valid;

alter table "public"."tasks" validate constraint "tasks_status_check";

alter table "public"."tasks" add constraint "tasks_vhv_id_fkey" FOREIGN KEY (vhv_id) REFERENCES vhvs(id) not valid;

alter table "public"."tasks" validate constraint "tasks_vhv_id_fkey";

alter table "public"."vhvs" add constraint "vhvs_email_key" UNIQUE using index "vhvs_email_key";

alter table "public"."vhvs" add constraint "vhvs_license_number_key" UNIQUE using index "vhvs_license_number_key";

alter table "public"."visits" add constraint "visits_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES patients(id) not valid;

alter table "public"."visits" validate constraint "visits_patient_id_fkey";

alter table "public"."visits" add constraint "visits_status_check" CHECK ((status = ANY (ARRAY['scheduled'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text]))) not valid;

alter table "public"."visits" validate constraint "visits_status_check";

alter table "public"."visits" add constraint "visits_vhv_id_fkey" FOREIGN KEY (vhv_id) REFERENCES vhvs(id) not valid;

alter table "public"."visits" validate constraint "visits_vhv_id_fkey";

alter table "public"."visits" add constraint "visits_visit_type_check" CHECK ((visit_type = ANY (ARRAY['routine'::text, 'follow_up'::text, 'emergency'::text, 'assessment'::text]))) not valid;

alter table "public"."visits" validate constraint "visits_visit_type_check";

alter table "public"."vital_signs" add constraint "vital_signs_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES patients(id) not valid;

alter table "public"."vital_signs" validate constraint "vital_signs_patient_id_fkey";

alter table "public"."vital_signs" add constraint "vital_signs_recorded_by_fkey" FOREIGN KEY (recorded_by) REFERENCES vhvs(id) not valid;

alter table "public"."vital_signs" validate constraint "vital_signs_recorded_by_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.authenticate_user(input_email text, input_password text)
 RETURNS TABLE(user_id text, user_type text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Check admins table
  RETURN QUERY
  SELECT id::text, 'ADMIN'::text
  FROM public.admins
  WHERE email = input_email
    AND public.verify_password(input_password, password_hash) = true
    AND is_active = true;

  -- Check doctors table
  RETURN QUERY
  SELECT id::text, 'DOCTOR'::text
  FROM public.doctors
  WHERE email = input_email
    AND public.verify_password(input_password, password_hash) = true
    AND is_active = true;

  -- Check vhvs table
  RETURN QUERY
  SELECT id::text, 'VHV'::text
  FROM public.vhvs
  WHERE email = input_email
    AND public.verify_password(input_password, password_hash) = true
    AND is_active = true;

  -- Check patients table (only patients with email and password)
  RETURN QUERY
  SELECT id::text, 'PATIENT'::text
  FROM public.patients
  WHERE email = input_email
    AND email IS NOT NULL
    AND password_hash IS NOT NULL
    AND public.verify_password(input_password, password_hash) = true
    AND is_active = true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.hash_password(password text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Use bcrypt hashing with gen_salt
  RETURN crypt(password, gen_salt('bf', 8));
END;
$function$
;

CREATE OR REPLACE FUNCTION public.verify_password(password text, hashed_password text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Verify password against hash
  RETURN crypt(password, hashed_password) = hashed_password;
END;
$function$
;



-- ========================================
-- INSERT DEMO USERS FOR TESTING
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
) ON CONFLICT (id) DO NOTHING;

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
ON CONFLICT (id) DO NOTHING;

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
ON CONFLICT (id) DO NOTHING;

-- Insert demo patient (with login credentials)
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
) ON CONFLICT (id) DO NOTHING;

-- ========================================
-- VERIFY INSTALLATION
-- ========================================

DO $$
DECLARE
  admin_count INTEGER;
  doctor_count INTEGER;
  vhv_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM public.admins;
  SELECT COUNT(*) INTO doctor_count FROM public.doctors;
  SELECT COUNT(*) INTO vhv_count FROM public.vhvs;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATABASE SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables created successfully:';
  RAISE NOTICE '  ✓ admins (% records)', admin_count;
  RAISE NOTICE '  ✓ doctors (% records)', doctor_count;
  RAISE NOTICE '  ✓ vhvs (% records)', vhv_count;
  RAISE NOTICE '  ✓ patients';
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
  RAISE NOTICE 'You can now login to the application!';
  RAISE NOTICE '========================================';
END $$;
