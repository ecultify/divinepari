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

// EMAIL CONFIGURATION - MULTIPLE OPTIONS
// Choose ONE of the following email services:

// Option 1: Mandrill/Mailchimp Transactional (CURRENTLY NOT WORKING - API KEY INVALID)
$_ENV['MANDRILL_API_KEY'] = 'md-uHR1LFMjBFB7Yn6aBnl7uA'; // INVALID - Need new key
$_ENV['SMTP_HOST'] = 'smtp.mandrillapp.com';
$_ENV['SMTP_PORT'] = '587';
$_ENV['SMTP_USERNAME'] = 'support@posewithdivine.com';

// Option 2: SendGrid (RECOMMENDED - Free tier: 100 emails/day)
// Get API key from: https://sendgrid.com/
// $_ENV['SENDGRID_API_KEY'] = 'SG.your_sendgrid_api_key_here';

// Option 3: Gmail SMTP (EASIEST - Use your Gmail account)
// Instructions:
// 1. Enable 2-factor authentication on your Gmail account
// 2. Generate App Password: https://support.google.com/accounts/answer/185833
// 3. Use your Gmail address and the generated app password below
// $_ENV['GMAIL_USERNAME'] = 'your-email@gmail.com';
// $_ENV['GMAIL_APP_PASSWORD'] = 'your-16-character-app-password';

// Option 4: Hostinger SMTP (BEST - Uses your domain email) - CONFIGURED ✅
// Using official Hostinger SMTP settings with TLS for better compatibility
$_ENV['HOSTINGER_SMTP_HOST'] = 'smtp.hostinger.com';
$_ENV['HOSTINGER_SMTP_PORT'] = '587'; // TLS port for better compatibility (changed from 465)
$_ENV['HOSTINGER_SMTP_USERNAME'] = 'support@posewithdivine.com';
$_ENV['HOSTINGER_SMTP_PASSWORD'] = 'Support_@_123';

// Common email settings (used by all services)
$_ENV['FROM_EMAIL'] = 'support@posewithdivine.com';
$_ENV['FROM_NAME'] = 'Divine x Parimatch';
$_ENV['EMAIL_ENABLED'] = true;
$_ENV['DEBUG_MODE'] = false;

return $_ENV;
?> 