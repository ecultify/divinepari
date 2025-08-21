<?php
// Start output buffering to prevent any accidental output
ob_start();

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

// Increase limits for image processing
set_time_limit(600); // 10 minutes max execution time
ini_set('memory_limit', '512M');

// Set proper headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    ob_end_clean(); // Clear any buffered output
    exit(0);
}

// Function to log debug information with enhanced details
function debug_log($message, $data = null, $level = 'INFO') {
    $logEntry = date('Y-m-d H:i:s') . " [$level] - " . $message;
    if ($data !== null) {
        $logEntry .= ' - ' . print_r($data, true);
    }
    error_log($logEntry . "\n", 3, __DIR__ . '/debug.log');
    
    // Also log to separate error log for failures
    if ($level === 'ERROR' || $level === 'CRITICAL') {
        error_log($logEntry . "\n", 3, __DIR__ . '/error_detailed.log');
    }
}

// Function to log processing step with timing
function log_processing_step($step, $sessionId, $data = null, $startTime = null) {
    $timing = '';
    if ($startTime !== null) {
        $duration = round(microtime(true) - $startTime, 3);
        $timing = " (took {$duration}s)";
    }
    
    debug_log("STEP: $step - Session: $sessionId" . $timing, $data, 'STEP');
}

// Function to check API health before processing
function checkSegmindAPIHealth($apiKey) {
    $healthCheck = [
        'source_image' => '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAyADIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD6pooooA',
        'target_image' => '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAyADIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD6pooooA',
        'model_type' => 'quality',
        'swap_type' => 'face',
        'style_type' => 'normal',
        'image_format' => 'png',
        'image_quality' => 50,
        'hardware' => 'fast',
        'base64' => true
    ];
    
    $ch = curl_init('https://api.segmind.com/v1/faceswap-v4');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($healthCheck));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'x-api-key: ' . $apiKey,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30); // Short timeout for health check
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return $httpCode === 200;
}

