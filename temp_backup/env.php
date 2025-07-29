<?php
// Environment variables for Hostinger deployment
$_ENV['MANDRILL_API_KEY'] = 'md-uHR1LFMjBFB7Yn6aBnl7uA';
$_ENV['FROM_EMAIL'] = 'support@posewithdivine.com';
$_ENV['FROM_NAME'] = 'Divine x Parimatch';
$_ENV['EMAIL_ENABLED'] = true;
$_ENV['DEBUG_MODE'] = false;

// Segmind API Configuration
$_ENV['SEGMIND_API_KEY'] = 'SG_55ab857ecea4de8d';

// Supabase Configuration
$_ENV['NEXT_PUBLIC_SUPABASE_URL'] = 'https://nuoizrqsnxoldzcvwszu.supabase.co';
$_ENV['SUPABASE_SERVICE_ROLE_KEY'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51b2l6cnFzbnhvbGR6Y3Z3c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTAwOTAsImV4cCI6MjA2NTgyNjA5MH0.QBqYuv2uxdNiakLzrW_CosJnN0vTvTwlGT2UvAZFYlY';

// Application Configuration
$_ENV['NODE_ENV'] = 'production';
$_ENV['APP_ENV'] = 'production';
$_ENV['APP_DEBUG'] = 'false';
$_ENV['ALLOWED_ORIGINS'] = '*';
$_ENV['MAX_IMAGE_SIZE'] = '10485760';
$_ENV['ALLOWED_IMAGE_TYPES'] = 'image/jpeg,image/png,image/jpg';

return $_ENV;
?> 