<?php
header('Content-Type: application/json');

// Load environment configuration
$_ENV = include(dirname(__DIR__) . '/env.php');

// Get configuration from environment
$SMTP_HOST = $_ENV['SMTP_HOST'] ?? 'smtp.mandrillapp.com';
$SMTP_PORT = $_ENV['SMTP_PORT'] ?? '587';
$FROM_EMAIL = $_ENV['FROM_EMAIL'] ?? '';
$FROM_NAME = $_ENV['FROM_NAME'] ?? '';

// Test SMTP connection
function testSMTPConnection($host, $port) {
    $errno = 0;
    $errstr = '';
    $timeout = 10;
    
    $connection = @fsockopen($host, $port, $errno, $errstr, $timeout);
    
    if (!$connection) {
        return [
            'success' => false,
            'error' => "Could not connect to SMTP host ($errno): $errstr"
        ];
    }
    
    fclose($connection);
    return [
        'success' => true,
        'message' => "Successfully connected to SMTP server"
    ];
}

// Test PHP mail configuration
function testPHPMailConfiguration() {
    $mailConfig = [
        'SMTP' => ini_get('SMTP'),
        'smtp_port' => ini_get('smtp_port'),
        'sendmail_from' => ini_get('sendmail_from'),
        'sendmail_path' => ini_get('sendmail_path')
    ];
    
    return [
        'success' => true,
        'config' => $mailConfig
    ];
}

// Run tests
$results = [
    'smtp_connection' => testSMTPConnection($SMTP_HOST, $SMTP_PORT),
    'php_mail_config' => testPHPMailConfiguration(),
    'environment' => [
        'smtp_host' => $SMTP_HOST,
        'smtp_port' => $SMTP_PORT,
        'from_email' => $FROM_EMAIL,
        'from_name' => $FROM_NAME
    ]
];

echo json_encode($results, JSON_PRETTY_PRINT); 