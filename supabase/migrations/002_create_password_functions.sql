-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create the hash_password function
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use bcrypt hashing with gen_salt
  RETURN crypt(password, gen_salt('bf', 8));
END;
$$;

-- Create the verify_password function for future use
CREATE OR REPLACE FUNCTION public.verify_password(password text, hashed_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify password against hash
  RETURN crypt(password, hashed_password) = hashed_password;
END;
$$;