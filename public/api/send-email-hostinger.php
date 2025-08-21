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

// Hostinger SMTP configuration
$HOSTINGER_SMTP_HOST = $_ENV['HOSTINGER_SMTP_HOST'] ?? '';
$HOSTINGER_SMTP_PORT = $_ENV['HOSTINGER_SMTP_PORT'] ?? '';
$HOSTINGER_SMTP_USERNAME = $_ENV['HOSTINGER_SMTP_USERNAME'] ?? '';
$HOSTINGER_SMTP_PASSWORD = $_ENV['HOSTINGER_SMTP_PASSWORD'] ?? '';
$FROM_EMAIL = $_ENV['FROM_EMAIL'] ?? '';
$FROM_NAME = $_ENV['FROM_NAME'] ?? '';

if (empty($HOSTINGER_SMTP_HOST) || empty($HOSTINGER_SMTP_USERNAME) || empty($HOSTINGER_SMTP_PASSWORD)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Hostinger SMTP not configured',
        'instructions' => [
            '1. Go to Hostinger Control Panel → Email Accounts',
            '2. Find your email account settings/configuration',
            '3. Look for SMTP server details',
            '4. Add these to your env.php:',
            '   HOSTINGER_SMTP_HOST (smtp.hostinger.com)',
            '   HOSTINGER_SMTP_PORT (465 for SSL or 587 for STARTTLS)',
            '   HOSTINGER_SMTP_USERNAME (your full email address)',
            '   HOSTINGER_SMTP_PASSWORD (your email password)'
        ],
        'debug' => [
            'smtp_host_configured' => !empty($HOSTINGER_SMTP_HOST),
            'smtp_username_configured' => !empty($HOSTINGER_SMTP_USERNAME),
            'smtp_password_configured' => !empty($HOSTINGER_SMTP_PASSWORD),
            'current_host' => $HOSTINGER_SMTP_HOST,
            'current_port' => $HOSTINGER_SMTP_PORT
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
    
    // Send email using Hostinger SMTP
    $success = sendEmailViaHostingerSMTP(
        $to, 
        $userName, 
        $subject, 
        $emailHTML, 
        $emailText, 
        $HOSTINGER_SMTP_HOST,
        $HOSTINGER_SMTP_PORT,
        $HOSTINGER_SMTP_USERNAME, 
        $HOSTINGER_SMTP_PASSWORD, 
        $FROM_EMAIL, 
        $FROM_NAME
    );
    
    if ($success) {
        echo json_encode([
            'success' => true,
            'message' => 'Email sent successfully via Hostinger SMTP',
            'service' => 'Hostinger SMTP',
            'debug' => [
                'to_email' => $to,
                'from_email' => $FROM_EMAIL,
                'smtp_host' => $HOSTINGER_SMTP_HOST,
                'smtp_port' => $HOSTINGER_SMTP_PORT,
                'encryption' => $HOSTINGER_SMTP_PORT == '465' ? 'SSL/TLS' : 'STARTTLS'
            ]
        ]);
    } else {
        // Get the last error from PHP
        $lastError = error_get_last();
        throw new Exception('Failed to send email via Hostinger SMTP. Error: ' . ($lastError['message'] ?? 'Unknown error'));
    }
    
} catch (Exception $e) {
    error_log("DIVINE EMAIL ERROR (Hostinger): " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to send email via Hostinger SMTP',
        'details' => $e->getMessage(),
        'service' => 'Hostinger SMTP',
        'debug' => [
            'smtp_configured' => !empty($HOSTINGER_SMTP_HOST),
            'current_settings' => [
                'host' => $HOSTINGER_SMTP_HOST,
                'port' => $HOSTINGER_SMTP_PORT,
                'username' => $HOSTINGER_SMTP_USERNAME ? 'configured' : 'missing'
            ]
        ]
    ]);
}

function sendEmailViaHostingerSMTP($to, $toName, $subject, $htmlBody, $textBody, $smtpHost, $smtpPort, $username, $password, $fromEmail, $fromName) {
    // Create boundary for multipart email
    $boundary = uniqid('boundary_');
    
    // Email headers for multipart message
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
        'From: ' . $fromName . ' <' . $fromEmail . '>',
        'Reply-To: ' . $fromEmail,
        'X-Mailer: PHP/' . phpversion(),
        'X-Priority: 3',
        'Return-Path: ' . $fromEmail,
        'Message-ID: <' . uniqid() . '@posewithdivine.com>'
    ];
    
    // Create multipart message body
    $messageBody = "--" . $boundary . "\r\n";
    $messageBody .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $messageBody .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
    $messageBody .= $textBody . "\r\n\r\n";
    
    $messageBody .= "--" . $boundary . "\r\n";
    $messageBody .= "Content-Type: text/html; charset=UTF-8\r\n";
    $messageBody .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
    $messageBody .= $htmlBody . "\r\n\r\n";
    
    $messageBody .= "--" . $boundary . "--\r\n";
    
    // Store original settings
    $originalSMTP = ini_get('SMTP');
    $originalPort = ini_get('smtp_port');
    $originalSendmail = ini_get('sendmail_from');
    
    // Configure SMTP settings for Hostinger
    ini_set('SMTP', $smtpHost);
    ini_set('smtp_port', $smtpPort);
    ini_set('sendmail_from', $fromEmail);
    
    // For port 465 (SSL), we need to handle it differently
    if ($smtpPort == '465') {
        // SSL configuration
        ini_set('SMTP', 'ssl://' . $smtpHost);
    } else {
        // STARTTLS configuration (port 587)
        ini_set('SMTP', $smtpHost);
    }
    
    // Send the email
    $result = mail($to, $subject, $messageBody, implode("\r\n", $headers));
    
    // Restore original settings
    ini_set('SMTP', $originalSMTP);
    ini_set('smtp_port', $originalPort);
    ini_set('sendmail_from', $originalSendmail);
    
    return $result;
}

