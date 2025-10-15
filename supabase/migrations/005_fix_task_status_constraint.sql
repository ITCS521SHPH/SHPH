-- Update tasks status check constraint to use lowercase values
-- This fixes the constraint violation when completing tasks

DO $$ 
BEGIN
  -- Check if table exists before modifying constraint
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tasks') THEN
    -- First drop the existing constraint if it exists
    ALTER TABLE public.tasks
    DROP CONSTRAINT IF EXISTS tasks_status_check;
    
    -- Create new check constraint with lowercase status values
    ALTER TABLE public.tasks
    ADD CONSTRAINT tasks_status_check
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'));
  END IF;
END $$;