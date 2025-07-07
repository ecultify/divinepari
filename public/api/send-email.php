<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS, GET');
header('Access-Control-Allow-Headers: Content-Type');

// DEBUG: Show script is running and env loading
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $env = include(dirname(__DIR__) . '/../env.php');
    echo json_encode([
        'success' => true,
        'message' => 'GET request received. Script is working.',
        'env_loaded' => $env,
        'cwd' => getcwd(),
        'script_path' => __FILE__
    ]);
    exit();
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Load environment configuration
$_ENV = include(dirname(__DIR__) . '/../env.php');

// Get configuration from environment
$MANDRILL_API_KEY = $_ENV['MANDRILL_API_KEY'] ?? '';
$SMTP_HOST = $_ENV['SMTP_HOST'] ?? 'smtp.mandrillapp.com';
$SMTP_PORT = $_ENV['SMTP_PORT'] ?? '587';
$SMTP_USERNAME = $_ENV['SMTP_USERNAME'] ?? '';
$FROM_EMAIL = $_ENV['FROM_EMAIL'] ?? '';
$FROM_NAME = $_ENV['FROM_NAME'] ?? '';

// Enhanced configuration validation and logging
if (empty($MANDRILL_API_KEY)) {
    error_log("DIVINE EMAIL ERROR: Mandrill API key not found in env.php");
    throw new Exception('Email service configuration error');
}

if (empty($FROM_EMAIL)) {
    error_log("DIVINE EMAIL ERROR: From email not configured in env.php");
    throw new Exception('Email configuration error');
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
    
    // Validate email format
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }
    
    // Generate email HTML
    $emailHTML = generateEmailHTML($userName, $posterUrl, $sessionId);
    $emailText = generateEmailText($userName, $posterUrl, $sessionId);
    
    // Setup email headers
    $headers = array(
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: ' . $FROM_NAME . ' <' . $FROM_EMAIL . '>',
        'Reply-To: ' . $FROM_EMAIL,
        'X-Mailer: PHP/' . phpversion(),
        'X-Priority: 1',
        'X-MSMail-Priority: High',
        'X-MC-Track: opens,clicks_htmlonly',
        'X-MC-GoogleAnalytics: posewithdivine.com',
        'X-MC-Tags: poster-generated, divine-parimatch'
    );

    // Configure SMTP settings
    ini_set('SMTP', $SMTP_HOST);
    ini_set('smtp_port', $SMTP_PORT);
    
    // Setup additional mail parameters
    $params = '-f ' . $FROM_EMAIL;
    
    // Send email using PHP mail() with SMTP configuration
    $subject = 'Your Divine Poster is Ready! 🎤✨';
    $success = mail($to, $subject, $emailHTML, implode("\r\n", $headers), $params);
    
    if (!$success) {
        $error = error_get_last();
        error_log("DIVINE EMAIL ERROR: mail() failed - " . ($error['message'] ?? 'Unknown error'));
        throw new Exception('Failed to send email via SMTP');
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Email sent successfully',
        'debug' => [
            'smtp_host' => $SMTP_HOST,
            'smtp_port' => $SMTP_PORT,
            'from_email' => $FROM_EMAIL,
            'to_email' => $to
        ]
    ]);
    
} catch (Exception $e) {
    // Log the full error for debugging
    error_log("DIVINE EMAIL ERROR: " . $e->getMessage() . " - Request: " . json_encode($_POST));
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to send email',
        'details' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s'),
        'server' => 'Hostinger PHP',
        'debug' => [
            'input' => [
                'to' => $to ?? null,
                'userName' => $userName ?? null,
                'posterUrl' => $posterUrl ?? null,
                'sessionId' => $sessionId ?? null
            ],
            'mandrill_key_details' => [
                'length' => strlen($MANDRILL_API_KEY),
                'starts_with' => substr($MANDRILL_API_KEY, 0, 3),
                'is_set' => !empty($MANDRILL_API_KEY),
                'is_empty' => empty($MANDRILL_API_KEY)
            ],
            'from_email_set' => !empty($FROM_EMAIL),
            'from_name_set' => !empty($FROM_NAME)
        ]
    ]);
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
    
    $sessionInfo = $sessionId ? "Session ID: " . htmlspecialchars($sessionId) : '';
    
    return '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Divine Poster is Ready!</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
            .container { background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .title { color: #F8FF13; font-size: 24px; font-weight: bold; margin-bottom: 10px; text-shadow: 1px 1px 2px rgba(0,0,0,0.1); }
            .subtitle { color: #666; font-size: 16px; }
            .content { margin: 20px 0; }
            .instructions { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F8FF13; }
            .instructions h3 { color: #333; margin-top: 0; }
            .instructions ol { margin: 10px 0; padding-left: 20px; }
            .instructions li { margin: 8px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
            .social-links { margin: 20px 0; }
            .social-links a { color: #F8FF13; text-decoration: none; margin: 0 10px; font-weight: bold; }
            .highlight { color: #F8FF13; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="title">🎤 Your Divine Poster is Ready! ✨</h1>
                <p class="subtitle">Time to shine with DIVINE x Parimatch!</p>
            </div>
            
            <div class="content">
                <p>Hey ' . htmlspecialchars($userName) . '! 👋</p>
                
                <p>Your epic poster featuring you and India\'s rap king <strong>DIVINE</strong> is ready to download! 🔥</p>
                
                ' . $downloadButton . '
                
                <div class="instructions">
                    <h3>🏆 Want to Win Limited-Edition Merch?</h3>
                    <p>Follow these steps to enter our weekly giveaway:</p>
                    <ol>
                        <li><strong>Upload</strong> your poster to your Instagram feed</li>
                        <li><strong>Use the hashtag</strong> <span class="highlight">#DIVINExparimatch</span></li>
                        <li><strong>Tag</strong> <span class="highlight">@playwithparimatch</span> in your post</li>
                    </ol>
                    <p><strong>Parimatch selects 3 lucky winners each week!</strong> Your name could be on that list—drop your poster and let fate decide! 🎯</p>
                </div>
                
                <p>Share your poster and show the world your star power! ⭐</p>
            </div>
            
            <div class="footer">
                <div class="social-links">
                    <a href="https://instagram.com/playwithparimatch" target="_blank">@playwithparimatch</a>
                    <span>•</span>
                    <a href="https://posewithdivine.com" target="_blank">posewithdivine.com</a>
                </div>
                <p>© 2024 Divine x Parimatch. All rights reserved.</p>
                <p style="font-size: 12px; color: #999;">
                    This email was sent because you generated a poster on our platform.
                    ' . $sessionInfo . '
                </p>
            </div>
        </div>
    </body>
    </html>';
}

function generateEmailText($userName, $posterUrl, $sessionId) {
    $downloadText = $posterUrl ? "Download your poster: " . $posterUrl . "\n\n" : '';
    $sessionInfo = $sessionId ? "Session ID: " . $sessionId : '';
    
    return "Your Divine Poster is Ready! 🎤✨

Download your poster: $posterUrl

Share your poster on Instagram with #DIVINExparimatch and tag @playwithparimatch for a chance to win limited-edition merch!\n\n$sessionInfo";
}
?> 