-- Reset the current background job that was incorrectly skipped
-- This job was marked as completed but the email wasn't actually sent

UPDATE background_jobs 
SET 
    status = 'pending',
    attempts = 0,
    error_message = NULL,
    result_data = NULL,
    started_at = NULL,
    completed_at = NULL,
    next_retry_at = NULL
WHERE session_id = 'session_1753800088675_gy364o66j'
  AND id = 'c044b6e2-5616-45d5-b7f2-2ac75cfc1674';

-- Also clear the email_sent_via_background flag in generation_results
UPDATE generation_results 
SET email_sent_via_background = false
WHERE session_id = 'session_1753800088675_gy364o66j';

-- Verify the updates
SELECT 
    session_id,
    status,
    attempts,
    error_message,
    result_data,
    email_sent
FROM background_jobs 
WHERE session_id = 'session_1753800088675_gy364o66j';

SELECT 
    session_id,
    email_sent,
    email_sent_via_background
FROM generation_results 
WHERE session_id = 'session_1753800088675_gy364o66j';