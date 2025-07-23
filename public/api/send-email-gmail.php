<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS, GET');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests for sending
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Load environment configuration
$_ENV = include(dirname(__DIR__) . '/env.php');

// Gmail SMTP configuration (add these to your env.php)
$GMAIL_USERNAME = $_ENV['GMAIL_USERNAME'] ?? '';
$GMAIL_APP_PASSWORD = $_ENV['GMAIL_APP_PASSWORD'] ?? '';
$FROM_EMAIL = $_ENV['FROM_EMAIL'] ?? '';
$FROM_NAME = $_ENV['FROM_NAME'] ?? '';

if (empty($GMAIL_USERNAME) || empty($GMAIL_APP_PASSWORD)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Gmail SMTP not configured',
        'instructions' => [
            '1. Add GMAIL_USERNAME to your env.php (your Gmail address)',
            '2. Add GMAIL_APP_PASSWORD to your env.php (Gmail App Password)',
            '3. Enable 2-factor authentication on Gmail',
            '4. Generate App Password in Gmail settings'
        ]
    ]);
    exit();
}

try {
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    $to = $input['to'] ?? '';
    $userName = $input['userName'] ?? 'there';
    $posterUrl = $input['posterUrl'] ?? '';
    $sessionId = $input['sessionId'] ?? '';
    
    if (empty($to)) {
        throw new Exception('Email address is required');
    }
    
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }
    
    // Generate email content
    $emailHTML = generateEmailHTML($userName, $posterUrl, $sessionId);
    $emailText = generateEmailText($userName, $posterUrl, $sessionId);
    $subject = 'Your Divine Poster is Ready! 🎤✨';
    
    // Send email using SMTP
    $success = sendEmailViaSMTP($to, $userName, $subject, $emailHTML, $emailText, $GMAIL_USERNAME, $GMAIL_APP_PASSWORD, $FROM_EMAIL, $FROM_NAME);
    
    if ($success) {
        echo json_encode([
            'success' => true,
            'message' => 'Email sent successfully via Gmail SMTP',
            'service' => 'Gmail SMTP',
            'debug' => [
                'to_email' => $to,
                'from_email' => $FROM_EMAIL
            ]
        ]);
    } else {
        throw new Exception('Failed to send email via Gmail SMTP');
    }
    
} catch (Exception $e) {
    error_log("DIVINE EMAIL ERROR (Gmail): " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to send email via Gmail SMTP',
        'details' => $e->getMessage(),
        'service' => 'Gmail SMTP'
    ]);
}

function sendEmailViaSMTP($to, $toName, $subject, $htmlBody, $textBody, $username, $password, $fromEmail, $fromName) {
    // Email headers
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: ' . $fromName . ' <' . $fromEmail . '>',
        'Reply-To: ' . $fromEmail,
        'X-Mailer: PHP/' . phpversion()
    ];
    
    // Configure SMTP for Gmail
    ini_set('SMTP', 'smtp.gmail.com');
    ini_set('smtp_port', '587');
    ini_set('sendmail_from', $fromEmail);
    
    // Additional mail parameters
    $additionalParams = '-f' . $fromEmail;
    
    // Send the email
    $result = mail($to, $subject, $htmlBody, implode("\r\n", $headers), $additionalParams);
    
    return $result;
}

function generateEmailHTML($userName, $posterUrl, $sessionId) {
    $downloadButton = '';
    if ($posterUrl) {
        $downloadButton = '
        <div style="text-align: center; margin: 30px 0;">
            <a href="' . htmlspecialchars($posterUrl) . '" style="display: inline-block; background: linear-gradient(45deg, #F8FF13, #E6E600); color: black; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px; margin: 20px 0; text-align: center; box-shadow: 0 3px 6px rgba(0,0,0,0.2);">
                📥 DOWNLOAD YOUR POSTER
            </a>
        </div>';
    }
    
    return '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Divine Poster is Ready!</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #F8FF13; font-size: 24px; font-weight: bold; margin-bottom: 10px;">🎤 Your Divine Poster is Ready! ✨</h1>
                <p style="color: #666; font-size: 16px;">Time to shine with DIVINE x Parimatch!</p>
            </div>
            
            <div style="margin: 20px 0;">
                <p>Hey ' . htmlspecialchars($userName) . '! 👋</p>
                
                <p>Your epic poster featuring you and India\'s rap king <strong>DIVINE</strong> is ready to download! 🔥</p>
                
                ' . $downloadButton . '
                
                <p>This is your moment to shine bright alongside one of India\'s most iconic rap artists! 🌟</p>
                
                <p>Share your poster and let the world see your <strong>DIVINE</strong> collaboration! 🎤</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
                <p><strong>DIVINE x Parimatch</strong><br>Time to Shine Campaign 2024</p>
            </div>
        </div>
    </body>
    </html>';
}

function generateEmailText($userName, $posterUrl, $sessionId) {
    $downloadText = $posterUrl ? "\n\nDownload your poster: " . $posterUrl : '';
    
    return "🎤 Your Divine Poster is Ready! ✨

Hey " . $userName . "! 👋

Your epic poster featuring you and India's rap king DIVINE is ready to download! 🔥" . $downloadText . "

This is your moment to shine bright alongside one of India's most iconic rap artists! 🌟

Share your poster and let the world see your DIVINE collaboration! 🎤

---
DIVINE x Parimatch
Time to Shine Campaign 2024";
}
?> 