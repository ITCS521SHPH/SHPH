-- Add unique constraint to assignments table to prevent duplicate patient-vhv assignments
-- This ensures that a patient can only be assigned to one VHV at a time

DO $$ 
BEGIN
  -- Check if table exists before adding constraint
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'assignments') THEN
    -- Add constraint only if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'assignments_patient_vhv_unique') THEN
      ALTER TABLE public.assignments
      ADD CONSTRAINT assignments_patient_vhv_unique
      UNIQUE (patient_id, vhv_id);
    END IF;
    
    -- Also add an index for better performance
    CREATE INDEX IF NOT EXISTS idx_assignments_patient_vhv
    ON public.assignments (patient_id, vhv_id);
  END IF;
END $$;