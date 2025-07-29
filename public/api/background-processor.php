<?php
// Background Job Processor for Hostinger Cron Jobs
// This script processes face-swap jobs for users who left the website
// Should be run every 1-2 minutes via cron job

// Start output buffering to prevent any accidental output
ob_start();

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/background-processor.log');

// Set proper headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Load environment variables
require_once __DIR__ . '/../env.php';

// Function to log debug information
function debug_log($message, $data = null) {
    $logEntry = date('Y-m-d H:i:s') . ' [BACKGROUND] - ' . $message;
    if ($data !== null) {
        $logEntry .= ' - ' . print_r($data, true);
    }
    error_log($logEntry . "\n", 3, __DIR__ . '/background-processor.log');
}

// Start processing
debug_log('Background processor started');

try {
    // Get Supabase configuration
    $SUPABASE_URL = $_ENV['SUPABASE_URL'] ?? 'https://nuoizrqsnxoldzcvwszu.supabase.co';
    $SUPABASE_SERVICE_KEY = $_ENV['SUPABASE_SERVICE_KEY'] ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51b2l6cnFzbnhvbGR6Y3Z3c3p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI1MDA5MCwiZXhwIjoyMDY1ODI2MDkwfQ.Cy3jKTJX0hG-tUj5cRgK3peSxAor0JyBPUlaZJxwnt8';
    $SEGMIND_API_KEY = $_ENV['SEGMIND_API_KEY'] ?? '';

    if (empty($SEGMIND_API_KEY)) {
        throw new Exception('SEGMIND_API_KEY not configured');
    }

    debug_log('Configuration loaded', ['has_segmind_key' => !empty($SEGMIND_API_KEY)]);

    // Function to call Supabase function
    function callSupabaseFunction($functionName, $params = []) {
        global $SUPABASE_URL, $SUPABASE_SERVICE_KEY;
        
        $url = $SUPABASE_URL . '/rest/v1/rpc/' . $functionName;
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($params));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $SUPABASE_SERVICE_KEY,
            'Authorization: Bearer ' . $SUPABASE_SERVICE_KEY,
            'Content-Type: application/json',
            'Prefer: return=representation'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            debug_log("Supabase function call failed", ['function' => $functionName, 'status' => $httpCode, 'response' => $response]);
            return false;
        }
        
        return json_decode($response, true);
    }

    // Function to update Supabase table
    function updateSupabaseTable($table, $data, $conditions = []) {
        global $SUPABASE_URL, $SUPABASE_SERVICE_KEY;
        
        $url = $SUPABASE_URL . '/rest/v1/' . $table;
        if (!empty($conditions)) {
            $queryParams = [];
            foreach ($conditions as $key => $value) {
                $queryParams[] = $key . '=eq.' . urlencode($value);
            }
            $url .= '?' . implode('&', $queryParams);
        }
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $SUPABASE_SERVICE_KEY,
            'Authorization: Bearer ' . $SUPABASE_SERVICE_KEY,
            'Content-Type: application/json',
            'Prefer: return=minimal'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return $httpCode === 204; // 204 = No Content (success)
    }

    // Function to insert into Supabase table (for upsert operations)
    function insertIntoSupabaseTable($table, $data) {
        global $SUPABASE_URL, $SUPABASE_SERVICE_KEY;
        
        $url = $SUPABASE_URL . '/rest/v1/' . $table;
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $SUPABASE_SERVICE_KEY,
            'Authorization: Bearer ' . $SUPABASE_SERVICE_KEY,
            'Content-Type: application/json',
            'Prefer: return=minimal'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return $httpCode === 201; // 201 = Created (success)
    }

    // Function to query Supabase table
    function querySupabaseTable($table, $params = []) {
        global $SUPABASE_URL, $SUPABASE_SERVICE_KEY;
        
        $url = $SUPABASE_URL . '/rest/v1/' . $table;
        
        // Add parameters to URL
        if (!empty($params)) {
            $queryParams = [];
            foreach ($params as $key => $value) {
                $queryParams[] = $key . '=' . urlencode($value);
            }
            $url .= '?' . implode('&', $queryParams);
        }
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $SUPABASE_SERVICE_KEY,
            'Authorization: Bearer ' . $SUPABASE_SERVICE_KEY
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            debug_log('Supabase table query failed', [
                'table' => $table,
                'status' => $httpCode,
                'response' => $response,
                'params' => $params
            ]);
            return false;
        }
        
        return json_decode($response, true);
    }

    // Get next pending job
    debug_log('Getting next pending job...');
    
    // First, let's check what pending jobs exist
    $pendingJobsCheck = querySupabaseTable('background_jobs', [
        'status' => 'eq.pending',
        'select' => 'id,session_id,status,attempts,max_attempts,next_retry_at,created_at'
    ]);
    debug_log('Pending jobs in table', ['jobs' => $pendingJobsCheck]);
    
    $jobResult = callSupabaseFunction('get_next_pending_job');
    debug_log('get_next_pending_job result', ['result' => $jobResult, 'is_empty' => empty($jobResult)]);
    
    if (!$jobResult || empty($jobResult)) {
        debug_log('No pending jobs found by function');
        ob_end_clean();
        echo json_encode(['success' => true, 'message' => 'No pending jobs']);
        exit;
    }

    $job = $jobResult[0]; // Function returns array of results
    $jobId = $job['job_id'];
    $sessionId = $job['session_id'];
    $inputData = $job['input_data'];
    $attempts = $job['attempts'];

    debug_log('Processing job', ['job_id' => $jobId, 'session_id' => $sessionId, 'attempts' => $attempts]);

    // Ensure session exists in user_sessions table
    $sessionExists = ensureSessionExists($sessionId);
    if (!$sessionExists) {
        debug_log('Failed to create/verify session', ['session_id' => $sessionId]);
    }

    // Check if email was already sent to avoid duplicates
    $emailAlreadySent = checkIfEmailAlreadySent($sessionId);
    if ($emailAlreadySent) {
        debug_log('Email already sent for session, marking job as completed', ['session_id' => $sessionId]);
        callSupabaseFunction('complete_background_job', [
            'job_id' => $jobId,
            'result_data' => ['skipped' => 'email_already_sent'],
            'email_sent' => false
        ]);
        
        ob_end_clean();
        echo json_encode(['success' => true, 'message' => 'Email already sent']);
        exit;
    }

    // Extract job data
    $gender = $inputData['gender'];
    $posterName = $inputData['posterName'];
    $userImageUrl = $inputData['userImageUrl'];
    $userName = $inputData['userName'] ?? '';
    $userEmail = $inputData['userEmail'] ?? '';

    debug_log('Job details', [
        'gender' => $gender,
        'poster' => $posterName,
        'has_image' => !empty($userImageUrl),
        'has_email' => !empty($userEmail)
    ]);

    if (empty($userImageUrl) || empty($userEmail)) {
        throw new Exception('Missing required job data: userImageUrl or userEmail');
    }

    // Process the face swap using the same logic as the main processor
    $result = processFaceSwapBackground($userImageUrl, $posterName, $sessionId);
    
    if ($result['success']) {
        // Send email notification
        $emailResult = sendEmailNotification($userEmail, $userName, $result['imageUrl'], $sessionId);
        
        // Mark job as completed
        callSupabaseFunction('complete_background_job', [
            'job_id' => $jobId,
            'result_data' => [
                'imageUrl' => $result['imageUrl'],
                'supabaseUrl' => $result['supabaseUrl'] ?? null
            ],
            'email_sent' => $emailResult
        ]);

        // Mark in generation_results table (create if doesn't exist)
        if ($emailResult) {
            // First try to update existing record
            $updateResult = updateSupabaseTable('generation_results', [
                'email_sent_via_background' => true,
                'user_email' => $userEmail,
                'user_name' => $userName
            ], ['session_id' => $sessionId]);
            
            // If update failed (record doesn't exist), create new record
            if (!$updateResult) {
                debug_log('Generation result not found, creating new record');
                insertIntoSupabaseTable('generation_results', [
                    'session_id' => $sessionId,
                    'gender' => $gender,
                    'poster_selected' => $posterName,
                    'user_image_uploaded' => true,
                    'processing_status' => 'completed',
                    'result_image_generated' => true,
                    'email_sent_via_background' => true,
                    'user_email' => $userEmail,
                    'user_name' => $userName
                ]);
            }
        }

        debug_log('Job completed successfully', ['email_sent' => $emailResult]);
        
        ob_end_clean();
        echo json_encode([
            'success' => true, 
            'message' => 'Job processed successfully',
            'email_sent' => $emailResult
        ]);
    } else {
        // Mark job as failed
        callSupabaseFunction('fail_background_job', [
            'job_id' => $jobId,
            'error_msg' => $result['error'],
            'should_retry' => $attempts < 2 // Retry up to 3 total attempts
        ]);

        debug_log('Job failed', ['error' => $result['error'], 'attempts' => $attempts]);
        
        ob_end_clean();
        echo json_encode([
            'success' => false, 
            'message' => 'Job processing failed',
            'error' => $result['error']
        ]);
    }

} catch (Exception $e) {
    debug_log('Background processor exception', ['error' => $e->getMessage()]);
    
    if (isset($jobId)) {
        callSupabaseFunction('fail_background_job', [
            'job_id' => $jobId,
            'error_msg' => $e->getMessage(),
            'should_retry' => true
        ]);
    }
    
    ob_end_clean();
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage()
    ]);
}

