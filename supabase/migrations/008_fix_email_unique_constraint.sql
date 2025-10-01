-- Fix email unique constraint to allow multiple NULL values
-- The NULLS NOT DISTINCT clause in migration 006 treats NULLs as equal,
-- preventing multiple patients without email addresses

DO $$ 
BEGIN
  -- Check if patients table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'patients') THEN
    
    -- Drop the problematic unique constraint
    ALTER TABLE public.patients 
    DROP CONSTRAINT IF EXISTS patients_email_unique;
    
    -- Drop the index if it exists
    DROP INDEX IF EXISTS idx_patients_email;
    
    -- Create a partial unique index that only enforces uniqueness for non-NULL values
    -- This explicitly allows multiple NULL email values (standard PostgreSQL behavior)
    CREATE UNIQUE INDEX IF NOT EXISTS patients_email_unique_idx
    ON public.patients(email)
    WHERE email IS NOT NULL;
    
  END IF;
END $$;
