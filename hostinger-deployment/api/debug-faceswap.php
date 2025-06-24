<?php
// Debug script for Hostinger face swap issues
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo json_encode([
    'status' => 'debug_start',
    'message' => 'Starting debug checks...'
]) . "\n";

// Check 1: PHP Version
echo json_encode([
    'check' => 'php_version',
    'value' => phpversion(),
    'status' => version_compare(phpversion(), '7.4', '>=') ? 'OK' : 'FAIL'
]) . "\n";

// Check 2: Required Extensions
$required_extensions = ['gd', 'curl', 'json'];
foreach ($required_extensions as $ext) {
    echo json_encode([
        'check' => 'extension_' . $ext,
        'value' => extension_loaded($ext),
        'status' => extension_loaded($ext) ? 'OK' : 'FAIL'
    ]) . "\n";
}

// Check 3: Memory Limit
echo json_encode([
    'check' => 'memory_limit',
    'value' => ini_get('memory_limit'),
    'status' => 'INFO'
]) . "\n";

// Check 4: Max Execution Time
echo json_encode([
    'check' => 'max_execution_time',
    'value' => ini_get('max_execution_time'),
    'status' => 'INFO'
]) . "\n";

// Check 5: Upload Limits
echo json_encode([
    'check' => 'upload_max_filesize',
    'value' => ini_get('upload_max_filesize'),
    'status' => 'INFO'
]) . "\n";

echo json_encode([
    'check' => 'post_max_size',
    'value' => ini_get('post_max_size'),
    'status' => 'INFO'
]) . "\n";

// Check 6: Config File
try {
    require_once '../config.php';
    $api_key = $_ENV['SEGMIND_API_KEY'] ?? 'NOT_SET';
    echo json_encode([
        'check' => 'config_file',
        'value' => 'Loaded successfully',
        'api_key_set' => $api_key !== 'NOT_SET' && $api_key !== 'YOUR_SEGMIND_API_KEY_HERE',
        'status' => 'OK'
    ]) . "\n";
} catch (Exception $e) {
    echo json_encode([
        'check' => 'config_file',
        'value' => 'Failed to load: ' . $e->getMessage(),
        'status' => 'FAIL'
    ]) . "\n";
}

// Check 7: File Permissions
echo json_encode([
    'check' => 'file_permissions',
    'process_faceswap_readable' => is_readable('process-faceswap.php'),
    'config_readable' => is_readable('../config.php'),
    'status' => 'INFO'
]) . "\n";

// Check 8: Test cURL
try {
    $curl_test = curl_init();
    if ($curl_test) {
        curl_close($curl_test);
        echo json_encode([
            'check' => 'curl_test',
            'value' => 'cURL initialized successfully',
            'status' => 'OK'
        ]) . "\n";
    } else {
        echo json_encode([
            'check' => 'curl_test',
            'value' => 'Failed to initialize cURL',
            'status' => 'FAIL'
        ]) . "\n";
    }
} catch (Exception $e) {
    echo json_encode([
        'check' => 'curl_test',
        'value' => 'cURL error: ' . $e->getMessage(),
        'status' => 'FAIL'
    ]) . "\n";
}

// Check 9: GD Library Functions
if (extension_loaded('gd')) {
    $gd_functions = [
        'imagecreatefromjpeg',
        'imagecreatefrompng', 
        'imagecopyresampled',
        'imagepng',
        'imagejpeg'
    ];
    
    foreach ($gd_functions as $func) {
        echo json_encode([
            'check' => 'gd_function_' . $func,
            'value' => function_exists($func),
            'status' => function_exists($func) ? 'OK' : 'FAIL'
        ]) . "\n";
    }
}

echo json_encode([
    'status' => 'debug_complete',
    'message' => 'Debug checks completed. Check above for any FAIL status.'
]) . "\n";

?> 