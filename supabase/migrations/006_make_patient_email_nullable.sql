-- Update patients table to support patients without user accounts
-- This allows VHVs to create patient records for people who don't have login credentials

DO $$ 
BEGIN
  -- Check if patients table exists before making changes
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'patients') THEN
    
    -- Add user_id column if it doesn't exist (for future user account linking)
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'patients' 
      AND column_name = 'user_id'
    ) THEN
      ALTER TABLE public.patients ADD COLUMN user_id UUID;
    END IF;
    
    -- Make email nullable (patients don't need email if they don't have an account)
    ALTER TABLE public.patients ALTER COLUMN email DROP NOT NULL;
    
    -- Make password_hash nullable (patients don't need password if they don't have an account)
    ALTER TABLE public.patients ALTER COLUMN password_hash DROP NOT NULL;
    
    -- Make is_active nullable with default true
    ALTER TABLE public.patients ALTER COLUMN is_active SET DEFAULT true;
    
    -- Drop old constraint if exists
    ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS patients_email_unique;
    
    -- Add unique constraint on email when it's not null
    -- This prevents duplicate emails while allowing multiple null values
    ALTER TABLE public.patients 
    ADD CONSTRAINT patients_email_unique 
    UNIQUE NULLS NOT DISTINCT (email);
    
    -- Create index for email lookups (only for non-null emails)
    CREATE INDEX IF NOT EXISTS idx_patients_email 
    ON public.patients(email) 
    WHERE email IS NOT NULL;
    
    -- Create index for user_id lookups
    CREATE INDEX IF NOT EXISTS idx_patients_user_id 
    ON public.patients(user_id) 
    WHERE user_id IS NOT NULL;
    
  END IF;
END $$;

-- Update the authenticate_user function to handle nullable fields
CREATE OR REPLACE FUNCTION public.authenticate_user(input_email text, input_password text)
RETURNS TABLE(user_id text, user_type text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;
