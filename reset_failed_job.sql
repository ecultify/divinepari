-- Reset failed background job to retry with fixed Segmind API parameters
-- Run this in your Supabase SQL editor

UPDATE background_jobs 
SET 
    status = 'pending',
    attempts = 0,
    error_message = NULL,
    started_at = NULL,
    completed_at = NULL,
    next_retry_at = NULL
WHERE session_id = 'session_1753800088675_gy364o66j'
  AND status = 'failed';

-- Verify the update
SELECT 
    session_id,
    status,
    attempts,
    error_message,
    created_at
FROM background_jobs 
WHERE session_id = 'session_1753800088675_gy364o66j';