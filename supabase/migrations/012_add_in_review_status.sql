-- Migration 012: Add IN_REVIEW status to intake_status enum
-- This migration adds the IN_REVIEW status to the intake status workflow

DO $$ 
BEGIN
  -- Check if the IN_REVIEW value already exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'IN_REVIEW' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'intake_status')
  ) THEN
    -- Add IN_REVIEW to the existing enum
    ALTER TYPE intake_status ADD VALUE 'IN_REVIEW';
    RAISE NOTICE 'Added IN_REVIEW to intake_status enum';
  ELSE
    RAISE NOTICE 'IN_REVIEW already exists in intake_status enum';
  END IF;

  -- Ensure notifications table exists for status change notifications
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    RAISE NOTICE 'Notifications table does not exist - please run migration 010 first';
  ELSE
    RAISE NOTICE 'Notifications table exists, ready for status change notifications';
  END IF;

  -- Create index on status for better performance if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_intake_submissions_status'
  ) THEN
    CREATE INDEX idx_intake_submissions_status ON intake_submissions(status);
    RAISE NOTICE 'Created index on intake_submissions.status';
  ELSE
    RAISE NOTICE 'Index on intake_submissions.status already exists';
  END IF;

  -- Create index on updated_at for better performance if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_intake_submissions_updated_at'
  ) THEN
    CREATE INDEX idx_intake_submissions_updated_at ON intake_submissions(updated_at);
    RAISE NOTICE 'Created index on intake_submissions.updated_at';
  ELSE
    RAISE NOTICE 'Index on intake_submissions.updated_at already exists';
  END IF;

END $$;
