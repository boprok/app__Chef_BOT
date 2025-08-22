-- Verification script for user_sessions table setup
-- Run this after the main setup script to verify everything is working

-- 1. Check table exists and structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_sessions' 
ORDER BY ordinal_position;

-- 2. Check indexes were created
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'user_sessions';

-- 3. Check constraints
SELECT 
    conname, 
    contype, 
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'user_sessions'::regclass;

-- 4. Check RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity, 
    hasrls 
FROM pg_tables 
WHERE tablename = 'user_sessions';

-- 5. Check RLS policies
SELECT 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'user_sessions';

-- 6. Test functions exist
SELECT 
    routine_name, 
    routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('cleanup_expired_sessions', 'invalidate_other_user_sessions');

-- 7. Check view exists
SELECT 
    table_name, 
    view_definition 
FROM information_schema.views 
WHERE table_name = 'active_user_sessions';

-- 8. Test insert (replace with actual user_id from your users table)
-- INSERT INTO user_sessions (user_id, device_id, device_name, platform, refresh_token_hash)
-- VALUES (1, 'test-device-123', 'Test Device', 'web', 'test-hash-456');

-- 9. Test select (should work with RLS)
-- SELECT * FROM user_sessions WHERE user_id = 1;

-- 10. Test cleanup function
-- SELECT cleanup_expired_sessions();

-- 11. Test view
-- SELECT * FROM active_user_sessions LIMIT 5;

-- Summary query to show table is ready
SELECT 
    'user_sessions table setup' as status,
    COUNT(*) as total_columns,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'user_sessions') as total_indexes,
    (SELECT COUNT(*) FROM pg_constraint WHERE conrelid = 'user_sessions'::regclass) as total_constraints,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'user_sessions') as total_policies
FROM information_schema.columns 
WHERE table_name = 'user_sessions';
