<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

try {
    // Test basic PHP functionality
    $response = [
        'success' => true,
        'message' => 'PHP is working!',
        'timestamp' => date('Y-m-d H:i:s'),
        'php_version' => phpversion(),
        'server_info' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'post_data' => $_POST,
        'request_method' => $_SERVER['REQUEST_METHOD']
    ];
    
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 