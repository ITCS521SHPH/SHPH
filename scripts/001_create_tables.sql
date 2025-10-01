-- Create users table with role-based access
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('doctor', 'vhv', 'patient', 'caregiver')),
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create patients table
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  patient_id TEXT UNIQUE NOT NULL, -- Human readable ID like P001
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  address TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  assigned_vhv_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create caregivers table
CREATE TABLE IF NOT EXISTS public.caregivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create visit records table
CREATE TABLE IF NOT EXISTS public.visit_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  vhv_id UUID NOT NULL REFERENCES public.users(id),
  doctor_id UUID REFERENCES public.users(id),
  
  -- Visit data
  symptoms TEXT NOT NULL CHECK (LENGTH(symptoms) >= 5),
  blood_pressure TEXT CHECK (blood_pressure ~ '^[0-9]{2,3}/[0-9]{2}$'),
  heart_rate INTEGER CHECK (heart_rate >= 40 AND heart_rate <= 220),
  temperature DECIMAL(3,1) CHECK (temperature >= 30.0 AND temperature <= 43.0),
  notes TEXT,
  
  -- Status and review
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  doctor_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create offline queue table for sync functionality
CREATE TABLE IF NOT EXISTS public.offline_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  record_data JSONB NOT NULL,
  record_type TEXT NOT NULL DEFAULT 'visit_record',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for patients table
CREATE POLICY "Doctors can view all patients" ON public.patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'doctor'
    )
  );

CREATE POLICY "VHVs can view their assigned patients" ON public.patients
  FOR SELECT USING (
    assigned_vhv_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'vhv'
    )
  );

CREATE POLICY "Patients can view their own record" ON public.patients
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Caregivers can view their patient's record" ON public.patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.caregivers 
      WHERE caregivers.patient_id = patients.id AND caregivers.user_id = auth.uid()
    )
  );

-- RLS Policies for caregivers table
CREATE POLICY "Caregivers can view their own records" ON public.caregivers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Doctors and VHVs can view caregiver records" ON public.caregivers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role IN ('doctor', 'vhv')
    )
  );

-- RLS Policies for visit_records table
CREATE POLICY "Doctors can view all visit records" ON public.visit_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'doctor'
    )
  );

CREATE POLICY "VHVs can view and manage their own visit records" ON public.visit_records
  FOR ALL USING (vhv_id = auth.uid());

CREATE POLICY "Patients can view their own visit records" ON public.visit_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = visit_records.patient_id AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "Caregivers can view their patient's visit records" ON public.visit_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.caregivers 
      JOIN public.patients ON caregivers.patient_id = patients.id
      WHERE patients.id = visit_records.patient_id AND caregivers.user_id = auth.uid()
    )
  );

-- RLS Policies for offline_queue table
CREATE POLICY "Users can manage their own offline queue" ON public.offline_queue
  FOR ALL USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_assigned_vhv ON public.patients(assigned_vhv_id);
CREATE INDEX IF NOT EXISTS idx_visit_records_patient ON public.visit_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_visit_records_vhv ON public.visit_records(vhv_id);
CREATE INDEX IF NOT EXISTS idx_visit_records_doctor ON public.visit_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_visit_records_status ON public.visit_records(status);
CREATE INDEX IF NOT EXISTS idx_caregivers_patient ON public.caregivers(patient_id);
CREATE INDEX IF NOT EXISTS idx_offline_queue_user ON public.offline_queue(user_id);
