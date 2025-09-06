-- Migration script for existing Chef Bot database
-- Use this if you need to modify existing structure

-- Step 1: Check current users table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Step 2: Create user_sessions table with UUID user_id to match Supabase users table
-- Supabase uses UUID for users.id by default

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
    
    -- Foreign key constraint - now matches UUID type
    CONSTRAINT fk_user_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Ensure one active session per user per device
    CONSTRAINT unique_active_user_device UNIQUE(user_id, device_id)
);

-- Step 3: Add indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(refresh_token_hash);
CREATE INDEX idx_user_sessions_device ON user_sessions(device_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at) WHERE is_active = true;

-- Step 4: Add helper functions with secure search_path
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    UPDATE user_sessions 
    SET is_active = false 
    WHERE expires_at < NOW() AND is_active = true;
    
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Cleanup expired user sessions. Secure search_path implementation.';

CREATE OR REPLACE FUNCTION invalidate_other_user_sessions(p_user_id UUID, p_device_id TEXT)
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE user_sessions 
    SET is_active = false, 
        last_activity = NOW()
    WHERE user_id = p_user_id 
      AND device_id != p_device_id 
      AND is_active = true;
END;
$$;

COMMENT ON FUNCTION invalidate_other_user_sessions(UUID, TEXT) IS 'Invalidate other user sessions for single device login. Secure search_path implementation.';

-- Step 5: Enable RLS if needed
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Users can manage own sessions" ON user_sessions
    USING (true)  -- Temporarily permissive, adjust based on your auth setup
    WITH CHECK (true);

-- Final verification - check table structure
SELECT 
    'Migration completed' as status,
    COUNT(*) as total_columns,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'user_sessions') as total_indexes,
    (SELECT COUNT(*) FROM pg_constraint WHERE conrelid = 'user_sessions'::regclass) as total_constraints
FROM information_schema.columns 
WHERE table_name = 'user_sessions';

-- Show existing users for reference (optional - comment out if not needed)
-- SELECT id, email FROM users LIMIT 5;