function generateEmailHTML($userName, $posterUrl, $sessionId) {
    $downloadButton = '';
    if ($posterUrl) {
        $downloadButton = '
        <div style="text-align: center; margin: 30px 0;">
            <a href="' . htmlspecialchars($posterUrl) . '" style="display: inline-block; background: #FFFF00; color: #000; padding: 18px 40px; text-decoration: none; border-radius: 50px; font-family: \'TT Firs Neue\', Arial, sans-serif; font-weight: bold; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 8px 25px rgba(255, 255, 0, 0.3); transition: all 0.3s ease; border: 3px solid #FFFF00;">
                Download Your Poster Now
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
        <link href="https://fonts.cdnfonts.com/css/tt-firs-neue" rel="stylesheet">
        <style>
            @font-face {
                font-family: "Pari-Match";
                src: url("https://posewithdivine.com/fonts/Pari-Match Regular/Web Fonts/c03740f2ffb689fef4bbb9c26116c4c1.woff2") format("woff2"),
                     url("https://posewithdivine.com/fonts/Pari-Match Regular/Web Fonts/c03740f2ffb689fef4bbb9c26116c4c1.woff") format("woff");
                font-weight: normal;
                font-style: normal;
                font-display: fallback;
            }
            .parimatch-font {
                font-family: "Pari-Match", "Inter", Arial, sans-serif !important;
            }
            .glow-text {
                text-shadow: 0 0 20px rgba(248, 255, 19, 0.5);
            }
            .step-number {
                display: inline-block;
                width: 32px;
                height: 32px;
                border: 2px solid #FFFF00;
                background: transparent;
                color: #FFFF00;
                border-radius: 50%;
                text-align: center;
                line-height: 28px;
                font-size: 14px;
                font-weight: bold;
                margin-right: 15px;
                font-family: "Inter", sans-serif;
                vertical-align: top;
                margin-top: 2px;
            }
        </style>
    </head>
    <body style="font-family: \"Inter\", Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="background-image: url(\'https://posewithdivine.com/images/email/BG_pic.png\'); background-size: cover; background-position: center; background-repeat: no-repeat; min-height: 100vh; padding: 40px 20px; display: flex; align-items: center; justify-content: center;">
            <div style="max-width: 500px; width: 100%; background: rgba(255, 255, 255, 0.95); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2);">
                
                <!-- Header Section -->
                <div style="text-align: center; padding: 40px 30px 30px; background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);">
                    <img src="https://posewithdivine.com/images/landing/normalimages/timetoshine.png" alt="Time to Shine" style="max-width: 200px; height: auto; margin-bottom: 20px;">
                </div>
                
                <!-- Main Content -->
                <div style="padding: 40px 30px; background: #ffffff;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <p style="font-size: 24px; font-weight: 700; color: #2c2c2c; margin: 0 0 10px 0; font-family: \'Montserrat\', sans-serif;">
                            Namaste, <span style="display: inline-block; background: linear-gradient(135deg, #F8FF13, #E6E600); color: #000000; padding: 2px 12px; border-radius: 4px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">' . htmlspecialchars($userName) . '</span>
                        </p>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); padding: 25px; border-radius: 15px; border-left: 5px solid #F8FF13; margin: 25px 0; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                        <p style="font-size: 18px; margin: 0 0 15px 0; color: #2c3e50; line-height: 1.8; text-align: center;">
                            Your custom poster with <strong style="color: #000; background: linear-gradient(135deg, #F8FF13, #E6E600); padding: 2px 8px; border-radius: 4px;">DIVINE</strong> is ready — and yeah, it\'s fire 🔥
                        </p>
                        
                        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 25px; border-radius: 15px; margin: 25px 0; border-left: 5px solid #F8FF13; text-align: center;">
                            <p style="font-size: 16px; color: #2c2c2c; margin-bottom: 20px; line-height: 1.6;">
                                Download the high-quality PDF 📄 — perfect for saving, printing, or showing off 📸
                            </p>
                            
                            ' . $downloadButton . '
                        </div>
                    </div>
                    
                    <!-- Social Sharing Section -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 15px; text-align: center; margin: 25px 0;">
                        <h3 style="color: #F8FF13; margin: 0 0 15px 0; font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Go one step further:</h3>
                        <ul style="list-style: none; padding: 0; margin: 0; text-align: left;">
                            <li style="background: rgba(255, 255, 255, 0.1); margin: 8px 0; padding: 12px 15px; border-radius: 8px; border-left: 3px solid #F8FF13; font-weight: 500; font-size: 14px; font-family: Arial, sans-serif;">
                                <span class="step-number">01</span>
                                1. Share your poster<br>on Instagram
                            </li>
                            <li style="background: rgba(255, 255, 255, 0.1); margin: 8px 0; padding: 12px 15px; border-radius: 8px; border-left: 3px solid #F8FF13; font-weight: 500; font-size: 14px; font-family: Arial, sans-serif;">
                                <span class="step-number">02</span>
                                2. Tag <span style="color: #FFFF00; font-weight: bold;">@playwithparimatch</span> and use<br><span style="color: #FFFF00; font-weight: bold;">#DIVINExPARIMATCH</span>
                            </li>
                            <li style="background: rgba(255, 255, 255, 0.1); margin: 8px 0; padding: 12px 15px; border-radius: 8px; border-left: 3px solid #F8FF13; font-weight: 500; font-size: 14px; font-family: Arial, sans-serif;">
                                <span class="step-number">03</span>
                                3. Get a chance to win a limited-edition merch from DIVINE x Parimatch! 🧢👕
                            </li>
                        </ul>
                    </div>
                    
                    <!-- Slot Game Section -->
                    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%); color: white; padding: 25px; border-radius: 15px; margin: 25px 0; text-align: center; border: 2px solid #F8FF13;">
                        <h3 style="color: #F8FF13; margin: 0 0 15px 0; font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">DIVINE Spin City</h3>
                        <p style="font-size: 14px; line-height: 1.6; margin-bottom: 15px;">
                            Now bring that same energy into DIVINE Spin City, Parimatch\'s brand-new slot game made for champions like You!
                        </p>
                        <div style="background: linear-gradient(135deg, #F8FF13 0%, #E6E600 100%); color: #000000; padding: 10px 20px; border-radius: 25px; font-weight: 700; font-size: 16px; display: inline-block; margin: 10px 0; text-transform: uppercase; letter-spacing: 1px;">
                            Use code <span style="color: #FFFF00; font-weight: bold;">PM-DIVINE</span> to unlock your <span style="color: #FFFF00; font-weight: bold;">30 Free Spins</span> and get started 🎁
                        </div>
                        <div style="margin-top: 15px;">
                            <a href="https://track.paritrat.online/33d5905f-2d42-4b3c-b138-c70aefa9dd7b" style="display: inline-block; background: #FFFF00; color: #000; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-family: \'TT Firs Neue\', sans-serif;">
                                Play Now
                            </a>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin: 25px 0; font-size: 18px; font-weight: 700; color: #2c2c2c; font-family: \'Montserrat\', sans-serif;">
                        This is your time to flex, Bro. Let\'s play! 🚀
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); color: #ecf0f1; text-align: center; padding: 30px; border-top: 3px solid #F8FF13;">
                    <div style="margin-bottom: 15px;">
                        <p style="font-size: 14px; margin: 0; color: #bdc3c7; font-weight: 500;">
                            This email was sent because you created a poster on our platform.
                        </p>
                        <p style="font-size: 14px; margin: 5px 0; color: #bdc3c7; font-weight: 500;">
                            Session: ' . htmlspecialchars($sessionId) . '
                        </p>
                    </div>
                    
                    <div style="border-top: 1px solid #34495e; padding-top: 15px; margin-top: 15px;">
                        <p style="font-size: 12px; margin: 0; color: #95a5a6; line-height: 1.4;">
                            © 2024 Divine x Parimatch. All rights reserved.<br>
                            Visit us at posewithdivine.com
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>';
}

