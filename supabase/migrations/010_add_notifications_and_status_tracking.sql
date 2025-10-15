-- Migration 010: Add notification system and enhanced status tracking
-- This adds notifications table and updates for better status tracking

DO $$
BEGIN
    -- Create notifications table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        CREATE TABLE notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            user_role TEXT NOT NULL CHECK (user_role IN ('ADMIN', 'DOCTOR', 'VHV', 'PATIENT')),
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('INFO', 'SUCCESS', 'WARNING', 'ERROR')),
            entity_type TEXT CHECK (entity_type IN ('INTAKE', 'TASK', 'EMERGENCY', 'APPOINTMENT')),
            entity_id TEXT,
            read_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes for performance
        CREATE INDEX idx_notifications_user_id ON notifications(user_id);
        CREATE INDEX idx_notifications_user_role ON notifications(user_role);
        CREATE INDEX idx_notifications_read_at ON notifications(read_at);
        CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
        CREATE INDEX idx_notifications_entity ON notifications(entity_type, entity_id);
        
        RAISE NOTICE 'Created notifications table with indexes';
    ELSE
        RAISE NOTICE 'notifications table already exists';
    END IF;

    -- Add vhv_validated column to intake_submissions if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'intake_submissions' 
        AND column_name = 'vhv_validated'
    ) THEN
        ALTER TABLE intake_submissions ADD COLUMN vhv_validated BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added vhv_validated column to intake_submissions table';
    ELSE
        RAISE NOTICE 'vhv_validated column already exists in intake_submissions table';
    END IF;

    -- Add doctor_notes column to intake_submissions if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'intake_submissions' 
        AND column_name = 'doctor_notes'
    ) THEN
        ALTER TABLE intake_submissions ADD COLUMN doctor_notes TEXT;
        RAISE NOTICE 'Added doctor_notes column to intake_submissions table';
    ELSE
        RAISE NOTICE 'doctor_notes column already exists in intake_submissions table';
    END IF;

    -- Add status_changed_at column to intake_submissions if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'intake_submissions' 
        AND column_name = 'status_changed_at'
    ) THEN
        ALTER TABLE intake_submissions ADD COLUMN status_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added status_changed_at column to intake_submissions table';
    ELSE
        RAISE NOTICE 'status_changed_at column already exists in intake_submissions table';
    END IF;

    -- Add resolved_by column to emergency_alerts if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'emergency_alerts' 
        AND column_name = 'resolved_by'
    ) THEN
        ALTER TABLE emergency_alerts ADD COLUMN resolved_by UUID;
        RAISE NOTICE 'Added resolved_by column to emergency_alerts table';
    ELSE
        RAISE NOTICE 'resolved_by column already exists in emergency_alerts table';
    END IF;

    -- Add resolution_notes column to emergency_alerts if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'emergency_alerts' 
        AND column_name = 'resolution_notes'
    ) THEN
        ALTER TABLE emergency_alerts ADD COLUMN resolution_notes TEXT;
        RAISE NOTICE 'Added resolution_notes column to emergency_alerts table';
    ELSE
        RAISE NOTICE 'resolution_notes column already exists in emergency_alerts table';
    END IF;

    RAISE NOTICE 'Migration 010 completed successfully';
END $$;