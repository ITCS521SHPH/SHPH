-- Migration 011: Add audit trail table for tracking all system changes
-- This provides comprehensive audit logging for security and compliance

DO $$
BEGIN
    -- Create audit_logs table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        CREATE TABLE audit_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            user_role TEXT NOT NULL CHECK (user_role IN ('ADMIN', 'DOCTOR', 'VHV', 'PATIENT')),
            action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'APPROVE', 'REJECT', 'RESOLVE')),
            entity_type TEXT NOT NULL CHECK (entity_type IN ('PATIENT', 'TASK', 'INTAKE', 'EMERGENCY', 'APPOINTMENT', 'ASSIGNMENT', 'NOTIFICATION')),
            entity_id TEXT NOT NULL,
            before_snapshot JSONB,
            after_snapshot JSONB,
            description TEXT,
            ip_address INET,
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes for performance and querying
        CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
        CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
        CREATE INDEX idx_audit_logs_action ON audit_logs(action);
        CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
        CREATE INDEX idx_audit_logs_user_role ON audit_logs(user_role);
        
        RAISE NOTICE 'Created audit_logs table with indexes';
    ELSE
        RAISE NOTICE 'audit_logs table already exists';
    END IF;

    RAISE NOTICE 'Migration 011 completed successfully';
END $$;
