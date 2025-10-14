-- Create area_tasks table to store district-based tasks decoupled from patients
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'area_tasks') THEN
    CREATE TABLE public.area_tasks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      description text,
      doctor_id uuid NOT NULL,
      vhv_id uuid NOT NULL,
      district text,
      priority text DEFAULT 'medium',
      status text DEFAULT 'pending',
      due_date timestamptz,
      completed_at timestamptz,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      CONSTRAINT area_tasks_priority_check CHECK (priority IN ('low','medium','high','urgent')),
      CONSTRAINT area_tasks_status_check CHECK (status IN ('pending','in_progress','completed','cancelled'))
    );

    CREATE INDEX IF NOT EXISTS idx_area_tasks_doctor ON public.area_tasks(doctor_id);
    CREATE INDEX IF NOT EXISTS idx_area_tasks_vhv ON public.area_tasks(vhv_id);
    CREATE INDEX IF NOT EXISTS idx_area_tasks_district ON public.area_tasks(district);
    CREATE INDEX IF NOT EXISTS idx_area_tasks_status ON public.area_tasks(status);
  END IF;
END $$;
