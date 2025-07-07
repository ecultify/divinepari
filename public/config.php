<?php
// Environment Configuration for Hostinger Deployment
// This file loads environment variables from env.php

// Load environment variables  
if (file_exists(__DIR__ . '/env.php')) {
    require_once __DIR__ . '/env.php';
} elseif (file_exists('env.php')) {
    require_once 'env.php';
} else {
    // Fallback - set API key directly if env.php not found
    $_ENV['SEGMIND_API_KEY'] = 'YOUR_SEGMIND_API_KEY_HERE';
}

// Optional: Database configuration if you want to track usage
// $db_host = 'localhost';
// $db_username = 'your_db_username';
// $db_password = 'your_db_password';
// $db_name = 'your_db_name';

// Load environment variables
function loadEnvironment() {
    // You can add any additional environment setup here
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    
    // Set maximum execution time for image processing
    set_time_limit(300); // 5 minutes
    
    // Increase memory limit for image processing
    ini_set('memory_limit', '256M');
    
    // Enable GD extension check
    if (!extension_loaded('gd')) {
        die('GD extension is required for image processing');
    }
    
    // Enable cURL extension check
    if (!extension_loaded('curl')) {
        die('cURL extension is required for API calls');
    }
}

// Call the environment setup
loadEnvironment();
?> 