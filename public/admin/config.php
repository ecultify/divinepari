<?php
session_start();

// Admin credentials
define('ADMIN_USERNAME', 'admin');
define('ADMIN_PASSWORD', 'divine2024pari');

// Supabase Configuration
define('SUPABASE_URL', 'https://nuoizrqsnxoldzcvwszu.supabase.co');
define('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51b2l6cnFzbnhvbGR6Y3Z3c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTAwOTAsImV4cCI6MjA2NTgyNjA5MH0.QBqYuv2uxdNiakLzrW_CosJnN0vTvTwlGT2UvAZFYlY');

// Function to check if user is logged in
function isLoggedIn() {
    return isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
}

// Function to make Supabase API calls
function supabaseQuery($table, $method = 'GET', $params = [], $select = '*') {
    $url = SUPABASE_URL . '/rest/v1/' . $table;
    
    if ($method === 'GET') {
        $url .= '?select=' . urlencode($select);
    }
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . SUPABASE_KEY,
        'Authorization: Bearer ' . SUPABASE_KEY,
        'Content-Type: application/json',
        'Prefer: return=representation'
    ]);
    
    if ($method !== 'GET') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        if (!empty($params)) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($params));
        }
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode >= 200 && $httpCode < 300) {
        return json_decode($response, true);
    }
    
    return null;
}

// Redirect if not logged in
function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: /admin/login.php');
        exit;
    }
}
?> 