-- Add email fields to generation_results table
ALTER TABLE generation_results 
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS user_email TEXT,
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for email fields
CREATE INDEX IF NOT EXISTS idx_generation_results_user_email ON generation_results(user_email);
CREATE INDEX IF NOT EXISTS idx_generation_results_email_sent ON generation_results(email_sent);

-- Add columns that might be missing from the original schema
ALTER TABLE generation_results 
ADD COLUMN IF NOT EXISTS user_image_url TEXT,
ADD COLUMN IF NOT EXISTS user_image_path TEXT,
ADD COLUMN IF NOT EXISTS generated_image_url TEXT,
ADD COLUMN IF NOT EXISTS generated_image_path TEXT;

-- Create a downloads tracking table
CREATE TABLE IF NOT EXISTS poster_downloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES user_sessions(session_id) ON DELETE CASCADE,
  download_type TEXT NOT NULL CHECK (download_type IN ('generated_poster', 'direct_download')),
  download_method TEXT NOT NULL CHECK (download_method IN ('button_click', 'email_link', 'direct_download')),
  poster_url TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create index for downloads tracking
CREATE INDEX IF NOT EXISTS idx_poster_downloads_session_id ON poster_downloads(session_id);
CREATE INDEX IF NOT EXISTS idx_poster_downloads_type ON poster_downloads(download_type);
CREATE INDEX IF NOT EXISTS idx_poster_downloads_created_at ON poster_downloads(created_at);

-- Create email logs table for tracking email sends
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES user_sessions(session_id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  email_type TEXT NOT NULL DEFAULT 'poster_ready',
  email_status TEXT NOT NULL CHECK (email_status IN ('sent', 'failed', 'bounced', 'delivered', 'opened', 'clicked')),
  mandrill_message_id TEXT,
  error_message TEXT,
  poster_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create indexes for email logs
CREATE INDEX IF NOT EXISTS idx_email_logs_session_id ON email_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_address ON email_logs(email_address);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(email_status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at); 