// Helper function to ensure session exists
function ensureSessionExists($sessionId) {
    global $SUPABASE_URL, $SUPABASE_SERVICE_KEY;
    
    // First check if session exists
    $url = $SUPABASE_URL . '/rest/v1/user_sessions?session_id=eq.' . urlencode($sessionId);
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $SUPABASE_SERVICE_KEY,
        'Authorization: Bearer ' . $SUPABASE_SERVICE_KEY
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $data = json_decode($response, true);
        if (!empty($data)) {
            return true; // Session exists
        }
    }
    
    // Session doesn't exist, create it
    debug_log('Creating missing session', ['session_id' => $sessionId]);
    return insertIntoSupabaseTable('user_sessions', [
        'session_id' => $sessionId
    ]);
}

// Helper function to check if email was already sent
function checkIfEmailAlreadySent($sessionId) {
    global $SUPABASE_URL, $SUPABASE_SERVICE_KEY;
    
    // Check generation_results table
    $url = $SUPABASE_URL . '/rest/v1/generation_results?session_id=eq.' . urlencode($sessionId) . '&select=email_sent,email_sent_via_background';
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $SUPABASE_SERVICE_KEY,
        'Authorization: Bearer ' . $SUPABASE_SERVICE_KEY
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $data = json_decode($response, true);
        if (!empty($data) && ($data[0]['email_sent'] || $data[0]['email_sent_via_background'])) {
            return true;
        }
    }
    
    return false;
}

