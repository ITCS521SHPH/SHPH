-- ========================================
-- APPOINTMENT SCHEDULER ENHANCEMENT
-- ========================================
-- This script adds fields needed for the appointment scheduler feature
-- including color categories, duration, confirmation status, and notifications

-- Add new columns to appointments table
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS confirmed_by_patient BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_by UUID,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE;

-- Add check constraint for category
ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS appointments_category_check;

ALTER TABLE public.appointments
ADD CONSTRAINT appointments_category_check 
CHECK (category = ANY (ARRAY[
  'general'::text,
  'consultation'::text, 
  'follow_up'::text,
  'emergency'::text,
  'routine_checkup'::text,
  'vaccination'::text,
  'lab_test'::text,
  'surgery'::text,
  'therapy'::text
]));

-- Create index for efficient querying by doctor and date
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date 
ON public.appointments(doctor_id, scheduled_date);

-- Create index for patient appointments
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date 
ON public.appointments(patient_id, scheduled_date);

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_appointments_status 
ON public.appointments(status);

-- Create function to check for appointment conflicts
CREATE OR REPLACE FUNCTION check_appointment_conflict(
  p_doctor_id UUID,
  p_scheduled_date DATE,
  p_scheduled_time TIME,
  p_duration_minutes INTEGER,
  p_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  conflict_count INTEGER;
  end_time TIME;
BEGIN
  -- Calculate end time
  end_time := p_scheduled_time + (p_duration_minutes || ' minutes')::INTERVAL;
  
  -- Check for overlapping appointments
  SELECT COUNT(*) INTO conflict_count
  FROM public.appointments
  WHERE doctor_id = p_doctor_id
    AND scheduled_date = p_scheduled_date
    AND status NOT IN ('cancelled', 'no_show')
    AND (p_appointment_id IS NULL OR id != p_appointment_id)
    AND (
      -- New appointment starts during existing appointment
      (p_scheduled_time >= scheduled_time 
       AND p_scheduled_time < scheduled_time + (duration_minutes || ' minutes')::INTERVAL)
      OR
      -- New appointment ends during existing appointment
      (end_time > scheduled_time 
       AND end_time <= scheduled_time + (duration_minutes || ' minutes')::INTERVAL)
      OR
      -- New appointment completely contains existing appointment
      (p_scheduled_time <= scheduled_time 
       AND end_time >= scheduled_time + (duration_minutes || ' minutes')::INTERVAL)
    );
  
  RETURN conflict_count > 0;
END;
$$;

-- Create notifications table for appointment reminders
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('DOCTOR', 'PATIENT', 'VHV', 'ADMIN')),
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'appointment_created',
    'appointment_confirmed',
    'appointment_cancelled',
    'appointment_rescheduled',
    'appointment_reminder',
    'task_assigned',
    'emergency_alert'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  related_type TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user 
ON public.notifications(user_id, user_type);

CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON public.notifications(user_id, is_read) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_created 
ON public.notifications(created_at DESC);

-- Create function to send appointment notification
CREATE OR REPLACE FUNCTION send_appointment_notification(
  p_appointment_id UUID,
  p_notification_type TEXT,
  p_title TEXT,
  p_message TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_patient_id UUID;
  v_doctor_id UUID;
BEGIN
  -- Get appointment details
  SELECT patient_id, doctor_id INTO v_patient_id, v_doctor_id
  FROM public.appointments
  WHERE id = p_appointment_id;
  
  -- Send notification to patient
  INSERT INTO public.notifications (
    user_id,
    user_type,
    notification_type,
    title,
    message,
    related_id,
    related_type
  ) VALUES (
    v_patient_id,
    'PATIENT',
    p_notification_type,
    p_title,
    p_message,
    p_appointment_id,
    'appointment'
  );
  
  -- Send notification to doctor
  INSERT INTO public.notifications (
    user_id,
    user_type,
    notification_type,
    title,
    message,
    related_id,
    related_type
  ) VALUES (
    v_doctor_id,
    'DOCTOR',
    p_notification_type,
    p_title,
    p_message,
    p_appointment_id,
    'appointment'
  );
END;
$$;

-- Create trigger to send notification when appointment is created
CREATE OR REPLACE FUNCTION notify_appointment_created()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_patient_name TEXT;
  v_doctor_name TEXT;
BEGIN
  -- Get patient and doctor names
  SELECT first_name || ' ' || last_name INTO v_patient_name
  FROM public.patients WHERE id = NEW.patient_id;
  
  SELECT first_name || ' ' || last_name INTO v_doctor_name
  FROM public.doctors WHERE id = NEW.doctor_id;
  
  -- Send notifications
  PERFORM send_appointment_notification(
    NEW.id,
    'appointment_created',
    'New Appointment Scheduled',
    'Your appointment with Dr. ' || v_doctor_name || ' has been scheduled for ' || 
    TO_CHAR(NEW.scheduled_date, 'Mon DD, YYYY') || ' at ' || 
    TO_CHAR(NEW.scheduled_time, 'HH12:MI AM')
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_appointment_created ON public.appointments;
CREATE TRIGGER trigger_appointment_created
AFTER INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION notify_appointment_created();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'APPOINTMENT SCHEDULER SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Added features:';
  RAISE NOTICE '  ✓ Duration and time slot management';
  RAISE NOTICE '  ✓ Color-coded categories';
  RAISE NOTICE '  ✓ Patient confirmation tracking';
  RAISE NOTICE '  ✓ Conflict detection function';
  RAISE NOTICE '  ✓ Notifications table and system';
  RAISE NOTICE '  ✓ Automatic notification triggers';
  RAISE NOTICE '========================================';
END $$;
