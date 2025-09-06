-- Fix security warnings in Supabase database
-- Run this in your Supabase SQL Editor

-- SECURITY FIX: All functions need secure search_path to prevent security vulnerabilities

-- Fix 1: Update the update_updated_at_column function to have a secure search_path
-- This function is commonly auto-created by Supabase but has security issues

-- First, check if the functions exist
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN ('update_updated_at_column', 'cleanup_expired_sessions', 'invalidate_other_user_sessions', 'cleanup_old_rate_limits');

-- Fix update_updated_at_column function
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Trigger function to automatically update updated_at column. Fixed search_path for security.';

-- Fix cleanup_expired_sessions function  
DROP FUNCTION IF EXISTS public.cleanup_expired_sessions() CASCADE;

CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
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

COMMENT ON FUNCTION public.cleanup_expired_sessions() IS 'Cleanup expired user sessions. Fixed search_path for security.';

-- Fix invalidate_other_user_sessions function
DROP FUNCTION IF EXISTS public.invalidate_other_user_sessions(UUID, TEXT) CASCADE;

CREATE OR REPLACE FUNCTION public.invalidate_other_user_sessions(p_user_id UUID, p_device_id TEXT)
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

COMMENT ON FUNCTION public.invalidate_other_user_sessions(UUID, TEXT) IS 'Invalidate other user sessions for single device login. Fixed search_path for security.';

-- Fix cleanup_old_rate_limits function (if it exists)
DROP FUNCTION IF EXISTS public.cleanup_old_rate_limits() CASCADE;

CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Clean up rate limit records older than 1 day
    DELETE FROM rate_limits 
    WHERE created_at < NOW() - INTERVAL '1 day';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_rate_limits() IS 'Cleanup old rate limit records. Fixed search_path for security.';

-- Verify all fixes worked
SELECT 
    proname,
    prosecdef,
    proconfig
FROM pg_proc 
WHERE proname IN ('update_updated_at_column', 'cleanup_expired_sessions', 'invalidate_other_user_sessions', 'cleanup_old_rate_limits')
ORDER BY proname;

-- The output should show for each function:
-- - prosecdef = true (SECURITY DEFINER)  
-- - proconfig = {search_path=public} (fixed search_path)

-- Optional: If you have an updated_at column on users table, you can create a secure trigger:
-- (Uncomment the lines below if you want to add automatic updated_at functionality)

/*
-- Add updated_at column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger for users table
DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON users;
CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
*/