// Face swap processing function (reusing main logic)
function processFaceSwapBackground($userImageUrl, $posterName, $sessionId) {
    global $SEGMIND_API_KEY;
    
    try {
        debug_log('Starting face swap processing', ['poster' => $posterName]);
        
        // Get user image data
        $userImageData = file_get_contents($userImageUrl);
        if (!$userImageData) {
            throw new Exception('Failed to download user image');
        }
        
        // Get poster image path
        // Check if posterName already has extension
        if (pathinfo($posterName, PATHINFO_EXTENSION) === '') {
            $posterPath = __DIR__ . '/../images/posters/' . $posterName . '.avif';
        } else {
            $posterPath = __DIR__ . '/../images/posters/' . $posterName;
        }
        
        if (!file_exists($posterPath)) {
            debug_log('Poster file not found', ['posterName' => $posterName, 'posterPath' => $posterPath]);
            throw new Exception('Poster file not found: ' . $posterName . ' (Path: ' . $posterPath . ')');
        }
        
        $posterData = file_get_contents($posterPath);
        if (!$posterData) {
            throw new Exception('Failed to read poster file');
        }
        
        // Determine target side based on poster name
        $targetSide = getTargetSide($posterName);
        
        // Extract the target side from poster
        $extractedSideData = extractPosterSide($posterData, $targetSide, $posterName);
        
        // Resize user image
        $resizedUserData = resizeImage($userImageData, 1024, 1024);
        
        // Prepare images for Segmind API
        $sourceImageBase64 = base64_encode($resizedUserData);
        $targetImageBase64 = base64_encode($extractedSideData);
        
        // Call Segmind API
        $faceSwapData = [
            'source_image_base64' => $sourceImageBase64,
            'target_image_base64' => $targetImageBase64,
            'face_restore' => true,
            'face_upsample' => true,
            'upscale' => 1,
            'codeformer_fidelity' => 0.8,
            'style_type' => 'normal',
            'seed' => rand(1, 1000000),
            'image_format' => 'png',
            'image_quality' => 95,
            'hardware' => 'fast',
            'base64' => true
        ];
        
        $ch = curl_init('https://api.segmind.com/v1/faceswap-v4');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($faceSwapData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'x-api-key: ' . $SEGMIND_API_KEY,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 120);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            throw new Exception('Segmind API request failed with status: ' . $httpCode);
        }
        
        $responseData = json_decode($response, true);
        if (!$responseData || !isset($responseData['image'])) {
            throw new Exception('Invalid Segmind API response');
        }
        
        // Get the swapped result
        $swappedResultData = base64_decode($responseData['image']);
        
        // Composite result back onto original poster
        $finalImageData = compositeFinalImage($posterData, $swappedResultData, $targetSide, $posterName);
        
        // Upload to Supabase storage
        $supabaseResult = uploadToSupabase($finalImageData, $sessionId . '_bg_' . time() . '.png');
        
        // Return as data URL for immediate use
        $finalImageBase64 = base64_encode($finalImageData);
        $imageDataUrl = 'data:image/png;base64,' . $finalImageBase64;
        
        debug_log('Face swap completed successfully');
        
        return [
            'success' => true,
            'imageUrl' => $imageDataUrl,
            'supabaseUrl' => $supabaseResult['url'] ?? null
        ];
        
    } catch (Exception $e) {
        debug_log('Face swap processing failed', ['error' => $e->getMessage()]);
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}

