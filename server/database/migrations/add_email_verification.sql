-- Add email verification and password reset fields to users table
-- Run this in your Supabase SQL editor

-- Add email verification fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verification_token TEXT NULL,
ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS password_reset_token TEXT NULL,
ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS name TEXT NULL,
ADD COLUMN IF NOT EXISTS profile_picture TEXT NULL,
ADD COLUMN IF NOT EXISTS google_id TEXT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Update existing users to be verified (so they don't get locked out)
UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL;

-- Add comment
COMMENT ON COLUMN users.email_verified IS 'Whether user has verified their email address';
COMMENT ON COLUMN users.email_verification_token IS 'Token for email verification';
COMMENT ON COLUMN users.email_verification_expires_at IS 'When email verification token expires';
COMMENT ON COLUMN users.password_reset_token IS 'Token for password reset';
COMMENT ON COLUMN users.password_reset_expires_at IS 'When password reset token expires';
COMMENT ON COLUMN users.google_id IS 'Google OAuth user ID';
COMMENT ON COLUMN users.name IS 'User display name';
COMMENT ON COLUMN users.profile_picture IS 'User profile picture URL';
