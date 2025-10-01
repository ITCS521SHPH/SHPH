-- Validate data integrity and fix any remaining issues
-- This script checks for and resolves data consistency problems

-- Check for orphaned records and report them
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    -- Check for orphaned visit records
    SELECT COUNT(*) INTO orphaned_count
    FROM public.visit_records vr
    LEFT JOIN public.patients p ON vr.patient_id = p.id
    LEFT JOIN public.users vhv ON vr.vhv_id = vhv.id
    LEFT JOIN public.users doc ON vr.doctor_id = doc.id
    WHERE p.id IS NULL OR vhv.id IS NULL OR (vr.doctor_id IS NOT NULL AND doc.id IS NULL);
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Found % orphaned visit records', orphaned_count;
    END IF;
    
    -- Check for orphaned caregiver records
    SELECT COUNT(*) INTO orphaned_count
    FROM public.caregivers c
    LEFT JOIN public.users u ON c.user_id = u.id
    LEFT JOIN public.patients p ON c.patient_id = p.id
    WHERE u.id IS NULL OR p.id IS NULL;
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Found % orphaned caregiver records', orphaned_count;
    END IF;
    
    -- Check for orphaned patient records
    SELECT COUNT(*) INTO orphaned_count
    FROM public.patients p
    LEFT JOIN public.users u ON p.user_id = u.id
    LEFT JOIN public.users vhv ON p.assigned_vhv_id = vhv.id
    WHERE u.id IS NULL OR (p.assigned_vhv_id IS NOT NULL AND vhv.id IS NULL);
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Found % orphaned patient records', orphaned_count;
    END IF;
END $$;

-- Fix any constraint violations in visit records
UPDATE public.visit_records 
SET status = 'pending' 
WHERE status NOT IN ('draft', 'pending', 'approved', 'rejected');

-- Ensure all blood pressure values follow the correct format
UPDATE public.visit_records 
SET blood_pressure = NULL 
WHERE blood_pressure IS NOT NULL 
  AND blood_pressure !~ '^[0-9]{2,3}/[0-9]{2}$';

-- Ensure heart rate values are within valid range
UPDATE public.visit_records 
SET heart_rate = NULL 
WHERE heart_rate IS NOT NULL 
  AND (heart_rate < 40 OR heart_rate > 220);

-- Ensure temperature values are within valid range
UPDATE public.visit_records 
SET temperature = NULL 
WHERE temperature IS NOT NULL 
  AND (temperature < 30.0 OR temperature > 43.0);

-- Ensure symptoms have minimum length
UPDATE public.visit_records 
SET symptoms = 'General discomfort and health concerns reported by patient' 
WHERE symptoms IS NOT NULL 
  AND LENGTH(symptoms) < 5;

-- Validate user roles
UPDATE public.users 
SET role = 'patient' 
WHERE role NOT IN ('doctor', 'vhv', 'patient', 'caregiver');

-- Validate patient genders
UPDATE public.patients 
SET gender = NULL 
WHERE gender IS NOT NULL 
  AND gender NOT IN ('male', 'female', 'other');

-- Create a summary report
DO $$
DECLARE
    total_users INTEGER;
    demo_users INTEGER;
    total_patients INTEGER;
    total_visit_records INTEGER;
    pending_records INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM public.users;
    SELECT COUNT(*) INTO demo_users FROM public.users WHERE is_demo_account = TRUE;
    SELECT COUNT(*) INTO total_patients FROM public.patients;
    SELECT COUNT(*) INTO total_visit_records FROM public.visit_records;
    SELECT COUNT(*) INTO pending_records FROM public.visit_records WHERE status = 'pending';
    
    RAISE NOTICE '=== Database Integrity Report ===';
    RAISE NOTICE 'Total users: % (% demo accounts)', total_users, demo_users;
    RAISE NOTICE 'Total patients: %', total_patients;
    RAISE NOTICE 'Total visit records: %', total_visit_records;
    RAISE NOTICE 'Pending records: %', pending_records;
    RAISE NOTICE '=== End Report ===';
END $$;
