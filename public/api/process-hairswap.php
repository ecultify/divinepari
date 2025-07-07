<?php

require_once $config_path;

// Get API key from environment variables
$SEGMIND_API_KEY = $_ENV['SEGMIND_API_KEY'] ?? '';

if (empty($SEGMIND_API_KEY)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Segmind API key not configured']);
    exit;
} 