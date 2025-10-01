-- Create demo authentication accounts using Supabase's approach
-- This script creates the auth accounts that will trigger user record creation

-- Simplified approach using proper Supabase auth account creation
-- Note: This approach creates auth records that will automatically trigger
-- the creation of corresponding public.users records via the trigger function

-- First, let's ensure we have the proper extension for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a temporary function to safely create auth users
CREATE OR REPLACE FUNCTION create_demo_auth_user(
  user_email TEXT,
  user_password TEXT,
  user_id UUID,
  user_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  encrypted_pw TEXT;
BEGIN
  -- Generate encrypted password
  encrypted_pw := crypt(user_password, gen_salt('bf'));
  
  -- Insert into auth.users with minimal required fields
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    user_email,
    encrypted_pw,
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    user_metadata,
    NOW(),
    NOW(),
    '',
    ''
  );
  
  -- Insert corresponding identity record with required provider_id
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    user_id,
    jsonb_build_object('sub', user_id::text, 'email', user_email),
    'email',
    user_email, -- provider_id should be the email for email provider
    NOW(),
    NOW(),
    NOW()
  );
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- Create demo doctor accounts
SELECT create_demo_auth_user('dr.smith@shph.com', 'password123', '11111111-1111-1111-1111-111111111111'::uuid, '{"full_name":"Dr. Sarah Smith","role":"doctor"}'::jsonb);
SELECT create_demo_auth_user('dr.johnson@shph.com', 'password123', '11111111-1111-1111-1111-111111111112'::uuid, '{"full_name":"Dr. Michael Johnson","role":"doctor"}'::jsonb);
SELECT create_demo_auth_user('dr.brown@shph.com', 'password123', '11111111-1111-1111-1111-111111111113'::uuid, '{"full_name":"Dr. Emily Brown","role":"doctor"}'::jsonb);
SELECT create_demo_auth_user('dr.davis@shph.com', 'password123', '11111111-1111-1111-1111-111111111114'::uuid, '{"full_name":"Dr. James Davis","role":"doctor"}'::jsonb);

-- Create demo VHV accounts
SELECT create_demo_auth_user('vhv.anna@shph.com', 'password123', '22222222-2222-2222-2222-222222222221'::uuid, '{"full_name":"Anna Wilson","role":"vhv"}'::jsonb);
SELECT create_demo_auth_user('vhv.carlos@shph.com', 'password123', '22222222-2222-2222-2222-222222222222'::uuid, '{"full_name":"Carlos Martinez","role":"vhv"}'::jsonb);
SELECT create_demo_auth_user('vhv.maria@shph.com', 'password123', '22222222-2222-2222-2222-222222222223'::uuid, '{"full_name":"Maria Garcia","role":"vhv"}'::jsonb);
SELECT create_demo_auth_user('vhv.john@shph.com', 'password123', '22222222-2222-2222-2222-222222222224'::uuid, '{"full_name":"John Anderson","role":"vhv"}'::jsonb);
SELECT create_demo_auth_user('vhv.lisa@shph.com', 'password123', '22222222-2222-2222-2222-222222222225'::uuid, '{"full_name":"Lisa Thompson","role":"vhv"}'::jsonb);
SELECT create_demo_auth_user('vhv.david@shph.com', 'password123', '22222222-2222-2222-2222-222222222226'::uuid, '{"full_name":"David Lee","role":"vhv"}'::jsonb);
SELECT create_demo_auth_user('vhv.sarah@shph.com', 'password123', '22222222-2222-2222-2222-222222222227'::uuid, '{"full_name":"Sarah Kim","role":"vhv"}'::jsonb);
SELECT create_demo_auth_user('vhv.mike@shph.com', 'password123', '22222222-2222-2222-2222-222222222228'::uuid, '{"full_name":"Mike Chen","role":"vhv"}'::jsonb);
SELECT create_demo_auth_user('vhv.jenny@shph.com', 'password123', '22222222-2222-2222-2222-222222222229'::uuid, '{"full_name":"Jenny Rodriguez","role":"vhv"}'::jsonb);
SELECT create_demo_auth_user('vhv.tom@shph.com', 'password123', '22222222-2222-2222-2222-222222222230'::uuid, '{"full_name":"Tom Jackson","role":"vhv"}'::jsonb);

-- Create demo patient accounts
SELECT create_demo_auth_user('patient1@example.com', 'password123', '33333333-3333-3333-3333-333333333331'::uuid, '{"full_name":"Alice Cooper","role":"patient"}'::jsonb);
SELECT create_demo_auth_user('patient2@example.com', 'password123', '33333333-3333-3333-3333-333333333332'::uuid, '{"full_name":"Bob Miller","role":"patient"}'::jsonb);
SELECT create_demo_auth_user('patient3@example.com', 'password123', '33333333-3333-3333-3333-333333333333'::uuid, '{"full_name":"Carol White","role":"patient"}'::jsonb);

-- Create demo caregiver accounts
SELECT create_demo_auth_user('caregiver1@example.com', 'password123', '44444444-4444-4444-4444-444444444441'::uuid, '{"full_name":"Mary Cooper","role":"caregiver"}'::jsonb);
SELECT create_demo_auth_user('caregiver2@example.com', 'password123', '44444444-4444-4444-4444-444444444442'::uuid, '{"full_name":"Robert Miller","role":"caregiver"}'::jsonb);

-- Clean up the temporary function
DROP FUNCTION create_demo_auth_user(TEXT, TEXT, UUID, JSONB);
