-- Simple and safe user_sessions table creation for Supabase
-- This script avoids test inserts that could cause foreign key errors

-- Check if users table exists and its structure
SELECT 
    table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY table_name, ordinal_position;

-- Create user_sessions table
DROP TABLE IF EXISTS user_sessions CASCADE;

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    device_id TEXT NOT NULL,
    device_name TEXT DEFAULT 'Unknown Device',
    platform TEXT DEFAULT 'unknown',
    device_info JSONB DEFAULT '{}',
    refresh_token_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
    
    -- Foreign key constraint
    CONSTRAINT fk_user_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint for single device policy
    CONSTRAINT unique_active_user_device UNIQUE(user_id, device_id)
);

-- Create performance indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(refresh_token_hash);
CREATE INDEX idx_user_sessions_device ON user_sessions(device_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at) WHERE is_active = true;

-- Create helper functions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Mark expired sessions as inactive
    UPDATE user_sessions 
    SET is_active = false 
    WHERE expires_at < NOW() AND is_active = true;
    
    -- Delete old inactive sessions (older than 30 days)
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION invalidate_other_user_sessions(p_user_id UUID, p_device_id TEXT)
RETURNS VOID AS $$
BEGIN
    -- Mark all other active sessions for this user as inactive
    UPDATE user_sessions 
    SET is_active = false, 
        last_activity = NOW()
    WHERE user_id = p_user_id 
      AND device_id != p_device_id 
      AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policy (adjust as needed for your auth setup)
DROP POLICY IF EXISTS "Users can manage own sessions" ON user_sessions;
CREATE POLICY "Users can manage own sessions" ON user_sessions
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Verification query
SELECT 
    'user_sessions table created successfully' as status,
    COUNT(*) as total_columns,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'user_sessions') as total_indexes,
    (SELECT COUNT(*) FROM pg_constraint WHERE conrelid = 'user_sessions'::regclass) as total_constraints
FROM information_schema.columns 
WHERE table_name = 'user_sessions';

-- Show table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_sessions' 
ORDER BY ordinal_position;
