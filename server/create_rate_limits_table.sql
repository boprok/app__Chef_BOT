-- Rate Limiting Table for Chef Bot
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    hour_key TEXT NOT NULL, -- Format: YYYY-MM-DD-HH
    request_count INTEGER DEFAULT 0,
    plan TEXT DEFAULT 'free', -- 'free' or 'pro'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index to prevent duplicate entries for same user+hour
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_user_hour 
ON rate_limits(user_id, hour_key);

-- Create index for efficient cleanup of old records
CREATE INDEX IF NOT EXISTS idx_rate_limits_created_at 
ON rate_limits(created_at);

-- Add foreign key constraint to users table
ALTER TABLE rate_limits 
ADD CONSTRAINT fk_rate_limits_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Optional: Enable Row Level Security (RLS)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access
CREATE POLICY "Service role can manage rate_limits" ON rate_limits
FOR ALL USING (auth.role() = 'service_role');

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_rate_limits_updated_at 
BEFORE UPDATE ON rate_limits 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create function to cleanup old rate limit records (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM rate_limits 
    WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- You can run this manually or set up a cron job:
-- SELECT cleanup_old_rate_limits();
