<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

// Set proper headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
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
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        
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
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 201) {
            error_log("Supabase tracking failed with status $httpCode: $response");
        }
        
        return $httpCode === 201;
    }

    function getTargetSide($posterName) {
        // Option 2 uses left side, Option 3M uses left side, others use right side
        if (strpos($posterName, 'Option2') !== false || strpos($posterName, 'Option3M') !== false) {
            return 'left';
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

    function extractPosterSide($posterData, $targetSide) {
        $image = imagecreatefromstring($posterData);
        if (!$image) {
            throw new Exception('Invalid poster image data');
        }
        
        $width = imagesx($image);
        $height = imagesy($image);
        $halfWidth = intval($width / 2);
        
        $extracted = imagecreatetruecolor($halfWidth, $height);
        
        if ($targetSide === 'left') {
            imagecopy($extracted, $image, 0, 0, 0, 0, $halfWidth, $height);
        } else {
            imagecopy($extracted, $image, 0, 0, $halfWidth, 0, $halfWidth, $height);
        }
        
        ob_start();
        imagepng($extracted, null, 9);
        $extractedData = ob_get_contents();
        ob_end_clean();
        
        imagedestroy($image);
        imagedestroy($extracted);
        
        return $extractedData;
    }

    function compositeFinalImage($originalPosterData, $swappedSideData, $targetSide) {
        $originalImage = imagecreatefromstring($originalPosterData);
        $swappedImage = imagecreatefromstring($swappedSideData);
        
        if (!$originalImage || !$swappedImage) {
            throw new Exception('Invalid image data for compositing');
        }
        
        $originalWidth = imagesx($originalImage);
        $originalHeight = imagesy($originalImage);
        $halfWidth = intval($originalWidth / 2);
        
        // Resize swapped image to match dimensions
        $resizedSwapped = imagecreatetruecolor($halfWidth, $originalHeight);
        imagecopyresampled(
            $resizedSwapped, 
            $swappedImage, 
            0, 0, 0, 0, 
            $halfWidth, $originalHeight, 
            imagesx($swappedImage), imagesy($swappedImage)
        );
        
        // Composite back onto original
        if ($targetSide === 'left') {
            imagecopy($originalImage, $resizedSwapped, 0, 0, 0, 0, $halfWidth, $originalHeight);
        } else {
            imagecopy($originalImage, $resizedSwapped, $halfWidth, 0, 0, 0, $halfWidth, $originalHeight);
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
        'result_image_generated' => false
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
    $extractedSideData = extractPosterSide($posterData, $targetSide);
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
    
    // Call Segmind FaceSwap v4 API
    $ch = curl_init('https://api.segmind.com/v1/faceswap-v4');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($faceSwapData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'x-api-key: ' . $SEGMIND_API_KEY,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 120); // 2 minute timeout
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        throw new Exception('Face swap API request failed with status: ' . $httpCode);
    }
    
    $responseData = json_decode($response, true);
    if (!$responseData || !isset($responseData['image'])) {
        throw new Exception('Invalid API response');
    }
    
    // Get the swapped result
    $swappedResultData = base64_decode($responseData['image']);
    
    // Composite result back onto original poster
    $finalImageData = compositeFinalImage($posterData, $swappedResultData, $targetSide);
    
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
        'message' => 'Face and hair swap completed successfully'
    ];
    
    // Add Supabase URL if available
    if ($supabaseResult) {
        $response['supabaseUrl'] = $supabaseResult['url'];
    }
    
    echo json_encode($response);
    
} catch (Exception $e) {
    // Track error in Supabase
    if (isset($sessionId)) {
        trackInSupabase($sessionId, [
            'processing_status' => 'failed',
            'error_message' => $e->getMessage()
        ]);
    }
    
    error_log('FaceSwap PHP API error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'An unexpected error occurred during face swap processing.'
    ]);
}
?> 