-- Create the authenticate_user function for custom authentication
-- This function checks email/password against all role tables

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

  -- Check patients table
  RETURN QUERY
  SELECT id::text, 'PATIENT'::text
  FROM public.patients
  WHERE email = input_email
    AND public.verify_password(input_password, password_hash) = true
    AND is_active = true;
END;
$$;