// Email notification function
function sendEmailNotification($userEmail, $userName, $posterUrl, $sessionId) {
    try {
        debug_log('Sending email notification', ['email' => $userEmail]);
        
        // Use the existing PHP email endpoint
        $emailData = [
            'to' => $userEmail,
            'userName' => $userName,
            'posterUrl' => $posterUrl,
            'sessionId' => $sessionId
        ];
        
        $ch = curl_init($_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . '/api/send-email.php');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($emailData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        $success = $httpCode === 200;
        debug_log('Email notification result', ['success' => $success, 'status' => $httpCode]);
        
        return $success;
    } catch (Exception $e) {
        debug_log('Email notification failed', ['error' => $e->getMessage()]);
        return false;
    }
}

// Include the helper functions from the main processor
// (getTargetSide, extractPosterSide, resizeImage, compositeFinalImage, uploadToSupabase)

function getTargetSide($posterName) {
    if (strpos($posterName, 'Option1F') !== false) {
        return 'right';
    } elseif (strpos($posterName, 'Option1M') !== false) {
        return 'left';
    } elseif (strpos($posterName, 'Option2F') !== false) {
        return 'left';
    } elseif (strpos($posterName, 'Option2M') !== false) {
        return 'left';
    } elseif (strpos($posterName, 'Option3F') !== false) {
        return 'right';
    } elseif (strpos($posterName, 'Option3M') !== false) {
        return 'right';
    }
    return 'right';
}

function resizeImage($imageData, $width = 1024, $height = 1024) {
    $image = imagecreatefromstring($imageData);
    if (!$image) {
        throw new Exception('Invalid image data');
    }
    
    $originalWidth = imagesx($image);
    $originalHeight = imagesy($image);
    
    $scale = min($width / $originalWidth, $height / $originalHeight);
    $newWidth = intval($originalWidth * $scale);
    $newHeight = intval($originalHeight * $scale);
    
    $resized = imagecreatetruecolor($newWidth, $newHeight);
    imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $originalWidth, $originalHeight);
    
    ob_start();
    imagejpeg($resized, null, 95);
    $resizedData = ob_get_contents();
    ob_end_clean();
    
    imagedestroy($image);
    imagedestroy($resized);
    
    return $resizedData;
}

