-- Fix national_id unique constraint to allow multiple NULL values
-- PostgreSQL by default allows multiple NULLs in UNIQUE constraints,
-- but the existing constraint might not behave correctly with empty strings

DO $$ 
BEGIN
  -- Check if patients table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'patients') THEN
    
    -- Drop the existing unique constraint if it exists
    ALTER TABLE public.patients 
    DROP CONSTRAINT IF EXISTS patients_national_id_key;
    
    -- Drop the existing unique index if it exists
    DROP INDEX IF EXISTS patients_national_id_key;
    
    -- Create a partial unique index that only enforces uniqueness for non-NULL AND non-empty values
    -- This explicitly allows multiple NULL national_id values
    CREATE UNIQUE INDEX IF NOT EXISTS patients_national_id_unique_idx
    ON public.patients(national_id)
    WHERE national_id IS NOT NULL AND national_id != '';
    
  END IF;
END $$;
