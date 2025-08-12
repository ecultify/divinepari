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

// Function to log debug information
function debug_log($message, $data = null) {
    $logEntry = date('Y-m-d H:i:s') . ' - ' . $message;
    if ($data !== null) {
        $logEntry .= ' - ' . print_r($data, true);
    }
    error_log($logEntry . "\n", 3, __DIR__ . '/debug.log');
}

// Function to call Segmind API with retry logic
function callSegmindAPIWithRetry($faceSwapData, $apiKey, $maxRetries = 3, $baseTimeout = 180) {
    for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
        debug_log("Segmind API attempt $attempt/$maxRetries");
        
        // Increase timeout with each retry
        $timeout = $baseTimeout + (($attempt - 1) * 60); // 180s, 240s, 300s
        
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
        
        $startTime = microtime(true);
        $response = curl_exec($ch);
        $endTime = microtime(true);
        $duration = round($endTime - $startTime, 2);
        
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        
        debug_log("Segmind API attempt $attempt result", [
            'http_code' => $httpCode,
            'duration' => $duration . 's',
            'timeout' => $timeout . 's',
            'curl_error' => $curlError
        ]);
        
        // Handle cURL errors
        if ($curlError) {
            $errorMsg = "cURL error on attempt $attempt: $curlError";
            debug_log($errorMsg);
            
            if ($attempt === $maxRetries) {
                throw new Exception("API connection failed after $maxRetries attempts: $curlError");
            }
            
            // Wait before retry (exponential backoff)
            sleep(min(pow(2, $attempt - 1), 10)); // 1s, 2s, 4s (max 10s)
            continue;
        }
        
        // Handle HTTP errors that should be retried
        if (in_array($httpCode, [429, 500, 502, 503, 504])) {
            $errorMsg = "Segmind API returned retryable error: HTTP $httpCode";
            debug_log($errorMsg);
            
            if ($attempt === $maxRetries) {
                throw new Exception("API request failed after $maxRetries attempts with HTTP $httpCode");
            }
            
            // Wait before retry (exponential backoff)
            sleep(min(pow(2, $attempt - 1), 10));
            continue;
        }
        
        // Handle other HTTP errors (don't retry)
        if ($httpCode !== 200) {
            throw new Exception("API request failed with HTTP $httpCode. Response: " . substr($response, 0, 200));
        }
        
        // Try to parse response
        $responseData = json_decode($response, true);
        if (!$responseData || !isset($responseData['image'])) {
            $errorMsg = "Invalid API response on attempt $attempt";
            debug_log($errorMsg, ['response_preview' => substr($response, 0, 200)]);
            
            if ($attempt === $maxRetries) {
                throw new Exception("Invalid API response after $maxRetries attempts");
            }
            
            sleep(1); // Short wait for invalid response
            continue;
        }
        
        debug_log("Segmind API successful on attempt $attempt", [
            'duration' => $duration . 's',
            'response_size' => strlen($responseData['image'])
        ]);
        
        return $responseData;
    }
    
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
        throw new Exception('Missing PHP extensions: ' . implode(', ', $missing_extensions));
    }
    
    debug_log('All required extensions available');
    
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
        throw new Exception('Missing required parameters');
    }
    
    debug_log('Form data validated successfully');
    
    $userImageFile = $_FILES['userImage'];
    $posterName = $_POST['posterName'];
    $sessionId = $_POST['sessionId'];
    
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
    $userImageData = file_get_contents($userImageFile['tmp_name']);
    if (!$userImageData) {
        throw new Exception('Failed to read user image');
    }
    
    // Resize user image
    $resizedUserImageData = resizeImage($userImageData, 1024, 1024);
    $userImageBase64 = base64_encode($resizedUserImageData);
    
    // Load poster image
    $posterImagePath = "../images/posters/" . $posterName;
    if (!file_exists($posterImagePath)) {
        throw new Exception('Poster image not found');
    }
    
    $posterData = file_get_contents($posterImagePath);
    if (!$posterData) {
        throw new Exception('Failed to read poster image');
    }
    
    // Determine target side and extract
    $targetSide = getTargetSide($posterName);
    $extractedSideData = extractPosterSide($posterData, $targetSide, $posterName);
    $targetSideBase64 = base64_encode($extractedSideData);
    
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
    
    debug_log('Starting Segmind API call with retry logic');
    
    // Call Segmind FaceSwap v4 API with retry logic
    $responseData = callSegmindAPIWithRetry($faceSwapData, $SEGMIND_API_KEY);
    
    // Get the swapped result
    $swappedResultData = base64_decode($responseData['image']);
    
    // Composite result back onto original poster
    $finalImageData = compositeFinalImage($posterData, $swappedResultData, $targetSide, $posterName);
    
    // Upload to Supabase if configured
    $supabaseResult = null;
    $filename = $sessionId . '_' . time() . '.png';
    $supabaseResult = uploadToSupabase($finalImageData, $filename);
    
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
    // Track error in Supabase
    if (isset($sessionId)) {
        trackInSupabase($sessionId, [
            'processing_status' => 'failed',
            'error_message' => $e->getMessage(),
            'retry_attempt' => isset($_POST['retryAttempt']) ? intval($_POST['retryAttempt']) : 1
        ]);
    }
    
    error_log('FaceSwap PHP API error: ' . $e->getMessage());
    
    // Determine error type for better user messaging
    $errorMessage = $e->getMessage();
    $errorType = 'general';
    
    if (strpos($errorMessage, 'timeout') !== false || strpos($errorMessage, 'timed out') !== false) {
        $errorType = 'timeout';
        $userMessage = 'Processing is taking longer than expected. We\'re retrying automatically.';
    } elseif (strpos($errorMessage, 'connection') !== false || strpos($errorMessage, 'network') !== false) {
        $errorType = 'network';
        $userMessage = 'Network connection issue. Please check your internet and try again.';
    } elseif (strpos($errorMessage, 'API') !== false && strpos($errorMessage, 'attempts') !== false) {
        $errorType = 'api_exhausted';
        $userMessage = 'Service is currently experiencing high demand. Please try again in a few minutes.';
    } elseif (strpos($errorMessage, 'Invalid') !== false || strpos($errorMessage, 'failed to read') !== false) {
        $errorType = 'invalid_input';
        $userMessage = 'There was an issue with the uploaded image. Please try with a different photo.';
    } else {
        $errorType = 'general';
        $userMessage = 'An unexpected error occurred. Please try again.';
    }
    
    // Clear any accidental output and send error JSON response
    ob_end_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $userMessage,
        'error_type' => $errorType,
        'can_retry' => in_array($errorType, ['timeout', 'network', 'api_exhausted']),
        'suggested_wait' => $errorType === 'api_exhausted' ? 120 : 30 // seconds
    ]);
}
?> 