function generateEmailText($userName, $posterUrl, $sessionId) {
    $downloadText = $posterUrl ? "\n\n📥 DOWNLOAD YOUR POSTER: " . $posterUrl : '';
    
    return "🎤✨ YOUR DIVINE POSTER IS READY! ✨🎤

Namaste, " . $userName . "

═══════════════════════════════════════

Your custom poster with DIVINE is ready — and yeah, it's fire 🔥" . $downloadText . "

Download the high-quality PDF 📄 — perfect for saving, printing, or showing off 📸

═══════════════════════════════════════

GO ONE STEP FURTHER:
1. Share your poster on Instagram
2. Tag @playwithparimatch and use #DIVINExParimatch
3. Get a chance to win a limited-edition merch from DIVINE x Parimatch! 🧢👕

═══════════════════════════════════════

DIVINE SPIN CITY
Now bring that same energy into DIVINE Spin City, Parimatch's brand-new slot game made for champions like You!

Use code PM-DIVINE to unlock your 30 Free Spins and get started 🎁

═══════════════════════════════════════

This is your time to flex, Bro. Let's play! 🚀

═══════════════════════════════════════

This email was sent because you created a poster on our platform.
Session: " . $sessionId . "

© 2024 Divine x Parimatch. All rights reserved.
Visit us at posewithdivine.com";
}
?> 