-- Fix RLS policies for users table
-- Run this in your Supabase SQL Editor

-- Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';

-- Create RLS policies for users table
-- These policies allow users to manage their own data and allow service role full access

-- Policy 1: Users can view their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT 
    USING (auth.uid()::text = id::text);

-- Policy 2: Users can update their own data  
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE 
    USING (auth.uid()::text = id::text)
    WITH CHECK (auth.uid()::text = id::text);

-- Policy 3: Allow registration (insert new users)
CREATE POLICY "Allow user registration" ON users
    FOR INSERT 
    WITH CHECK (true);

-- Policy 4: Users can delete their own account
CREATE POLICY "Users can delete own account" ON users
    FOR DELETE 
    USING (auth.uid()::text = id::text);

-- Policy 5: Service role bypass (for API operations)
CREATE POLICY "Service role bypass" ON users
    FOR ALL 
    USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
    WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Alternative: If the above service role policy doesn't work, use this simpler version
-- (Uncomment if needed and comment out the policy above)
/*
CREATE POLICY "API access" ON users
    FOR ALL 
    USING (true)
    WITH CHECK (true);
*/

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Test query to ensure policies work
-- This should return data if you're authenticated
SELECT id, email, plan FROM users LIMIT 1;
