-- Quick fix for ambiguous column reference in background job functions
-- Run this on your Supabase database to fix the "attempts" column ambiguity

-- Drop and recreate the function with proper column references
DROP FUNCTION IF EXISTS get_next_pending_job();

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
    attempts = background_jobs.attempts + 1
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
  RETURNING background_jobs.id, background_jobs.session_id, background_jobs.input_data, background_jobs.attempts;
END;
$$ LANGUAGE plpgsql;

-- Also fix the fail function
DROP FUNCTION IF EXISTS fail_background_job(UUID, TEXT, BOOLEAN);

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
  SELECT bj.attempts, bj.max_attempts 
  INTO current_attempts, max_attempts
  FROM background_jobs bj
  WHERE bj.id = job_id;
  
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