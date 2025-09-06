-- Migration for Email Verification Support
-- Safe migration that checks if columns exist before adding them

DO $$
BEGIN
    -- Add email_verified column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added email_verified column';
    ELSE
        RAISE NOTICE 'email_verified column already exists';
    END IF;

    -- Add verification_token column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'verification_token'
    ) THEN
        ALTER TABLE users ADD COLUMN verification_token TEXT;
        RAISE NOTICE 'Added verification_token column';
    ELSE
        RAISE NOTICE 'verification_token column already exists';
    END IF;

    -- Add verification_expires_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'verification_expires_at'
    ) THEN
        ALTER TABLE users ADD COLUMN verification_expires_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added verification_expires_at column';
    ELSE
        RAISE NOTICE 'verification_expires_at column already exists';
    END IF;

    -- Add password_reset_token column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_reset_token'
    ) THEN
        ALTER TABLE users ADD COLUMN password_reset_token TEXT;
        RAISE NOTICE 'Added password_reset_token column';
    ELSE
        RAISE NOTICE 'password_reset_token column already exists';
    END IF;

    -- Add password_reset_expires_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_reset_expires_at'
    ) THEN
        ALTER TABLE users ADD COLUMN password_reset_expires_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added password_reset_expires_at column';
    ELSE
        RAISE NOTICE 'password_reset_expires_at column already exists';
    END IF;

    -- Add google_id column for Google OAuth users if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'google_id'
    ) THEN
        ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE;
        RAISE NOTICE 'Added google_id column';
    ELSE
        RAISE NOTICE 'google_id column already exists';
    END IF;

    -- Add auth_provider column to track how user signed up
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'auth_provider'
    ) THEN
        ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'email';
        RAISE NOTICE 'Added auth_provider column';
    ELSE
        RAISE NOTICE 'auth_provider column already exists';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token) WHERE verification_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);

-- Display final table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Comments for documentation
COMMENT ON COLUMN users.email_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN users.verification_token IS 'Token for email verification (expires after 24h)';
COMMENT ON COLUMN users.verification_expires_at IS 'When the email verification token expires';
COMMENT ON COLUMN users.password_reset_token IS 'Token for password reset (expires after 1h)';
COMMENT ON COLUMN users.password_reset_expires_at IS 'When the password reset token expires';
COMMENT ON COLUMN users.google_id IS 'Google OAuth user ID for Google sign-in users';
COMMENT ON COLUMN users.auth_provider IS 'How the user signed up: email, google, etc.';
