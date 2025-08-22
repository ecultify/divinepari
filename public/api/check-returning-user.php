<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Load environment configuration
require_once '../env.php';

try {
    // Get email from query parameter
    $email = $_GET['email'] ?? '';
    
    if (empty($email)) {
        echo json_encode([
            'success' => false,
            'hasPosters' => false,
            'error' => 'Email parameter is required'
        ]);
        exit();
    }
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode([
            'success' => false,
            'hasPosters' => false,
            'error' => 'Invalid email format'
        ]);
        exit();
    }
    
    // Get Supabase configuration
    $SUPABASE_URL = $_ENV['NEXT_PUBLIC_SUPABASE_URL'] ?? 'https://nuoizrqsnxoldzcvwszu.supabase.co';
    $SUPABASE_SERVICE_KEY = $_ENV['SUPABASE_SERVICE_ROLE_KEY'] ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51b2l6cnFzbnhvbGR6Y3Z3c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTAwOTAsImV4cCI6MjA2NTgyNjA5MH0.QBqYuv2uxdNiakLzrW_CosJnN0vTvTwlGT2UvAZFYlY';
    
    // Query Supabase for user's latest successful poster
    $url = $SUPABASE_URL . '/rest/v1/generation_results?user_email=eq.' . urlencode($email) . 
           '&processing_status=eq.completed&generated_image_url=not.is.null&order=created_at.desc&limit=1';
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $SUPABASE_SERVICE_KEY,
        'Authorization: Bearer ' . $SUPABASE_SERVICE_KEY,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        throw new Exception("Database connection error: $curlError");
    }
    
    if ($httpCode !== 200) {
        throw new Exception("Database query failed with HTTP code: $httpCode");
    }
    
    $data = json_decode($response, true);
    
    if ($data && is_array($data) && count($data) > 0) {
        // User has previous posters
        $latestPoster = $data[0];
        
        echo json_encode([
            'success' => true,
            'hasPosters' => true,
            'latestPoster' => [
                'sessionId' => $latestPoster['session_id'],
                'userName' => $latestPoster['user_name'],
                'posterUrl' => $latestPoster['generated_image_url'],
                'posterType' => $latestPoster['poster_selected'],
                'gender' => $latestPoster['gender'],
                'createdAt' => $latestPoster['created_at']
            ]
        ]);
    } else {
        // No previous posters found
        echo json_encode([
            'success' => true,
            'hasPosters' => false,
            'message' => 'No previous posters found for this email'
        ]);
    }
    
} catch (Exception $e) {
    error_log("Returning user check error: " . $e->getMessage());
    
    // On error, treat as new user to avoid blocking the flow
    echo json_encode([
        'success' => false,
        'hasPosters' => false,
        'error' => 'Unable to check user history',
        'details' => $e->getMessage()
    ]);
}
?>