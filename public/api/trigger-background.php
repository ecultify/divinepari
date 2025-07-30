<?php
// Lightweight background processor trigger for Hostinger cron jobs
// This script quickly triggers background processing and exits

// Prevent timeout
set_time_limit(30);
ini_set('max_execution_time', 30);

// Start output buffering
ob_start();

// Set headers
header('Content-Type: application/json');

// Function to log debug information
function debug_log($message, $data = null) {
    $logEntry = date('Y-m-d H:i:s') . ' [TRIGGER] - ' . $message;
    if ($data !== null) {
        $logEntry .= ' - ' . print_r($data, true);
    }
    error_log($logEntry . "\n", 3, __DIR__ . '/background-processor.log');
}

debug_log('Background trigger called');

try {
    // Immediately respond to prevent timeout
    ob_end_clean();
    echo json_encode(['success' => true, 'message' => 'Background processing triggered']);
    
    // Finish the HTTP response
    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    }
    
    // Now trigger the actual background processor via curl (non-blocking)
    $backgroundUrl = 'https://posewithdivine.com/api/background-processor.php';
    
    // Use curl to trigger background processor asynchronously
    $ch = curl_init($backgroundUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 1); // Very short timeout
    curl_setopt($ch, CURLOPT_NOSIGNAL, 1);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Background-Trigger/1.0');
    
    // Don't wait for response - fire and forget
    curl_exec($ch);
    curl_close($ch);
    
    debug_log('Background processor triggered successfully');
    
} catch (Exception $e) {
    debug_log('Trigger failed', ['error' => $e->getMessage()]);
}

exit;
?>