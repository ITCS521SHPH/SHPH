-- Migration 009: Add medical condition and last visit fields to patients table
-- This adds the required fields for the doctor dashboard patient management enhancement

DO $$
BEGIN
    -- Add medical_condition column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' 
        AND column_name = 'medical_condition'
    ) THEN
        ALTER TABLE patients ADD COLUMN medical_condition TEXT;
        RAISE NOTICE 'Added medical_condition column to patients table';
    ELSE
        RAISE NOTICE 'medical_condition column already exists in patients table';
    END IF;

    -- Add last_visit column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' 
        AND column_name = 'last_visit'
    ) THEN
        ALTER TABLE patients ADD COLUMN last_visit DATE;
        RAISE NOTICE 'Added last_visit column to patients table';
    ELSE
        RAISE NOTICE 'last_visit column already exists in patients table';
    END IF;

    -- Create index on last_visit for sorting performance
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'patients' 
        AND indexname = 'idx_patients_last_visit'
    ) THEN
        CREATE INDEX idx_patients_last_visit ON patients(last_visit);
        RAISE NOTICE 'Created index on patients.last_visit';
    ELSE
        RAISE NOTICE 'Index on patients.last_visit already exists';
    END IF;

    -- Create index on medical_condition for filtering performance
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'patients' 
        AND indexname = 'idx_patients_medical_condition'
    ) THEN
        CREATE INDEX idx_patients_medical_condition ON patients(medical_condition);
        RAISE NOTICE 'Created index on patients.medical_condition';
    ELSE
        RAISE NOTICE 'Index on patients.medical_condition already exists';
    END IF;

    RAISE NOTICE 'Migration 009 completed successfully';
END $$;
