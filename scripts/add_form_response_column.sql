-- Add form_response column to tasks and area_tasks tables
-- This column will store the VHV's submitted form responses as JSON

-- Add to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS form_response JSONB;

-- Add to area_tasks table  
ALTER TABLE public.area_tasks
ADD COLUMN IF NOT EXISTS form_response JSONB;

-- Add comments for documentation
COMMENT ON COLUMN public.tasks.form_response IS 'Stores VHV form submission data as JSON';
COMMENT ON COLUMN public.area_tasks.form_response IS 'Stores VHV form submission data as JSON';