// Function to call Segmind API with retry logic
function callSegmindAPIWithRetry($faceSwapData, $apiKey, $maxRetries = 3, $baseTimeout = 300) {
    $sessionId = $GLOBALS['sessionId'] ?? 'unknown';
    
    // Check API health before starting if it's the first attempt
    $healthCheckStart = microtime(true);
    $apiHealthy = checkSegmindAPIHealth($apiKey);
    $healthCheckDuration = round(microtime(true) - $healthCheckStart, 3);
    
    debug_log("API health check completed", [
        'session_id' => $sessionId,
        'healthy' => $apiHealthy,
        'duration' => $healthCheckDuration . 's'
    ], $apiHealthy ? 'INFO' : 'WARN');
    
    if (!$apiHealthy) {
        debug_log("API health check failed, using conservative retry strategy", [
            'session_id' => $sessionId,
            'original_max_retries' => $maxRetries,
            'original_timeout' => $baseTimeout
        ], 'WARN');
        $maxRetries = 5; // More retries when API is having issues
        $baseTimeout = 240; // Shorter initial timeout when API is struggling
    }
    
    $allAttemptErrors = [];
    $totalStartTime = microtime(true);
    
    for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
        $attemptStartTime = microtime(true);
        
        // Increase timeout with each retry
        $timeout = $baseTimeout + (($attempt - 1) * 60); // 300s, 360s, 420s
        
        debug_log("Starting Segmind API attempt $attempt/$maxRetries", [
            'session_id' => $sessionId,
            'timeout' => $timeout . 's',
            'attempt_delay' => $attempt > 1 ? round($attemptStartTime - $totalStartTime, 3) . 's' : '0s'
        ]);
        
        $ch = curl_init('https://api.segmind.com/v1/faceswap-v4');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($faceSwapData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'x-api-key: ' . $apiKey,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 30);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_MAXREDIRS, 3);
        
        $curlStartTime = microtime(true);
        $response = curl_exec($ch);
        $curlEndTime = microtime(true);
        $duration = round($curlEndTime - $curlStartTime, 3);
        
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        $curlInfo = curl_getinfo($ch);
        curl_close($ch);
        
        $attemptLog = [
            'session_id' => $sessionId,
            'attempt' => $attempt,
            'http_code' => $httpCode,
            'duration' => $duration . 's',
            'timeout' => $timeout . 's',
            'curl_error' => $curlError,
            'response_size' => strlen($response ?? ''),
            'connect_time' => round($curlInfo['connect_time'] ?? 0, 3) . 's',
            'namelookup_time' => round($curlInfo['namelookup_time'] ?? 0, 3) . 's',
            'total_time' => round($curlInfo['total_time'] ?? 0, 3) . 's'
        ];
        
        // Handle cURL errors
        if ($curlError) {
            $errorMsg = "cURL error on attempt $attempt: $curlError";
            $attemptLog['error_type'] = 'curl_error';
            $allAttemptErrors[] = $attemptLog;
            
            debug_log($errorMsg, $attemptLog, 'ERROR');
            
            if ($attempt === $maxRetries) {
                debug_log("API connection failed after all attempts", [
                    'session_id' => $sessionId,
                    'total_attempts' => $maxRetries,
                    'total_duration' => round(microtime(true) - $totalStartTime, 3) . 's',
                    'all_errors' => $allAttemptErrors
                ], 'CRITICAL');
                throw new Exception("API connection failed after $maxRetries attempts: $curlError");
            }
            
            // Wait before retry (improved exponential backoff with jitter)
            $backoffTime = min(pow(2, $attempt), 30); // 2s, 4s, 8s (max 30s)
            $jitter = rand(0, 1000) / 1000; // Add 0-1s random jitter
            $totalBackoff = $backoffTime + $jitter;
            
            debug_log("Waiting before retry", [
                'session_id' => $sessionId,
                'backoff_time' => round($totalBackoff, 3) . 's',
                'next_attempt' => $attempt + 1
            ]);
            
            sleep($totalBackoff);
            continue;
        }
        
        // Handle HTTP errors that should be retried
        if (in_array($httpCode, [429, 500, 502, 503, 504])) {
            $errorMsg = "Segmind API returned retryable error: HTTP $httpCode";
            $attemptLog['error_type'] = 'retryable_http_error';
            $attemptLog['response_preview'] = substr($response ?? '', 0, 200);
            $allAttemptErrors[] = $attemptLog;
            
            debug_log($errorMsg, $attemptLog, 'ERROR');
            
            if ($attempt === $maxRetries) {
                debug_log("API request failed after all retryable attempts", [
                    'session_id' => $sessionId,
                    'final_http_code' => $httpCode,
                    'total_attempts' => $maxRetries,
                    'total_duration' => round(microtime(true) - $totalStartTime, 3) . 's',
                    'all_errors' => $allAttemptErrors
                ], 'CRITICAL');
                throw new Exception("API request failed after $maxRetries attempts with HTTP $httpCode");
            }
            
            // Wait before retry (improved exponential backoff with jitter)
            $backoffTime = min(pow(2, $attempt), 30); // 2s, 4s, 8s (max 30s)
            $jitter = rand(0, 1000) / 1000; // Add 0-1s random jitter
            $totalBackoff = $backoffTime + $jitter;
            
            debug_log("Waiting before retry", [
                'session_id' => $sessionId,
                'backoff_time' => round($totalBackoff, 3) . 's',
                'next_attempt' => $attempt + 1
            ]);
            
            sleep($totalBackoff);
            continue;
        }
        
        // Handle other HTTP errors (don't retry)
        if ($httpCode !== 200) {
            $attemptLog['error_type'] = 'non_retryable_http_error';
            $attemptLog['response_preview'] = substr($response ?? '', 0, 500);
            
            debug_log("Non-retryable HTTP error", $attemptLog, 'ERROR');
            throw new Exception("API request failed with HTTP $httpCode. Response: " . substr($response ?? '', 0, 200));
        }
        
        // Try to parse response
        $responseData = json_decode($response, true);
        $jsonError = json_last_error();
        
        if ($jsonError !== JSON_ERROR_NONE || !$responseData || !isset($responseData['image'])) {
            $errorMsg = "Invalid API response on attempt $attempt";
            $attemptLog['error_type'] = 'invalid_response';
            $attemptLog['json_error'] = $jsonError;
            $attemptLog['json_error_msg'] = json_last_error_msg();
            $attemptLog['response_preview'] = substr($response ?? '', 0, 300);
            $attemptLog['has_image_key'] = isset($responseData['image']);
            $allAttemptErrors[] = $attemptLog;
            
            debug_log($errorMsg, $attemptLog, 'ERROR');
            
            if ($attempt === $maxRetries) {
                debug_log("Invalid API response after all attempts", [
                    'session_id' => $sessionId,
                    'total_attempts' => $maxRetries,
                    'total_duration' => round(microtime(true) - $totalStartTime, 3) . 's',
                    'all_errors' => $allAttemptErrors
                ], 'CRITICAL');
                throw new Exception("Invalid API response after $maxRetries attempts. Last JSON error: " . json_last_error_msg());
            }
            
            // Wait before retry for invalid response
            $backoffTime = min(pow(2, $attempt - 1), 15); // 1s, 2s, 4s (max 15s)
            debug_log("Waiting before retry", [
                'session_id' => $sessionId,
                'backoff_time' => $backoffTime . 's',
                'next_attempt' => $attempt + 1
            ]);
            sleep($backoffTime);
            continue;
        }
        
        // Success!
        $successLog = array_merge($attemptLog, [
            'success' => true,
            'response_image_size' => strlen($responseData['image']),
            'total_duration' => round(microtime(true) - $totalStartTime, 3) . 's'
        ]);
        
        debug_log("Segmind API successful on attempt $attempt", $successLog);
        
        return $responseData;
    }
    
    // This should never be reached, but just in case
    debug_log("Unexpected error in API retry logic", [
        'session_id' => $sessionId,
        'all_errors' => $allAttemptErrors
    ], 'CRITICAL');
    throw new Exception("Unexpected error in API retry logic");
}

