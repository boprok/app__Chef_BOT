-- Setup script for Supabase user_sessions table
-- Run this script in the Supabase SQL Editor

-- First, let's check if we need to modify the users table structure
-- (This assumes your users table uses UUID as primary key)

-- Create user_sessions table for device tracking and session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    device_name TEXT DEFAULT 'Unknown Device',
    platform TEXT DEFAULT 'unknown',
    device_info JSONB DEFAULT '{}',
    refresh_token_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
    
    -- Ensure one active session per user (single device policy)
    CONSTRAINT unique_active_user_device UNIQUE(user_id, device_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device ON user_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at) WHERE is_active = true;

-- Create a function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() OR (is_active = false AND created_at < NOW() - INTERVAL '30 days');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to invalidate old sessions when a new device logs in
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

-- Enable Row Level Security (RLS) for user_sessions table
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: users can only see their own sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (auth.uid()::text::integer = user_id);

CREATE POLICY "Users can insert own sessions" ON user_sessions
    FOR INSERT WITH CHECK (auth.uid()::text::integer = user_id);

CREATE POLICY "Users can update own sessions" ON user_sessions
    FOR UPDATE USING (auth.uid()::text::integer = user_id);

CREATE POLICY "Users can delete own sessions" ON user_sessions
    FOR DELETE USING (auth.uid()::text::integer = user_id);

-- Optional: Create a view for active sessions with device info
CREATE OR REPLACE VIEW active_user_sessions AS
SELECT 
    us.id,
    us.user_id,
    u.email,
    us.device_id,
    us.device_name,
    us.platform,
    us.last_activity,
    us.created_at,
    us.expires_at
FROM user_sessions us
JOIN users u ON us.user_id = u.id
WHERE us.is_active = true
  AND us.expires_at > NOW();

-- Grant permissions on the view
GRANT SELECT ON active_user_sessions TO authenticated;

-- Optional: Set up automatic cleanup job (if pg_cron extension is available)
-- This requires pg_cron extension to be enabled in Supabase
-- SELECT cron.schedule('cleanup-expired-sessions', '0 2 * * *', 'SELECT cleanup_expired_sessions();');

-- Verification queries to run after setup:
-- 1. Check table structure:
-- \d user_sessions;

-- 2. Check if indexes were created:
-- SELECT indexname FROM pg_indexes WHERE tablename = 'user_sessions';

-- 3. Test the cleanup function:
-- SELECT cleanup_expired_sessions();

-- 4. Check active sessions view:
-- SELECT * FROM active_user_sessions LIMIT 5;

COMMENT ON TABLE user_sessions IS 'Tracks user login sessions across devices for security and single-device enforcement';
COMMENT ON COLUMN user_sessions.device_id IS 'Unique identifier for the device/browser';
COMMENT ON COLUMN user_sessions.refresh_token_hash IS 'Hashed version of the refresh token for security';
COMMENT ON COLUMN user_sessions.is_active IS 'Whether this session is currently active';
COMMENT ON COLUMN user_sessions.expires_at IS 'When this session expires (7 days from creation)';
