<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$required_extensions = [
    'gd' => 'Image processing',
    'curl' => 'HTTP requests to Segmind API', 
    'json' => 'JSON encoding/decoding',
    'fileinfo' => 'File type detection',
    'mbstring' => 'String processing'
];

$extension_status = [];
$all_available = true;

foreach ($required_extensions as $ext => $description) {
    $available = extension_loaded($ext);
    $extension_status[$ext] = [
        'available' => $available,
        'description' => $description
    ];
    
    if (!$available) {
        $all_available = false;
    }
}

// Check GD specific functions
if (extension_loaded('gd')) {
    $gd_info = gd_info();
    $extension_status['gd']['details'] = [
        'version' => $gd_info['GD Version'] ?? 'Unknown',
        'jpeg_support' => $gd_info['JPEG Support'] ?? false,
        'png_support' => $gd_info['PNG Support'] ?? false,
        'gif_support' => $gd_info['GIF Read Support'] ?? false
    ];
}

// Check memory limit
$memory_limit = ini_get('memory_limit');
$max_execution_time = ini_get('max_execution_time');
$upload_max_filesize = ini_get('upload_max_filesize');
$post_max_size = ini_get('post_max_size');

$response = [
    'success' => $all_available,
    'message' => $all_available ? 'All required extensions available' : 'Some extensions missing',
    'php_version' => phpversion(),
    'extensions' => $extension_status,
    'php_settings' => [
        'memory_limit' => $memory_limit,
        'max_execution_time' => $max_execution_time,
        'upload_max_filesize' => $upload_max_filesize,
        'post_max_size' => $post_max_size
    ],
    'writable_check' => [
        'current_dir' => is_writable(__DIR__),
        'current_dir_path' => __DIR__
    ]
];

echo json_encode($response, JSON_PRETTY_PRINT);
?> 