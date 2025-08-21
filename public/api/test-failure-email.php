<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Get test parameters
    $to = $_GET['email'] ?? 'test@example.com';
    $userName = $_GET['name'] ?? 'Test User';
    $sessionId = $_GET['session'] ?? 'test_session_' . time();
    
    echo "<h1>Testing Failure Email System</h1>\n";
    echo "<p>Email: $to</p>\n";
    echo "<p>Name: $userName</p>\n";
    echo "<p>Session: $sessionId</p>\n";
    
    // Test failure email directly
    $failureData = [
        'to' => $to,
        'userName' => $userName,
        'sessionId' => $sessionId,
        'reason' => 'test_email'
    ];
    
    echo "<h2>1. Testing send-failure-email.php directly...</h2>\n";
    
    $ch = curl_init((isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . '/api/send-failure-email.php');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($failureData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    echo "<p><strong>HTTP Code:</strong> $httpCode</p>\n";
    echo "<p><strong>cURL Error:</strong> " . ($error ?: 'None') . "</p>\n";
    echo "<p><strong>Response:</strong></p>\n";
    echo "<pre>" . htmlspecialchars($response) . "</pre>\n";
    
    // Test regular email with isFailure flag
    echo "<h2>2. Testing send-email.php with isFailure flag...</h2>\n";
    
    $emailData = [
        'to' => $to,
        'userName' => $userName,
        'sessionId' => $sessionId,
        'isFailure' => true
    ];
    
    $ch2 = curl_init((isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . '/api/send-email.php');
    curl_setopt($ch2, CURLOPT_POST, true);
    curl_setopt($ch2, CURLOPT_POSTFIELDS, json_encode($emailData));
    curl_setopt($ch2, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch2, CURLOPT_TIMEOUT, 30);
    
    $response2 = curl_exec($ch2);
    $httpCode2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
    $error2 = curl_error($ch2);
    curl_close($ch2);
    
    echo "<p><strong>HTTP Code:</strong> $httpCode2</p>\n";
    echo "<p><strong>cURL Error:</strong> " . ($error2 ?: 'None') . "</p>\n";
    echo "<p><strong>Response:</strong></p>\n";
    echo "<pre>" . htmlspecialchars($response2) . "</pre>\n";
    
    // Test environment config
    echo "<h2>3. Environment Configuration Check...</h2>\n";
    $_ENV = include(dirname(__DIR__) . '/env.php');
    echo "<p><strong>SMTP Host:</strong> " . (empty($_ENV['HOSTINGER_SMTP_HOST']) ? 'NOT SET' : 'SET') . "</p>\n";
    echo "<p><strong>SMTP Username:</strong> " . (empty($_ENV['HOSTINGER_SMTP_USERNAME']) ? 'NOT SET' : 'SET') . "</p>\n";
    echo "<p><strong>SMTP Password:</strong> " . (empty($_ENV['HOSTINGER_SMTP_PASSWORD']) ? 'NOT SET' : 'SET') . "</p>\n";
    echo "<p><strong>From Email:</strong> " . ($_ENV['FROM_EMAIL'] ?? 'NOT SET') . "</p>\n";
    
} catch (Exception $e) {
    echo "<h2>Error:</h2>\n";
    echo "<p>" . htmlspecialchars($e->getMessage()) . "</p>\n";
}

echo "<hr>\n";
echo "<p><strong>Usage:</strong> /api/test-failure-email.php?email=your@email.com&name=YourName&session=test123</p>\n";
?>
