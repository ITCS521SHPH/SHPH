-- Migration 016: Add household tracking for disease cluster identification

-- Create households table
CREATE TABLE IF NOT EXISTS public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL,
  district TEXT NOT NULL,
  address TEXT,
  head_of_household_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add household_id and relationship_type to patients table
ALTER TABLE public.patients 
  ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS relationship_type TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_households_doctor ON public.households(doctor_id);
CREATE INDEX IF NOT EXISTS idx_households_district ON public.households(district);
CREATE INDEX IF NOT EXISTS idx_patients_household ON public.patients(household_id);

-- Add comments
COMMENT ON TABLE public.households IS 'Household groupings for disease cluster tracking';
COMMENT ON COLUMN public.patients.household_id IS 'Reference to household for cluster analysis';
COMMENT ON COLUMN public.patients.relationship_type IS 'Relationship to head of household (e.g., spouse, child, parent)';
