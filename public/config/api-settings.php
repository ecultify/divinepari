<?php
// API Configuration Settings for Face Swap Processing
// This file centralizes timeout and retry configurations

return [
    // Segmind API Settings
    'segmind' => [
        'base_timeout' => 180,              // Base timeout in seconds (3 minutes)
        'max_retries' => 3,                 // Maximum retry attempts
        'retry_timeout_increment' => 60,    // Additional timeout per retry attempt
        'connect_timeout' => 30,            // Connection timeout in seconds
        'retry_wait_base' => 2,             // Base wait time for exponential backoff
        'retry_wait_max' => 15,             // Maximum wait time between retries
        'retryable_http_codes' => [429, 500, 502, 503, 504], // HTTP codes that should trigger retry
    ],
    
    // Supabase Settings
    'supabase' => [
        'upload_timeout' => 60,             // File upload timeout in seconds
        'query_timeout' => 15,              // Database query timeout in seconds
    ],
    
    // Processing Limits
    'processing' => [
        'max_execution_time' => 600,        // 10 minutes max execution time
        'memory_limit' => '512M',           // Memory limit for image processing
        'max_image_size' => 10 * 1024 * 1024, // 10MB max image size
    ],
    
    // Progress Animation Settings (for frontend reference)
    'progress' => [
        'update_interval' => 800,           // Progress update interval in milliseconds
        'stages' => [
            'initial' => ['max' => 20, 'increment' => 3],     // Quick initial progress
            'steady' => ['max' => 50, 'increment' => 2],      // Steady progress
            'processing' => ['max' => 80, 'increment' => 1],  // Slower during API processing
            'finalizing' => ['max' => 90, 'increment' => 0.5] // Very slow near completion
        ]
    ],
    
    // Error Message Mapping
    'error_messages' => [
        'timeout' => 'Processing is taking longer than expected. We\'re retrying automatically.',
        'network' => 'Network connection issue. Please check your internet and try again.',
        'api_exhausted' => 'Service is currently experiencing high demand. Please try again in a few minutes.',
        'invalid_input' => 'There was an issue with the uploaded image. Please try with a different photo.',
        'memory_limit' => 'Image processing limit reached. Please try with a smaller image.',
        'general' => 'An unexpected error occurred. Please try again.',
        'retry_failed' => 'Multiple attempts failed. Please try again later.',
    ],
    
    // Development/Debug Settings
    'debug' => [
        'log_api_calls' => true,            // Log all API calls for debugging
        'log_timing' => true,               // Log processing times
        'detailed_errors' => false,        // Show detailed error messages (only for dev)
    ]
];
?>