// Start debugging
debug_log('FaceSwap API called', [
    'method' => $_SERVER['REQUEST_METHOD'],
    'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'Not set',
    'content_length' => $_SERVER['CONTENT_LENGTH'] ?? 'Not set'
]);

try {
    // Check if required extensions are available
    $required_extensions = ['gd', 'curl', 'json'];
    $missing_extensions = [];
    
    foreach ($required_extensions as $ext) {
        if (!extension_loaded($ext)) {
            $missing_extensions[] = $ext;
        }
    }
    
    if (!empty($missing_extensions)) {
        debug_log('Missing PHP extensions detected', ['missing' => $missing_extensions], 'CRITICAL');
        throw new Exception('Missing PHP extensions: ' . implode(', ', $missing_extensions));
    }
    
    debug_log('All required extensions available', [
        'gd_version' => gd_info()['GD Version'] ?? 'unknown',
        'curl_version' => curl_version()['version'] ?? 'unknown',
        'memory_limit' => ini_get('memory_limit'),
        'max_execution_time' => ini_get('max_execution_time')
    ]);
    
    // Load configuration
    $config_path = __DIR__ . '/../config.php';
    if (!file_exists($config_path)) {
        throw new Exception('Configuration file not found at: ' . $config_path);
    }
    
    require_once $config_path;
    debug_log('Configuration loaded');
    
    // Get API key from environment variables
    $SEGMIND_API_KEY = $_ENV['SEGMIND_API_KEY'] ?? '';
    
    // Check if we have the API key
    debug_log('Checking API key...', ['SEGMIND_API_KEY_set' => !empty($SEGMIND_API_KEY)]);
    
    if (empty($SEGMIND_API_KEY)) {
        throw new Exception('Segmind API key not configured');
    }
    
    debug_log('API key configured successfully');
    
    // Supabase configuration
    $SUPABASE_URL = $_ENV['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
    $SUPABASE_SERVICE_KEY = $_ENV['SUPABASE_SERVICE_ROLE_KEY'] ?? '';

    function uploadToSupabase($imageData, $filename, $bucket = 'generated-posters') {
        global $SUPABASE_URL, $SUPABASE_SERVICE_KEY;
        
        if (empty($SUPABASE_URL) || empty($SUPABASE_SERVICE_KEY)) {
            error_log('Supabase not configured, skipping upload');
            return null;
        }
        
        $filePath = "generated-posters/" . $filename;
        $url = $SUPABASE_URL . "/storage/v1/object/" . $bucket . "/" . $filePath;
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $imageData);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $SUPABASE_SERVICE_KEY,
            'Content-Type: image/png',
            'Cache-Control: 3600',
            'x-upsert: true'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 60); // Increased timeout for upload
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200 || $httpCode === 201) {
            $publicUrl = $SUPABASE_URL . "/storage/v1/object/public/" . $bucket . "/" . $filePath;
            return [
                'url' => $publicUrl,
                'path' => $filePath
            ];
        } else {
            error_log("Supabase upload failed with status $httpCode: $response");
            return null;
        }
    }

    function sendFailureNotificationAsync($sessionId, $errorMessage) {
        try {
                    // Get user email from Supabase
        global $SUPABASE_URL, $SUPABASE_ANON_KEY, $SUPABASE_SERVICE_KEY;
        
        // Try service key first, then anon key
        $authKey = $SUPABASE_SERVICE_KEY ?: $SUPABASE_ANON_KEY;
        
        if (!$SUPABASE_URL || !$authKey) {
            debug_log('Failure email skipped - Supabase not configured', [
                'has_url' => !empty($SUPABASE_URL),
                'has_service_key' => !empty($SUPABASE_SERVICE_KEY),
                'has_anon_key' => !empty($SUPABASE_ANON_KEY)
            ]);
            return;
        }
            
            // Get user data from generation_results table
            $supabaseHeaders = [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $authKey,
                'apikey: ' . $authKey
            ];
            
            $url = $SUPABASE_URL . '/rest/v1/generation_results?session_id=eq.' . urlencode($sessionId) . '&select=user_email,user_name';
            
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_HTTPHEADER, $supabaseHeaders);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($httpCode === 200) {
                $userData = json_decode($response, true);
                if (!empty($userData) && !empty($userData[0]['user_email'])) {
                    $userEmail = $userData[0]['user_email'];
                    $userName = $userData[0]['user_name'] ?? 'there';
                    
                    // Determine failure reason for user-friendly message
                    $reason = 'processing_timeout';
                    if (strpos($errorMessage, 'timeout') !== false) {
                        $reason = 'processing_timeout';
                    } elseif (strpos($errorMessage, 'API') !== false || strpos($errorMessage, 'network') !== false) {
                        $reason = 'api_error';
                    } elseif (strpos($errorMessage, 'image') !== false) {
                        $reason = 'image_processing_error';
                    }
                    
                    // Call failure email API asynchronously
                    $failureData = [
                        'to' => $userEmail,
                        'userName' => $userName,
                        'sessionId' => $sessionId,
                        'reason' => $reason
                    ];
                    
                    // Make async request to failure email API
                    $emailUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . 
                               '://' . $_SERVER['HTTP_HOST'] . '/api/send-failure-email.php';
                    
                    $emailCh = curl_init($emailUrl);
                    curl_setopt($emailCh, CURLOPT_POST, true);
                    curl_setopt($emailCh, CURLOPT_POSTFIELDS, json_encode($failureData));
                    curl_setopt($emailCh, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
                    curl_setopt($emailCh, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($emailCh, CURLOPT_TIMEOUT, 10); // Longer timeout for reliability
                    curl_setopt($emailCh, CURLOPT_CONNECTTIMEOUT, 5);
                    curl_setopt($emailCh, CURLOPT_NOSIGNAL, 1); // Prevent signals from interrupting
                    
                    $emailResponse = curl_exec($emailCh);
                    $emailHttpCode = curl_getinfo($emailCh, CURLINFO_HTTP_CODE);
                    $emailError = curl_error($emailCh);
                    curl_close($emailCh);
                    
                    debug_log('Failure notification email result', [
                        'session_id' => $sessionId,
                        'user_email' => $userEmail,
                        'reason' => $reason,
                        'http_code' => $emailHttpCode,
                        'curl_error' => $emailError,
                        'response' => substr($emailResponse, 0, 200) // First 200 chars
                    ]);
                }
            }
        } catch (Exception $e) {
            debug_log('Failed to send failure notification', ['error' => $e->getMessage()]);
        }
    }

    function trackInSupabase($sessionId, $data) {
        global $SUPABASE_URL, $SUPABASE_SERVICE_KEY;
        
        if (empty($SUPABASE_URL) || empty($SUPABASE_SERVICE_KEY)) {
            return null;
        }
        
        $url = $SUPABASE_URL . "/rest/v1/generation_results";
        
        $payload = json_encode(array_merge([
            'session_id' => $sessionId,
            'created_at' => date('c')
        ], $data));
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $SUPABASE_SERVICE_KEY,
            'Content-Type: application/json',
            'apikey: ' . $SUPABASE_SERVICE_KEY,
            'Prefer: return=minimal'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15); // Increased timeout
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 201) {
            error_log("Supabase tracking failed with status $httpCode: $response");
        }
        
        return $httpCode === 201;
    }

    function getTargetSide($posterName) {
        // Updated logic based on specific poster requirements:
        // Option1F - right side
        // Option1M - left side  
        // Option2F - left side
        // Option2M - left side
        // Option3F - right side
        // Option3M - right side
        
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
        
        // Default fallback (shouldn't reach here with valid poster names)
        return 'right';
    }

    function resizeImage($imageData, $width = 1024, $height = 1024) {
        $image = imagecreatefromstring($imageData);
        if (!$image) {
            throw new Exception('Invalid image data');
        }
        
        $originalWidth = imagesx($image);
        $originalHeight = imagesy($image);
        
        // Calculate scaling to fit within bounds
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
        // Special case for Option3F: use 45% width for right side
        if ($targetSide === 'right' && strpos($posterName, 'Option3F') !== false) {
            $rightWidth = intval($width * 0.45);
            $extracted = imagecreatetruecolor($rightWidth, $height);
            imagecopy($extracted, $image, 0, 0, $width - $rightWidth, 0, $rightWidth, $height);
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
        // Special case for Option3F: use 45% width for right side
        if ($targetSide === 'right' && strpos($posterName, 'Option3F') !== false) {
            $rightWidth = intval($originalWidth * 0.45);
            $resizedSwapped = imagecreatetruecolor($rightWidth, $originalHeight);
            imagecopyresampled(
                $resizedSwapped,
                $swappedImage,
                0, 0, 0, 0,
                $rightWidth, $originalHeight,
                imagesx($swappedImage), imagesy($swappedImage)
            );
            // Paste at the right edge
            imagecopy($originalImage, $resizedSwapped, $originalWidth - $rightWidth, 0, 0, 0, $rightWidth, $originalHeight);
        } else {
            $halfWidth = intval($originalWidth / 2);
            $resizedSwapped = imagecreatetruecolor($halfWidth, $originalHeight);
            imagecopyresampled(
                $resizedSwapped,
                $swappedImage,
                0, 0, 0, 0,
                $halfWidth, $originalHeight,
                imagesx($swappedImage), imagesy($swappedImage)
            );
            if ($targetSide === 'left') {
                imagecopy($originalImage, $resizedSwapped, 0, 0, 0, 0, $halfWidth, $originalHeight);
            } else {
                imagecopy($originalImage, $resizedSwapped, $halfWidth, 0, 0, 0, $halfWidth, $originalHeight);
            }
        }
        ob_start();
        imagepng($originalImage, null, 9);
        $finalData = ob_get_contents();
        ob_end_clean();
        imagedestroy($originalImage);
        imagedestroy($swappedImage);
        imagedestroy($resizedSwapped);
        return $finalData;
    }

    // Check request method
    debug_log('Checking request method', ['method' => $_SERVER['REQUEST_METHOD']]);
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Only POST method allowed');
    }
    
    // Check form data
    debug_log('Checking form data', [
        'userImage_exists' => isset($_FILES['userImage']),
        'posterName_exists' => isset($_POST['posterName']),
        'sessionId_exists' => isset($_POST['sessionId']),
        'files_array' => array_keys($_FILES ?? []),
        'post_array' => array_keys($_POST ?? [])
    ]);
    
    // Get form data
    if (!isset($_FILES['userImage']) || !isset($_POST['posterName']) || !isset($_POST['sessionId'])) {
        debug_log('Missing required parameters', [
            'userImage_exists' => isset($_FILES['userImage']),
            'posterName_exists' => isset($_POST['posterName']),
            'sessionId_exists' => isset($_POST['sessionId']),
            'files_count' => count($_FILES ?? []),
            'post_count' => count($_POST ?? [])
        ], 'ERROR');
        throw new Exception('Missing required parameters');
    }
    
    $userImageFile = $_FILES['userImage'];
    $posterName = $_POST['posterName'];
    $sessionId = $_POST['sessionId'];
    
    // Make sessionId available globally for logging
    $GLOBALS['sessionId'] = $sessionId;
    
    // Validate user image file
    if ($userImageFile['error'] !== UPLOAD_ERR_OK) {
        debug_log('User image upload error', [
            'session_id' => $sessionId,
            'upload_error_code' => $userImageFile['error'],
            'upload_error_message' => [
                UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize',
                UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE',
                UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
                UPLOAD_ERR_NO_FILE => 'No file was uploaded',
                UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
                UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
                UPLOAD_ERR_EXTENSION => 'File upload stopped by extension'
            ][$userImageFile['error']] ?? 'Unknown upload error',
            'file_size' => $userImageFile['size'] ?? 'unknown',
            'file_type' => $userImageFile['type'] ?? 'unknown'
        ], 'ERROR');
        throw new Exception('User image upload failed: ' . ($userImageFile['error'] ?? 'unknown error'));
    }
    
    debug_log('Form data validated successfully', [
        'session_id' => $sessionId,
        'poster_name' => $posterName,
        'user_image_size' => $userImageFile['size'],
        'user_image_type' => $userImageFile['type']
    ]);
    
    log_processing_step('VALIDATION_COMPLETE', $sessionId, [
        'poster' => $posterName,
        'image_size_kb' => round($userImageFile['size'] / 1024, 2)
    ]);
    
    // Extract gender from poster name
    $gender = (strpos($posterName, 'M.jpg') !== false) ? 'male' : 'female';
    
    // Track start of processing in Supabase
    trackInSupabase($sessionId, [
        'gender' => $gender,
        'poster_selected' => $posterName,
        'user_image_uploaded' => true,
        'processing_status' => 'started',
        'result_image_generated' => false,
        'retry_attempt' => isset($_POST['retryAttempt']) ? intval($_POST['retryAttempt']) : 1
    ]);
    
    // Read user image
    $stepStartTime = microtime(true);
    log_processing_step('IMAGE_READ_START', $sessionId, ['tmp_file' => $userImageFile['tmp_name']]);
    
    $userImageData = file_get_contents($userImageFile['tmp_name']);
    if (!$userImageData) {
        debug_log('Failed to read user image file', [
            'session_id' => $sessionId,
            'tmp_name' => $userImageFile['tmp_name'],
            'file_exists' => file_exists($userImageFile['tmp_name']),
            'is_readable' => is_readable($userImageFile['tmp_name']),
            'file_size' => filesize($userImageFile['tmp_name']) ?: 'unknown'
        ], 'ERROR');
        throw new Exception('Failed to read user image');
    }
    
    log_processing_step('IMAGE_READ_COMPLETE', $sessionId, [
        'data_size_bytes' => strlen($userImageData),
        'data_size_kb' => round(strlen($userImageData) / 1024, 2)
    ], $stepStartTime);
    
    // Resize user image
    $stepStartTime = microtime(true);
    log_processing_step('IMAGE_RESIZE_START', $sessionId, ['target_size' => '1024x1024']);
    
    try {
        $resizedUserImageData = resizeImage($userImageData, 1024, 1024);
        $userImageBase64 = base64_encode($resizedUserImageData);
        
        log_processing_step('IMAGE_RESIZE_COMPLETE', $sessionId, [
            'original_size_bytes' => strlen($userImageData),
            'resized_size_bytes' => strlen($resizedUserImageData),
            'base64_size_bytes' => strlen($userImageBase64),
            'compression_ratio' => round(strlen($resizedUserImageData) / strlen($userImageData), 3)
        ], $stepStartTime);
    } catch (Exception $e) {
        debug_log('Image resize failed', [
            'session_id' => $sessionId,
            'error' => $e->getMessage(),
            'original_size' => strlen($userImageData)
        ], 'ERROR');
        throw new Exception('Failed to resize user image: ' . $e->getMessage());
    }
    
    // Load poster image
    $stepStartTime = microtime(true);
    $posterImagePath = "../images/posters/" . $posterName;
    
    log_processing_step('POSTER_LOAD_START', $sessionId, ['poster_path' => $posterImagePath]);
    
    if (!file_exists($posterImagePath)) {
        debug_log('Poster image not found', [
            'session_id' => $sessionId,
            'poster_name' => $posterName,
            'full_path' => $posterImagePath,
            'directory_exists' => is_dir(dirname($posterImagePath)),
            'directory_readable' => is_readable(dirname($posterImagePath)),
            'available_files' => is_dir(dirname($posterImagePath)) ? scandir(dirname($posterImagePath)) : 'directory not found'
        ], 'ERROR');
        throw new Exception('Poster image not found: ' . $posterName);
    }
    
    $posterData = file_get_contents($posterImagePath);
    if (!$posterData) {
        debug_log('Failed to read poster image', [
            'session_id' => $sessionId,
            'poster_path' => $posterImagePath,
            'file_size' => filesize($posterImagePath),
            'is_readable' => is_readable($posterImagePath)
        ], 'ERROR');
        throw new Exception('Failed to read poster image');
    }
    
    log_processing_step('POSTER_LOAD_COMPLETE', $sessionId, [
        'poster_size_bytes' => strlen($posterData),
        'poster_size_kb' => round(strlen($posterData) / 1024, 2)
    ], $stepStartTime);
    
    // Determine target side and extract
    $stepStartTime = microtime(true);
    $targetSide = getTargetSide($posterName);
    
    log_processing_step('POSTER_EXTRACT_START', $sessionId, [
        'target_side' => $targetSide,
        'poster_name' => $posterName
    ]);
    
    try {
        $extractedSideData = extractPosterSide($posterData, $targetSide, $posterName);
        $targetSideBase64 = base64_encode($extractedSideData);
        
        log_processing_step('POSTER_EXTRACT_COMPLETE', $sessionId, [
            'extracted_size_bytes' => strlen($extractedSideData),
            'base64_size_bytes' => strlen($targetSideBase64),
            'extraction_ratio' => round(strlen($extractedSideData) / strlen($posterData), 3)
        ], $stepStartTime);
    } catch (Exception $e) {
        debug_log('Poster extraction failed', [
            'session_id' => $sessionId,
            'target_side' => $targetSide,
            'poster_name' => $posterName,
            'error' => $e->getMessage()
        ], 'ERROR');
        throw new Exception('Failed to extract poster side: ' . $e->getMessage());
    }
    
    // Prepare FaceSwap v4 API request
    $faceSwapData = [
        'source_image' => $userImageBase64,
        'target_image' => $targetSideBase64,
        'model_type' => 'quality',
        'swap_type' => 'head',
        'style_type' => 'normal',
        'seed' => rand(1, 1000000),
        'image_format' => 'png',
        'image_quality' => 95,
        'hardware' => 'fast',
        'base64' => true
    ];
    
    // Prepare API call
    $apiStartTime = microtime(true);
    log_processing_step('SEGMIND_API_START', $sessionId, [
        'source_image_size' => strlen($userImageBase64),
        'target_image_size' => strlen($targetSideBase64),
        'model_type' => $faceSwapData['model_type'],
        'swap_type' => $faceSwapData['swap_type']
    ]);
    
    debug_log('Starting Segmind API call with retry logic', [
        'session_id' => $sessionId,
        'api_params' => array_merge($faceSwapData, [
            'source_image' => 'base64_data_' . strlen($userImageBase64) . '_bytes',
            'target_image' => 'base64_data_' . strlen($targetSideBase64) . '_bytes'
        ])
    ]);
    
    // Call Segmind FaceSwap v4 API with retry logic
    try {
        $responseData = callSegmindAPIWithRetry($faceSwapData, $SEGMIND_API_KEY);
        
        log_processing_step('SEGMIND_API_SUCCESS', $sessionId, [
            'response_image_size' => strlen($responseData['image'] ?? ''),
            'total_api_time' => round(microtime(true) - $apiStartTime, 3)
        ], $apiStartTime);
    } catch (Exception $e) {
        debug_log('Segmind API failed completely', [
            'session_id' => $sessionId,
            'error' => $e->getMessage(),
            'total_attempts_time' => round(microtime(true) - $apiStartTime, 3)
        ], 'ERROR');
        throw $e;
    }
    
    // Get the swapped result
    $stepStartTime = microtime(true);
    log_processing_step('IMAGE_COMPOSITE_START', $sessionId);
    
    $swappedResultData = base64_decode($responseData['image']);
    if (!$swappedResultData) {
        debug_log('Failed to decode API response image', [
            'session_id' => $sessionId,
            'response_image_length' => strlen($responseData['image'] ?? ''),
            'base64_valid' => base64_encode(base64_decode($responseData['image'] ?? '')) === ($responseData['image'] ?? '')
        ], 'ERROR');
        throw new Exception('Invalid image data from API response');
    }
    
    try {
        // Composite result back onto original poster
        $finalImageData = compositeFinalImage($posterData, $swappedResultData, $targetSide, $posterName);
        
        log_processing_step('IMAGE_COMPOSITE_COMPLETE', $sessionId, [
            'swapped_size_bytes' => strlen($swappedResultData),
            'final_size_bytes' => strlen($finalImageData),
            'final_size_kb' => round(strlen($finalImageData) / 1024, 2)
        ], $stepStartTime);
    } catch (Exception $e) {
        debug_log('Image compositing failed', [
            'session_id' => $sessionId,
            'target_side' => $targetSide,
            'poster_name' => $posterName,
            'swapped_data_size' => strlen($swappedResultData),
            'poster_data_size' => strlen($posterData),
            'error' => $e->getMessage()
        ], 'ERROR');
        throw new Exception('Failed to composite final image: ' . $e->getMessage());
    }
    
    // Upload to Supabase if configured
    $stepStartTime = microtime(true);
    $filename = $sessionId . '_' . time() . '.png';
    
    log_processing_step('SUPABASE_UPLOAD_START', $sessionId, ['filename' => $filename]);
    
    $supabaseResult = null;
    try {
        $supabaseResult = uploadToSupabase($finalImageData, $filename);
        
        if ($supabaseResult) {
            log_processing_step('SUPABASE_UPLOAD_SUCCESS', $sessionId, [
                'url' => $supabaseResult['url'],
                'path' => $supabaseResult['path']
            ], $stepStartTime);
        } else {
            log_processing_step('SUPABASE_UPLOAD_FAILED', $sessionId, ['reason' => 'uploadToSupabase returned null'], $stepStartTime);
        }
    } catch (Exception $e) {
        debug_log('Supabase upload exception', [
            'session_id' => $sessionId,
            'filename' => $filename,
            'error' => $e->getMessage()
        ], 'ERROR');
        log_processing_step('SUPABASE_UPLOAD_ERROR', $sessionId, ['error' => $e->getMessage()], $stepStartTime);
    }
    
    // Track completion in Supabase
    $trackingData = [
        'processing_status' => 'completed',
        'result_image_generated' => true
    ];
    
    if ($supabaseResult) {
        $trackingData['generated_image_url'] = $supabaseResult['url'];
        $trackingData['generated_image_path'] = $supabaseResult['path'];
    }
    
    trackInSupabase($sessionId, $trackingData);
    
    // Return result as data URL
    $finalImageBase64 = base64_encode($finalImageData);
    $imageDataUrl = 'data:image/png;base64,' . $finalImageBase64;
    
    $response = [
        'success' => true,
        'imageUrl' => $imageDataUrl,
        'hasImage' => true,
        'message' => 'Face and hair swap completed successfully',
        'processing_time' => time() - ($_SERVER['REQUEST_TIME'] ?? time())
    ];
    
    // Add Supabase URL if available
    if ($supabaseResult) {
        $response['supabaseUrl'] = $supabaseResult['url'];
    }
    
    debug_log('Processing completed successfully', [
        'processing_time' => $response['processing_time'] . 's',
        'has_supabase_url' => !empty($supabaseResult)
    ]);
    
    // Clear any accidental output and send JSON response
    ob_end_clean();
    echo json_encode($response);
    
} catch (Exception $e) {
    $errorStartTime = microtime(true);
    $sessionId = $GLOBALS['sessionId'] ?? 'unknown';
    
    // Enhanced error logging with full context
    $errorContext = [
        'session_id' => $sessionId,
        'error_message' => $e->getMessage(),
        'error_file' => $e->getFile(),
        'error_line' => $e->getLine(),
        'stack_trace' => $e->getTraceAsString(),
        'php_memory_usage' => memory_get_usage(true),
        'php_memory_peak' => memory_get_peak_usage(true),
        'execution_time' => round(microtime(true) - ($_SERVER['REQUEST_TIME_FLOAT'] ?? microtime(true)), 3) . 's',
        'poster_name' => $_POST['posterName'] ?? 'unknown',
        'user_image_size' => isset($_FILES['userImage']) ? $_FILES['userImage']['size'] : 'unknown',
        'retry_attempt' => isset($_POST['retryAttempt']) ? intval($_POST['retryAttempt']) : 1
    ];\n    \n    debug_log('PROCESSING FAILED - Complete error context', $errorContext, 'CRITICAL');\n    \n    // Track error in Supabase with detailed information\n    if (isset($sessionId) && $sessionId !== 'unknown') {\n        log_processing_step('ERROR_TRACKING_START', $sessionId);\n        \n        $trackingSuccess = trackInSupabase($sessionId, [\n            'processing_status' => 'failed',\n            'error_message' => $e->getMessage(),\n            'retry_attempt' => $errorContext['retry_attempt']\n        ]);\n        \n        if ($trackingSuccess) {\n            log_processing_step('ERROR_TRACKED_SUCCESS', $sessionId);\n        } else {\n            debug_log('Failed to track error in Supabase', ['session_id' => $sessionId], 'ERROR');\n        }\n        \n        // Send failure notification email in background\n        try {\n            sendFailureNotificationAsync($sessionId, $e->getMessage());\n            log_processing_step('FAILURE_EMAIL_SENT', $sessionId);\n        } catch (Exception $emailError) {\n            debug_log('Failed to send failure notification email', [\n                'session_id' => $sessionId,\n                'email_error' => $emailError->getMessage()\n            ], 'ERROR');\n        }\n    }\n    \n    // Log to standard error log as well\n    error_log('FaceSwap PHP API CRITICAL ERROR: ' . $e->getMessage() . ' | Session: ' . $sessionId);\n    \n    // Determine error type for better user messaging with enhanced categorization\n    $errorMessage = $e->getMessage();\n    $errorType = 'general';\n    $userMessage = 'An unexpected error occurred. Please try again.';\n    $canRetry = true;\n    $suggestedWait = 30;\n    \n    if (strpos($errorMessage, 'timeout') !== false || strpos($errorMessage, 'timed out') !== false) {\n        $errorType = 'timeout';\n        $userMessage = 'Processing is taking longer than expected. The service may be experiencing high demand.';\n        $suggestedWait = 60;\n    } elseif (strpos($errorMessage, 'connection') !== false || strpos($errorMessage, 'network') !== false || strpos($errorMessage, 'cURL') !== false) {\n        $errorType = 'network';\n        $userMessage = 'Network connection issue. Please check your internet connection and try again.';\n        $suggestedWait = 30;\n    } elseif (strpos($errorMessage, 'API') !== false && strpos($errorMessage, 'attempts') !== false) {\n        $errorType = 'api_exhausted';\n        $userMessage = 'Service is currently experiencing high demand. Please try again in a few minutes.';\n        $suggestedWait = 120;\n    } elseif (strpos($errorMessage, 'Invalid') !== false || strpos($errorMessage, 'failed to read') !== false || strpos($errorMessage, 'upload') !== false) {\n        $errorType = 'invalid_input';\n        $userMessage = 'There was an issue with the uploaded image. Please try with a different photo.';\n        $canRetry = false;\n        $suggestedWait = 0;\n    } elseif (strpos($errorMessage, 'Memory') !== false || strpos($errorMessage, 'memory') !== false) {\n        $errorType = 'memory';\n        $userMessage = 'The image is too large to process. Please try with a smaller image.';\n        $canRetry = false;\n        $suggestedWait = 0;\n    } elseif (strpos($errorMessage, 'extensions') !== false) {\n        $errorType = 'server_config';\n        $userMessage = 'Server configuration issue. Please contact support.';\n        $canRetry = false;\n        $suggestedWait = 0;\n    } elseif (strpos($errorMessage, 'Poster') !== false || strpos($errorMessage, 'poster') !== false) {\n        $errorType = 'poster_error';\n        $userMessage = 'Issue with the selected poster template. Please try a different poster.';\n        $canRetry = false;\n        $suggestedWait = 0;\n    }\n    \n    $errorResponse = [\n        'success' => false,\n        'error' => $userMessage,\n        'error_type' => $errorType,\n        'can_retry' => $canRetry,\n        'suggested_wait' => $suggestedWait,\n        'session_id' => $sessionId,\n        'timestamp' => date('Y-m-d H:i:s'),\n        'processing_time' => round(microtime(true) - $errorStartTime, 3)\n    ];\n    \n    // Add debug info for development (remove in production)\n    if (defined('DEVELOPMENT_MODE') && DEVELOPMENT_MODE) {\n        $errorResponse['debug'] = [\n            'original_error' => $errorMessage,\n            'memory_usage' => $errorContext['php_memory_usage'],\n            'execution_time' => $errorContext['execution_time']\n        ];\n    }\n    \n    debug_log('Error response prepared', $errorResponse, 'INFO');\n    \n    // Clear any accidental output and send error JSON response\n    ob_end_clean();\n    http_response_code(500);\n    echo json_encode($errorResponse);\n}
?> 