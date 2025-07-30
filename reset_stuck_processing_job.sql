-- Reset job that's stuck in 'processing' status
-- This happens when the background processor starts but gets terminated due to timeouts

UPDATE background_jobs 
SET 
    status = 'pending',
    attempts = 0,
    error_message = NULL,
    result_data = NULL,
    started_at = NULL,
    completed_at = NULL,
    next_retry_at = NULL
WHERE id = 'ce811ea7-dcd0-49c7-93d9-86c53e0505c5'
  AND status = 'processing';

-- Verify the update
SELECT 
    id,
    session_id,
    status,
    attempts,
    error_message,
    started_at,
    completed_at
FROM background_jobs 
WHERE id = 'ce811ea7-dcd0-49c7-93d9-86c53e0505c5';