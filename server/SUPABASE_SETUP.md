# Supabase Database Setup for Chef Bot Security System

This directory contains scripts to set up the user session tracking system in Supabase for enhanced security and device management.

## Files Overview

- `setup_supabase_sessions.sql` - Main setup script for new installations
- `migrate_supabase_sessions.sql` - Migration script for existing databases
- `verify_supabase_setup.sql` - Verification script to test the setup
- `create_user_sessions_table.sql` - Original simple table creation (legacy)

## Setup Instructions

### For New Installations

1. **Log into Supabase Dashboard**
   - Go to your project dashboard
   - Navigate to "SQL Editor"

2. **Run the Main Setup Script**
   ```sql
   -- Copy and paste the contents of setup_supabase_sessions.sql
   -- This will create:
   -- - user_sessions table with proper structure
   -- - All necessary indexes for performance
   -- - Row Level Security (RLS) policies
   -- - Helper functions for session management
   -- - Active sessions view
   ```

3. **Verify the Setup**
   ```sql
   -- Copy and paste the contents of verify_supabase_setup.sql
   -- This will check that everything was created correctly
   ```

### For Existing Installations

If you already have a Chef Bot database:

1. **Check Current Structure**
   ```sql
   SELECT column_name, data_type FROM information_schema.columns 
   WHERE table_name = 'users' ORDER BY ordinal_position;
   ```

2. **Run Migration Script**
   ```sql
   -- Copy and paste the contents of migrate_supabase_sessions.sql
   -- This handles existing data and structure conflicts
   ```

## Database Schema

### user_sessions Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | INTEGER | References users(id) |
| device_id | TEXT | Unique device identifier |
| device_name | TEXT | Human-readable device name |
| platform | TEXT | Platform (ios, android, web) |
| device_info | JSONB | Additional device information |
| refresh_token_hash | TEXT | Hashed refresh token |
| is_active | BOOLEAN | Session status |
| last_activity | TIMESTAMP | Last activity time |
| created_at | TIMESTAMP | Session creation time |
| expires_at | TIMESTAMP | Session expiration (7 days) |

### Key Features

1. **Single Device Policy**: `UNIQUE(user_id, device_id)` ensures one session per device
2. **Automatic Cleanup**: Function to remove expired sessions
3. **Security**: Hashed tokens, RLS policies
4. **Performance**: Optimized indexes for common queries

## Security Features

### Row Level Security (RLS)
- Users can only access their own sessions
- Policies enforce user isolation
- Admin access through service role

### Token Security
- Refresh tokens are hashed before storage
- No plaintext tokens in database
- Automatic token rotation

### Session Management
- 7-day session expiry
- Automatic cleanup of old sessions
- Device-based session invalidation

## Helper Functions

### cleanup_expired_sessions()
```sql
SELECT cleanup_expired_sessions();
-- Returns number of cleaned up sessions
```

### invalidate_other_user_sessions(user_id, device_id)
```sql
SELECT invalidate_other_user_sessions(123, 'current-device-id');
-- Invalidates all other sessions for a user except the specified device
```

## Monitoring Queries

### Active Sessions
```sql
SELECT * FROM active_user_sessions;
```

### Session Statistics
```sql
SELECT 
    COUNT(*) as total_sessions,
    COUNT(*) FILTER (WHERE is_active) as active_sessions,
    COUNT(DISTINCT user_id) as users_with_sessions
FROM user_sessions;
```

### Recent Activity
```sql
SELECT 
    user_id,
    device_name,
    platform,
    last_activity
FROM user_sessions 
WHERE is_active = true 
ORDER BY last_activity DESC 
LIMIT 10;
```

## Troubleshooting

### Common Issues

1. **Foreign Key Constraint Errors**
   - Check that your users table exists
   - Verify the user_id column type matches

2. **RLS Policy Issues**
   - Ensure auth.uid() returns correct user identifier
   - Adjust policies based on your authentication setup

3. **Index Creation Failures**
   - Check for existing conflicting indexes
   - Verify table exists before creating indexes

### Verification Checklist

- [ ] user_sessions table created
- [ ] All indexes present (5 indexes)
- [ ] Constraints working (UNIQUE, FOREIGN KEY)
- [ ] RLS enabled and policies active
- [ ] Helper functions created
- [ ] Active sessions view accessible
- [ ] Test insert/select works

## Environment Variables

Make sure your server has these environment variables:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret_key
```

## Next Steps

After running the database setup:

1. Deploy the updated server code
2. Test login with device tracking
3. Verify session invalidation works
4. Monitor session activity
5. Set up automated cleanup (optional)

## Support

If you encounter issues:
1. Check the verification script results
2. Review Supabase logs for errors
3. Ensure all environment variables are set
4. Test with a simple user session first
