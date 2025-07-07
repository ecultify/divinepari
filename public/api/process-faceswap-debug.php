<?php
// Debug version of face swap API with detailed error logging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

// Log function
function debug_log($message, $data = null) {
    $log_entry = date('Y-m-d H:i:s') . ' - ' . $message;
    if ($data !== null) {
        $log_entry .= ' - ' . json_encode($data);
    }
    error_log($log_entry);
    
    // Also output to response for debugging
    echo json_encode([
        'debug' => $message,
        'data' => $data,
        'timestamp' => date('Y-m-d H:i:s')
    ]) . "\n";
    flush();
}

try {
    debug_log('Script started');
    
    // Headers
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    
    debug_log('Headers set');
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        debug_log('OPTIONS request handled');
        exit(0);
    }
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        debug_log('Invalid method', $_SERVER['REQUEST_METHOD']);
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        exit;
    }
    
    debug_log('POST request confirmed');
    
    // Try to load config
    debug_log('Loading config file');
    require_once '../config.php';
    debug_log('Config file loaded');
    
    $SEGMIND_API_KEY = $_ENV['SEGMIND_API_KEY'] ?? null;
    debug_log('API key loaded', $SEGMIND_API_KEY ? 'Key exists' : 'Key missing');
    
    if (!$SEGMIND_API_KEY || $SEGMIND_API_KEY === 'YOUR_SEGMIND_API_KEY_HERE') {
        debug_log('API key not configured properly');
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'API configuration error. Please contact support.']);
        exit;
    }
    
    debug_log('Checking POST data');
    debug_log('POST data keys', array_keys($_POST));
    debug_log('FILES data keys', array_keys($_FILES));
    
    // Check required parameters
    if (!isset($_FILES['userImage']) || !isset($_POST['posterName']) || !isset($_POST['sessionId'])) {
        debug_log('Missing required parameters');
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing required parameters']);
        exit;
    }
    
    debug_log('Required parameters present');
    
    $userImageFile = $_FILES['userImage'];
    $posterName = $_POST['posterName'];
    $sessionId = $_POST['sessionId'];
    
    debug_log('Parameters extracted', [
        'posterName' => $posterName,
        'sessionId' => $sessionId,
        'userImage' => [
            'name' => $userImageFile['name'],
            'size' => $userImageFile['size'],
            'type' => $userImageFile['type'],
            'error' => $userImageFile['error']
        ]
    ]);
    
    // Check for upload errors
    if ($userImageFile['error'] !== UPLOAD_ERR_OK) {
        debug_log('File upload error', $userImageFile['error']);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'File upload error: ' . $userImageFile['error']]);
        exit;
    }
    
    debug_log('File upload successful');
    
    // Test basic functionality
    debug_log('Testing GD extension');
    if (!extension_loaded('gd')) {
        debug_log('GD extension not loaded');
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'GD extension not available']);
        exit;
    }
    
    debug_log('Testing cURL extension');
    if (!extension_loaded('curl')) {
        debug_log('cURL extension not loaded');
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'cURL extension not available']);
        exit;
    }
    
    debug_log('All extensions available');
    
    // Return success for debugging
    echo json_encode([
        'success' => true,
        'message' => 'Debug script completed successfully',
        'received_data' => [
            'posterName' => $posterName,
            'sessionId' => $sessionId,
            'userImageSize' => $userImageFile['size']
        ]
    ]);
    
} catch (Exception $e) {
    debug_log('Exception caught', [
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]);
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Exception: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
} catch (Error $e) {
    debug_log('Fatal error caught', [
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]);
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Fatal error: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}

?> 