<?php
// Test PHP environment configuration
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Load environment configuration
    require_once 'env.php';
    
    // Test configuration
    $config = verifyConfig();
    
    echo json_encode([
        'success' => true,
        'message' => 'PHP environment configuration loaded successfully',
        'config' => $config,
        'api_key_set' => !empty(getEmailEnv('MANDRILL_API_KEY')),
        'from_email' => getEmailEnv('FROM_EMAIL'),
        'from_name' => getEmailEnv('FROM_NAME'),
        'email_enabled' => getEmailEnv('EMAIL_ENABLED'),
        'debug_mode' => getEmailEnv('DEBUG_MODE'),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to load environment configuration',
        'details' => $e->getMessage()
    ]);
}
?> 