-- Background Jobs Migration for Hostinger Background Processing
-- This enables users to leave the website while their poster is being generated

-- Create background_jobs table
CREATE TABLE IF NOT EXISTS background_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES user_sessions(session_id) ON DELETE CASCADE,
  job_type TEXT NOT NULL DEFAULT 'face_swap_generation',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 1, -- Higher number = higher priority
  
  -- Job input data
  input_data JSONB NOT NULL, -- Stores all data needed for processing
  
  -- Job result data
  result_data JSONB, -- Stores processing results
  error_message TEXT,
  
  -- Processing metadata
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  
  -- Email tracking
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_background_jobs_status ON background_jobs(status);
CREATE INDEX IF NOT EXISTS idx_background_jobs_session_id ON background_jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_background_jobs_priority ON background_jobs(priority DESC);
CREATE INDEX IF NOT EXISTS idx_background_jobs_next_retry ON background_jobs(next_retry_at) WHERE status = 'pending' AND next_retry_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_background_jobs_created_pending ON background_jobs(created_at) WHERE status = 'pending';

-- Add email_sent_via_background column to generation_results table
ALTER TABLE generation_results 
ADD COLUMN IF NOT EXISTS email_sent_via_background BOOLEAN DEFAULT FALSE;

-- Create function to get next pending job
CREATE OR REPLACE FUNCTION get_next_pending_job()
RETURNS TABLE(
  job_id UUID,
  session_id TEXT,
  input_data JSONB,
  attempts INTEGER
) AS $$
BEGIN
  RETURN QUERY
  UPDATE background_jobs 
  SET 
    status = 'processing',
    started_at = TIMEZONE('utc'::TEXT, NOW()),
    attempts = attempts + 1
  WHERE id = (
    SELECT bj.id
    FROM background_jobs bj
    WHERE bj.status = 'pending' 
      AND (bj.next_retry_at IS NULL OR bj.next_retry_at <= TIMEZONE('utc'::TEXT, NOW()))
      AND bj.attempts < bj.max_attempts
    ORDER BY bj.priority DESC, bj.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING id, background_jobs.session_id, background_jobs.input_data, background_jobs.attempts;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark job as completed
CREATE OR REPLACE FUNCTION complete_background_job(
  job_id UUID,
  result_data JSONB DEFAULT NULL,
  email_sent BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE background_jobs 
  SET 
    status = 'completed',
    completed_at = TIMEZONE('utc'::TEXT, NOW()),
    result_data = complete_background_job.result_data,
    email_sent = complete_background_job.email_sent,
    email_sent_at = CASE WHEN complete_background_job.email_sent THEN TIMEZONE('utc'::TEXT, NOW()) ELSE NULL END
  WHERE id = job_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark job as failed
CREATE OR REPLACE FUNCTION fail_background_job(
  job_id UUID,
  error_msg TEXT,
  should_retry BOOLEAN DEFAULT TRUE
)
RETURNS BOOLEAN AS $$
DECLARE
  current_attempts INTEGER;
  max_attempts INTEGER;
BEGIN
  SELECT attempts, background_jobs.max_attempts 
  INTO current_attempts, max_attempts
  FROM background_jobs 
  WHERE id = job_id;
  
  IF current_attempts >= max_attempts OR NOT should_retry THEN
    -- Mark as permanently failed
    UPDATE background_jobs 
    SET 
      status = 'failed',
      completed_at = TIMEZONE('utc'::TEXT, NOW()),
      error_message = error_msg
    WHERE id = job_id;
  ELSE
    -- Schedule for retry (exponential backoff: 2^attempts minutes)
    UPDATE background_jobs 
    SET 
      status = 'pending',
      error_message = error_msg,
      next_retry_at = TIMEZONE('utc'::TEXT, NOW()) + INTERVAL '1 minute' * POWER(2, current_attempts),
      started_at = NULL
    WHERE id = job_id;
  END IF;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;