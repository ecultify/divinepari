<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Load environment configuration
$_ENV = include(dirname(__DIR__) . '/env.php');

// Get SMTP configuration from environment
$SMTP_HOST = $_ENV['HOSTINGER_SMTP_HOST'] ?? '';
$SMTP_PORT = $_ENV['HOSTINGER_SMTP_PORT'] ?? '';
$SMTP_USERNAME = $_ENV['HOSTINGER_SMTP_USERNAME'] ?? '';
$SMTP_PASSWORD = $_ENV['HOSTINGER_SMTP_PASSWORD'] ?? '';
$FROM_EMAIL = $_ENV['FROM_EMAIL'] ?? '';
$FROM_NAME = $_ENV['FROM_NAME'] ?? '';

// Configuration validation
if (empty($SMTP_HOST) || empty($SMTP_USERNAME) || empty($SMTP_PASSWORD)) {
    error_log("DIVINE FAILURE EMAIL ERROR: SMTP configuration incomplete");
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Email service configuration error'
    ]);
    exit();
}

try {
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    $to = $input['to'] ?? '';
    $userName = $input['userName'] ?? 'there';
    $sessionId = $input['sessionId'] ?? '';
    $reason = $input['reason'] ?? 'processing_timeout';
    
    if (empty($to)) {
        throw new Exception('Email address is required');
    }
    
    // Validate email format
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }
    
    // Send failure email using existing send-email.php functionality
    $failureEmailData = [
        'to' => $to,
        'userName' => $userName,
        'sessionId' => $sessionId,
        'isFailure' => true
    ];
    
    $response = callEmailAPI($failureEmailData);
    
    if ($response['success']) {
        echo json_encode([
            'success' => true,
            'message' => 'Failure notification email sent successfully',
            'reason' => $reason,
            'debug' => [
                'to_email' => $to,
                'session_id' => $sessionId,
                'failure_reason' => $reason
            ]
        ]);
    } else {
        throw new Exception('Failed to send failure email: ' . $response['error']);
    }
    
} catch (Exception $e) {
    error_log("DIVINE FAILURE EMAIL ERROR: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to send failure notification email',
        'details' => $e->getMessage()
    ]);
}

function callEmailAPI($data) {
    $url = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . '/api/send-email.php';
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 3);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        return ['success' => false, 'error' => "cURL error: $error"];
    }
    
    if ($httpCode !== 200) {
        return ['success' => false, 'error' => "HTTP error: $httpCode"];
    }
    
    $result = json_decode($response, true);
    return $result ?: ['success' => false, 'error' => 'Invalid response'];
}
?>
