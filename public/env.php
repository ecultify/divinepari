<?php
// Environment variables for Hostinger deployment
// IMPORTANT: Set these values before uploading to production

// Segmind API Configuration
$_ENV['SEGMIND_API_KEY'] = 'SG_55ab857ecea4de8d';

// Supabase Configuration (optional - for future use)
$_ENV['NEXT_PUBLIC_SUPABASE_URL'] = 'https://nuoizrqsnxoldzcvwszu.supabase.co';
$_ENV['SUPABASE_SERVICE_ROLE_KEY'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51b2l6cnFzbnhvbGR6Y3Z3c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTAwOTAsImV4cCI6MjA2NTgyNjA5MH0.QBqYuv2uxdNiakLzrW_CosJnN0vTvTwlGT2UvAZFYlY';

// Development/Production flag
$_ENV['NODE_ENV'] = 'production';

// Optional: Database Configuration (uncomment if you want to add database tracking)
// $_ENV['DB_HOST'] = 'localhost';
// $_ENV['DB_USERNAME'] = 'your_db_username';
// $_ENV['DB_PASSWORD'] = 'your_db_password';
// $_ENV['DB_NAME'] = 'your_db_name';

// Application Configuration
$_ENV['APP_ENV'] = 'production';
$_ENV['APP_DEBUG'] = 'false';

// Security Configuration
$_ENV['ALLOWED_ORIGINS'] = '*'; // Change to your domain for better security

// Optional: API Configuration
$_ENV['MAX_IMAGE_SIZE'] = '10485760'; // 10MB in bytes
$_ENV['ALLOWED_IMAGE_TYPES'] = 'image/jpeg,image/png,image/jpg';

// Mandrill Email Configuration
$_ENV['MANDRILL_API_KEY'] = 'md-uHR1LFMjBFB7Yn6aBnl7uA';
$_ENV['SMTP_HOST'] = 'smtp.mandrillapp.com';
$_ENV['SMTP_PORT'] = '587'; // or 465 for SSL
$_ENV['SMTP_USERNAME'] = 'support@posewithdivine.com';
$_ENV['FROM_EMAIL'] = 'support@posewithdivine.com';
$_ENV['FROM_NAME'] = 'Divine x Parimatch';
$_ENV['EMAIL_ENABLED'] = true;
$_ENV['DEBUG_MODE'] = false;

return $_ENV;
?> 