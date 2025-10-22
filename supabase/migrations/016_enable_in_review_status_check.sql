-- Migration 016: Allow IN_REVIEW status in intake_submissions check constraint

DO $$
BEGIN
  -- Drop old check constraint if it exists (uses text + CHECK)
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'intake_submissions'
      AND constraint_name = 'intake_submissions_status_check'
  ) THEN
    ALTER TABLE public.intake_submissions
      DROP CONSTRAINT intake_submissions_status_check;
  END IF;

  -- Recreate check constraint including IN_REVIEW
  ALTER TABLE public.intake_submissions
    ADD CONSTRAINT intake_submissions_status_check
    CHECK (status = ANY (ARRAY['DRAFT','SUBMITTED','IN_REVIEW','APPROVED','CHANGES_REQUESTED','REJECTED']));
END $$;