function extractPosterSide($posterData, $targetSide, $posterName = '') {
    $image = imagecreatefromstring($posterData);
    if (!$image) {
        throw new Exception('Invalid poster image data');
    }
    $width = imagesx($image);
    $height = imagesy($image);
    
    if ($targetSide === 'right' && strpos($posterName, 'Option3F') !== false) {
        $rightWidth = intval($width * 0.45);
        $extracted = imagecreatetruecolor($rightWidth, $height);
        imagecopy($extracted, $image, $width - $rightWidth, 0, 0, 0, $rightWidth, $height);
    } else {
        $halfWidth = intval($width / 2);
        $extracted = imagecreatetruecolor($halfWidth, $height);
        if ($targetSide === 'left') {
            imagecopy($extracted, $image, 0, 0, 0, 0, $halfWidth, $height);
        } else {
            imagecopy($extracted, $image, 0, 0, $halfWidth, 0, $halfWidth, $height);
        }
    }
    
    ob_start();
    imagepng($extracted, null, 9);
    $extractedData = ob_get_contents();
    ob_end_clean();
    imagedestroy($image);
    imagedestroy($extracted);
    return $extractedData;
}

function compositeFinalImage($originalPosterData, $swappedSideData, $targetSide, $posterName = '') {
    $originalImage = imagecreatefromstring($originalPosterData);
    $swappedImage = imagecreatefromstring($swappedSideData);
    if (!$originalImage || !$swappedImage) {
        throw new Exception('Invalid image data for compositing');
    }
    
    $originalWidth = imagesx($originalImage);
    $originalHeight = imagesy($originalImage);
    
    if ($targetSide === 'right' && strpos($posterName, 'Option3F') !== false) {
        $rightWidth = intval($originalWidth * 0.45);
        imagecopy($originalImage, $swappedImage, $originalWidth - $rightWidth, 0, 0, 0, $rightWidth, $originalHeight);
    } else {
        $halfWidth = intval($originalWidth / 2);
        if ($targetSide === 'left') {
            imagecopy($originalImage, $swappedImage, 0, 0, 0, 0, $halfWidth, $originalHeight);
        } else {
            imagecopy($originalImage, $swappedImage, $halfWidth, 0, 0, 0, $halfWidth, $originalHeight);
        }
    }
    
    ob_start();
    imagepng($originalImage, null, 9);
    $finalData = ob_get_contents();
    ob_end_clean();
    imagedestroy($originalImage);
    imagedestroy($swappedImage);
    return $finalData;
}

function uploadToSupabase($imageData, $filename) {
    global $SUPABASE_URL, $SUPABASE_SERVICE_KEY;
    
    $bucket = 'generated-posters';
    $url = $SUPABASE_URL . '/storage/v1/object/' . $bucket . '/' . $filename;
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $imageData);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $SUPABASE_SERVICE_KEY,
        'Content-Type: image/png'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        return [
            'url' => $SUPABASE_URL . '/storage/v1/object/public/' . $bucket . '/' . $filename,
            'path' => $bucket . '/' . $filename
        ];
    }
    
    return null;
}

?>