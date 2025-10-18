-- Add form_response column to tasks and area_tasks tables to store VHV form submissions

-- Add form_response column to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'form_response'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN form_response jsonb;
    COMMENT ON COLUMN public.tasks.form_response IS 'Stores the VHV form submission data as JSON';
  END IF;
END $$;

-- Add form_response column to area_tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'area_tasks' AND column_name = 'form_response'
  ) THEN
    ALTER TABLE public.area_tasks ADD COLUMN form_response jsonb;
    COMMENT ON COLUMN public.area_tasks.form_response IS 'Stores the VHV form submission data as JSON';
  END IF;
END $$;
