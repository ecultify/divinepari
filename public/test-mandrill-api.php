<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Load environment configuration - both files are in the same public directory
$_ENV = include(__DIR__ . '/env.php');

$MANDRILL_API_KEY = $_ENV['MANDRILL_API_KEY'] ?? '';

if (empty($MANDRILL_API_KEY)) {
    echo json_encode([
        'success' => false,
        'error' => 'Mandrill API key not configured',
        'debug' => [
            'current_directory' => __DIR__,
            'env_file_path' => __DIR__ . '/env.php',
            'env_file_exists' => file_exists(__DIR__ . '/env.php'),
            'env_content_preview' => file_exists(__DIR__ . '/env.php') ? 'File exists' : 'File not found'
        ]
    ]);
    exit();
}

// Test Mandrill API with ping endpoint
$pingData = [
    'key' => $MANDRILL_API_KEY
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://mandrillapp.com/api/1.0/users/ping.json');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($pingData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    echo json_encode([
        'success' => false,
        'error' => 'cURL error: ' . $curlError
    ]);
    exit();
}

echo json_encode([
    'success' => true,
    'http_code' => $httpCode,
    'response' => $response,
    'api_key_length' => strlen($MANDRILL_API_KEY),
    'api_key_prefix' => substr($MANDRILL_API_KEY, 0, 3)
]);
?> 