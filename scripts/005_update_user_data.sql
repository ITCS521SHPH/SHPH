-- Update the existing user records to match the auth accounts
-- This ensures consistency between auth.users and public.users

-- Fixed ambiguous column references by using table aliases properly

-- Update doctors
UPDATE public.users 
SET 
  email = auth_users.email,
  full_name = auth_users.raw_user_meta_data ->> 'full_name',
  role = auth_users.raw_user_meta_data ->> 'role',
  phone = COALESCE(public.users.phone, '+1234567890')
FROM auth.users AS auth_users
WHERE public.users.id = auth_users.id
  AND auth_users.email LIKE 'dr.%@shph.com';

-- Update VHVs
UPDATE public.users 
SET 
  email = auth_users.email,
  full_name = auth_users.raw_user_meta_data ->> 'full_name',
  role = auth_users.raw_user_meta_data ->> 'role',
  phone = COALESCE(public.users.phone, '+1234567890')
FROM auth.users AS auth_users
WHERE public.users.id = auth_users.id
  AND auth_users.email LIKE 'vhv.%@shph.com';

-- Update patients
UPDATE public.users 
SET 
  email = auth_users.email,
  full_name = auth_users.raw_user_meta_data ->> 'full_name',
  role = auth_users.raw_user_meta_data ->> 'role',
  phone = COALESCE(public.users.phone, '+1234567890')
FROM auth.users AS auth_users
WHERE public.users.id = auth_users.id
  AND auth_users.email LIKE 'patient%@example.com';

-- Update caregivers
UPDATE public.users 
SET 
  email = auth_users.email,
  full_name = auth_users.raw_user_meta_data ->> 'full_name',
  role = auth_users.raw_user_meta_data ->> 'role',
  phone = COALESCE(public.users.phone, '+1234567890')
FROM auth.users AS auth_users
WHERE public.users.id = auth_users.id
  AND auth_users.email LIKE 'caregiver%@example.com';

-- Verify the updates worked
SELECT 
  u.email,
  u.full_name,
  u.role,
  u.phone,
  'Updated successfully' as status
FROM public.users u
WHERE u.email IN (
  'dr.smith@shph.com', 'dr.johnson@shph.com', 'dr.brown@shph.com', 'dr.davis@shph.com',
  'vhv.anna@shph.com', 'vhv.carlos@shph.com', 'vhv.maria@shph.com', 'vhv.john@shph.com', 
  'vhv.lisa@shph.com', 'vhv.david@shph.com', 'vhv.sarah@shph.com', 'vhv.mike@shph.com', 
  'vhv.jenny@shph.com', 'vhv.tom@shph.com',
  'patient1@example.com', 'patient2@example.com', 'patient3@example.com',
  'caregiver1@example.com', 'caregiver2@example.com'
)
ORDER BY u.role, u.email;
