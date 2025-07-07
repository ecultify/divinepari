<?php
require_once '../config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Test the configuration
$SEGMIND_API_KEY = $_ENV['SEGMIND_API_KEY'] ?? '';
$response = [
    'status' => 'success',
    'php_version' => phpversion(),
    'timestamp' => date('Y-m-d H:i:s'),
    'api_key_set' => !empty($SEGMIND_API_KEY),
    'api_key_length' => !empty($SEGMIND_API_KEY) ? strlen($SEGMIND_API_KEY) : 0,
    'api_key_prefix' => !empty($SEGMIND_API_KEY) ? substr($SEGMIND_API_KEY, 0, 10) . '...' : 'not_set',
    'supabase_configured' => !empty($_ENV['NEXT_PUBLIC_SUPABASE_URL']) && !empty($_ENV['SUPABASE_SERVICE_ROLE_KEY']),
    'gd_available' => extension_loaded('gd'),
    'curl_available' => extension_loaded('curl'),
    'memory_limit' => ini_get('memory_limit'),
    'max_execution_time' => ini_get('max_execution_time'),
    'max_file_uploads' => ini_get('max_file_uploads'),
    'upload_max_filesize' => ini_get('upload_max_filesize'),
    'post_max_size' => ini_get('post_max_size')
];

// Test basic image processing capability
if (extension_loaded('gd')) {
    $testImage = imagecreate(100, 100);
    if ($testImage) {
        imagedestroy($testImage);
        $response['image_processing'] = 'working';
    } else {
        $response['image_processing'] = 'failed';
    }
} else {
    $response['image_processing'] = 'gd_not_available';
}

// Test cURL
if (extension_loaded('curl')) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://httpbin.org/status/200');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $response['curl_test'] = ($httpCode === 200) ? 'working' : 'failed';
} else {
    $response['curl_test'] = 'curl_not_available';
}

echo json_encode($response, JSON_PRETTY_PRINT);
?> 