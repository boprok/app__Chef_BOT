-- Create user_sessions table for device tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    device_info JSONB DEFAULT '{}',
    token_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
    
    -- Ensure one active session per user
    UNIQUE(user_id, device_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);

-- Add comments
COMMENT ON TABLE user_sessions IS 'Tracks active user sessions per device for security';
COMMENT ON COLUMN user_sessions.device_id IS 'Unique identifier for the device';
COMMENT ON COLUMN user_sessions.device_info IS 'Device metadata (name, OS, etc.)';
COMMENT ON COLUMN user_sessions.token_hash IS 'Hashed version of refresh token for security';
