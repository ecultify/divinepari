<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS, GET');
header('Access-Control-Allow-Headers: Content-Type');

// DEBUG: Show script is running and env loading
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $env = include(dirname(__DIR__) . '/env.php');
    echo json_encode([
        'success' => true,
        'message' => 'GET request received. Script is working.',
        'env_loaded' => $env,
        'cwd' => getcwd(),
        'script_path' => __FILE__,
        'env_file_path' => dirname(__DIR__) . '/env.php',
        'env_file_exists' => file_exists(dirname(__DIR__) . '/env.php'),
        'smtp_configured' => [
            'host' => !empty($env['HOSTINGER_SMTP_HOST']),
            'username' => !empty($env['HOSTINGER_SMTP_USERNAME']),
            'password' => !empty($env['HOSTINGER_SMTP_PASSWORD']),
            'port' => !empty($env['HOSTINGER_SMTP_PORT'])
        ]
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
$_ENV = include(dirname(__DIR__) . '/env.php');

// Get Hostinger SMTP configuration from environment
$SMTP_HOST = $_ENV['HOSTINGER_SMTP_HOST'] ?? '';
$SMTP_PORT = $_ENV['HOSTINGER_SMTP_PORT'] ?? '';
$SMTP_USERNAME = $_ENV['HOSTINGER_SMTP_USERNAME'] ?? '';
$SMTP_PASSWORD = $_ENV['HOSTINGER_SMTP_PASSWORD'] ?? '';
$FROM_EMAIL = $_ENV['FROM_EMAIL'] ?? '';
$FROM_NAME = $_ENV['FROM_NAME'] ?? '';

// Enhanced configuration validation and logging
if (empty($SMTP_HOST) || empty($SMTP_USERNAME) || empty($SMTP_PASSWORD)) {
    error_log("DIVINE EMAIL ERROR: Hostinger SMTP configuration incomplete in env.php");
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Email service configuration error',
        'details' => 'Hostinger SMTP configuration incomplete',
        'debug' => [
            'env_file_path' => dirname(__DIR__) . '/env.php',
            'env_file_exists' => file_exists(dirname(__DIR__) . '/env.php'),
            'smtp_host_set' => !empty($SMTP_HOST),
            'smtp_username_set' => !empty($SMTP_USERNAME),
            'smtp_password_set' => !empty($SMTP_PASSWORD),
            'script_location' => __FILE__
        ]
    ]);
    exit();
}

if (empty($FROM_EMAIL)) {
    error_log("DIVINE EMAIL ERROR: From email not configured in env.php");
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Email configuration error',
        'details' => 'From email not configured'
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
    
    // Validate email format
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }
    
    // Generate email content
    $subject = 'Your Divine Poster is Ready! 🎤✨';
    $emailHTML = generateEmailHTML($userName, $posterUrl, $sessionId);
    
    // Prepare email headers for HTML email
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: " . $FROM_NAME . " <" . $FROM_EMAIL . ">\r\n";
    $headers .= "Reply-To: " . $FROM_EMAIL . "\r\n";
    $headers .= "X-Mailer: Divine-Parimatch-App/1.0\r\n";
    $headers .= "X-Priority: 3\r\n";
    
    // Configure PHP to use SMTP
    ini_set('SMTP', $SMTP_HOST);
    ini_set('smtp_port', $SMTP_PORT);
    ini_set('sendmail_from', $FROM_EMAIL);
    
    // For PHP on Windows/Hostinger, we might need to use additional configuration
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN' || !empty($_ENV['HOSTINGER_SMTP_HOST'])) {
        // Try to use PHP's built-in mail() function with proper SMTP settings
        $mailSent = mail($to, $subject, $emailHTML, $headers);
        
        if (!$mailSent) {
            // If mail() fails, try alternative SMTP method
            throw new Exception('PHP mail() function failed, trying alternative method...');
        }
    } else {
        // For other servers, try direct SMTP connection
        $emailSent = sendViaDirectSMTP($to, $subject, $emailHTML, $FROM_EMAIL, $FROM_NAME, $SMTP_HOST, $SMTP_PORT, $SMTP_USERNAME, $SMTP_PASSWORD);
        
        if (!$emailSent) {
            throw new Exception('Direct SMTP connection failed');
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Email sent successfully via Hostinger SMTP',
        'debug' => [
            'to_email' => $to,
            'from_email' => $FROM_EMAIL,
            'smtp_host' => $SMTP_HOST,
            'smtp_port' => $SMTP_PORT,
            'method' => 'PHP mail() with SMTP'
        ]
    ]);
    
} catch (Exception $e) {
    // Log the full error for debugging
    error_log("DIVINE EMAIL ERROR: " . $e->getMessage() . " - Request: " . json_encode($input ?? []));
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to send email',
        'details' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s'),
        'server' => 'Hostinger PHP with SMTP',
        'debug' => [
            'input' => [
                'to' => $to ?? null,
                'userName' => $userName ?? null,
                'posterUrl' => $posterUrl ?? null,
                'sessionId' => $sessionId ?? null
            ],
            'smtp_configured' => !empty($SMTP_HOST) && !empty($SMTP_USERNAME) && !empty($SMTP_PASSWORD),
            'from_email_configured' => !empty($FROM_EMAIL),
            'mail_function_available' => function_exists('mail')
        ]
    ]);
}

// Function to send email via direct SMTP connection (alternative method)
function sendViaDirectSMTP($to, $subject, $message, $fromEmail, $fromName, $smtpHost, $smtpPort, $username, $password) {
    // This is a simplified SMTP implementation
    // For production, consider using PHPMailer or similar library
    
    try {
        $socket = fsockopen($smtpHost, $smtpPort, $errno, $errstr, 30);
        
        if (!$socket) {
            throw new Exception("Cannot connect to SMTP server: $errstr ($errno)");
        }
        
        // Read server greeting
        $response = fgets($socket, 256);
        
        // Send EHLO
        fputs($socket, "EHLO " . $_SERVER['HTTP_HOST'] . "\r\n");
        $response = fgets($socket, 256);
        
        // Start TLS if using port 587
        if ($smtpPort == 587) {
            fputs($socket, "STARTTLS\r\n");
            $response = fgets($socket, 256);
            
            // Enable crypto
            stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            
            // Send EHLO again after TLS
            fputs($socket, "EHLO " . $_SERVER['HTTP_HOST'] . "\r\n");
            $response = fgets($socket, 256);
        }
        
        // AUTH LOGIN
        fputs($socket, "AUTH LOGIN\r\n");
        $response = fgets($socket, 256);
        
        fputs($socket, base64_encode($username) . "\r\n");
        $response = fgets($socket, 256);
        
        fputs($socket, base64_encode($password) . "\r\n");
        $response = fgets($socket, 256);
        
        if (strpos($response, '235') === false) {
            throw new Exception('SMTP authentication failed');
        }
        
        // Send email
        fputs($socket, "MAIL FROM: <$fromEmail>\r\n");
        $response = fgets($socket, 256);
        
        fputs($socket, "RCPT TO: <$to>\r\n");
        $response = fgets($socket, 256);
        
        fputs($socket, "DATA\r\n");
        $response = fgets($socket, 256);
        
        $emailContent = "From: $fromName <$fromEmail>\r\n";
        $emailContent .= "To: $to\r\n";
        $emailContent .= "Subject: $subject\r\n";
        $emailContent .= "MIME-Version: 1.0\r\n";
        $emailContent .= "Content-Type: text/html; charset=UTF-8\r\n";
        $emailContent .= "\r\n";
        $emailContent .= $message;
        $emailContent .= "\r\n.\r\n";
        
        fputs($socket, $emailContent);
        $response = fgets($socket, 256);
        
        fputs($socket, "QUIT\r\n");
        fclose($socket);
        
        return strpos($response, '250') !== false;
        
    } catch (Exception $e) {
        error_log("Direct SMTP error: " . $e->getMessage());
        return false;
    }
}

function generateEmailHTML($userName, $posterUrl, $sessionId) {
    $downloadButton = '';
    if ($posterUrl) {
        $downloadButton = '
        <div style="text-align: center; margin: 30px 0;">
            <a href="' . htmlspecialchars($posterUrl) . '" style="display: inline-block; background: #FFFF00; color: #000; padding: 18px 40px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 18px; margin: 20px 0; text-align: center; box-shadow: 0 8px 25px rgba(255, 255, 0, 0.3); transition: all 0.3s ease; border: none; font-family: \'TT Firs Neue\', sans-serif; text-transform: uppercase; letter-spacing: 1px;">
                Download Your Poster Now
            </a>
        </div>';
    }
    
    $sessionInfo = $sessionId ? "Session: " . htmlspecialchars($sessionId) : '';
    
    return '
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Your Divine Poster is Ready!</title>
        
        <!-- Google Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        
        <!-- TT Firs Neue Font -->
        <link href="https://fonts.cdnfonts.com/css/tt-firs-neue" rel="stylesheet">
        
        <!-- Parimatch Sans Font (using alternative) -->
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
        
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: "Poppins", "Helvetica Neue", Arial, sans-serif;
                line-height: 1.6;
                color: #2c2c2c;
                margin: 0;
                padding: 0;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                background-color: #f4f4f4;
            }
            
            .email-wrapper {
                background-image: url("https://posewithdivine.com/images/email/BG_pic.png");
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                min-height: 100vh;
                padding: 40px 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .email-container {
                max-width: 500px;
                width: 100%;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .header-section {
                text-align: center;
                padding: 40px 30px 30px;
                background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
            }
            
            .logo-image {
                max-width: 200px;
                height: auto;
                margin-bottom: 20px;
            }
            
            .content-section {
                padding: 40px 30px;
                background: #ffffff;
            }
            
            .greeting {
                font-size: 24px;
                font-weight: 700;
                color: #2c2c2c;
                margin-bottom: 20px;
                text-align: center;
                font-family: "Montserrat", sans-serif;
            }
            
            .main-message {
                font-size: 18px;
                color: #555555;
                margin-bottom: 25px;
                text-align: center;
                line-height: 1.8;
                font-weight: 500;
            }
            
            .highlight-text {
                color: #F8FF13;
                font-weight: 700;
                background: linear-gradient(135deg, #F8FF13 0%, #E6E600 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .download-section {
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                padding: 25px;
                border-radius: 15px;
                margin: 25px 0;
                border-left: 5px solid #F8FF13;
                text-align: center;
            }
            
            .download-text {
                font-size: 16px;
                color: #2c2c2c;
                margin-bottom: 20px;
                line-height: 1.6;
            }
            
            .cta-button {
                display: inline-block;
                background: #FFFF00;
                color: #000000 !important;
                padding: 18px 40px;
                text-decoration: none;
                border-radius: 50px;
                font-weight: 700;
                font-size: 16px;
                text-transform: uppercase;
                letter-spacing: 1px;
                box-shadow: 0 8px 25px rgba(255, 255, 0, 0.3);
                transition: all 0.3s ease;
                border: none;
                font-family: "TT Firs Neue", sans-serif;
                margin: 10px 0;
            }
            
            .social-section {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 25px;
                border-radius: 15px;
                margin: 25px 0;
                text-align: center;
            }
            
            .social-title {
                font-family: "Montserrat", sans-serif;
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 15px;
                color: #F8FF13;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .social-steps {
                list-style: none;
                padding: 0;
                margin: 0;
                text-align: left;
            }
            
            .social-steps li {
                background: rgba(255, 255, 255, 0.1);
                margin: 8px 0;
                padding: 12px 15px;
                border-radius: 8px;
                border-left: 3px solid #F8FF13;
                font-weight: 500;
                font-size: 14px;
                font-family: Arial, sans-serif;
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
            
            .slot-game-section {
                background: linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%);
                color: white;
                padding: 25px;
                border-radius: 15px;
                margin: 25px 0;
                text-align: center;
                border: 2px solid #F8FF13;
            }
            
            .slot-title {
                font-family: "Montserrat", sans-serif;
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 15px;
                color: #F8FF13;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .slot-message {
                font-size: 14px;
                line-height: 1.6;
                margin-bottom: 15px;
            }
            
            .promo-code {
                background: linear-gradient(135deg, #F8FF13 0%, #E6E600 100%);
                color: #000000;
                padding: 10px 20px;
                border-radius: 25px;
                font-weight: 700;
                font-size: 16px;
                display: inline-block;
                margin: 10px 0;
                font-family: "Montserrat", sans-serif;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .promo-highlight {
                color: #FFFF00;
                font-weight: bold;
            }
            
            .final-message {
                font-size: 18px;
                font-weight: 700;
                color: #2c2c2c;
                margin: 25px 0;
                text-align: center;
                font-family: "Montserrat", sans-serif;
            }
            
            .footer-section {
                background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%);
                color: #ffffff;
                padding: 30px;
                text-align: center;
                border-top: 3px solid #F8FF13;
            }
            
            .footer-text {
                font-size: 14px;
                color: #cccccc;
                margin: 5px 0;
                opacity: 0.8;
            }
            
            .footer-small {
                font-size: 12px;
                color: #999999;
                margin-top: 20px;
                line-height: 1.4;
            }
            
            /* Responsive Design */
            @media screen and (max-width: 600px) {
                .email-wrapper {
                    padding: 20px 10px;
                }
                
                .email-container {
                    border-radius: 15px;
                }
                
                .header-section,
                .content-section {
                    padding: 30px 20px;
                }
                
                .greeting {
                    font-size: 20px;
                }
                
                .main-message {
                    font-size: 16px;
                }
                
                .cta-button {
                    padding: 16px 30px;
                    font-size: 14px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-wrapper">
            <div class="email-container">
                <!-- Header Section -->
                <div class="header-section">
                    <img src="https://posewithdivine.com/images/landing/normalimages/timetoshine.png" alt="Time to Shine" class="logo-image">
                </div>
                
                <!-- Main Content -->
                <div class="content-section">
                    <div class="greeting">
                        Namaste, ' . htmlspecialchars($userName) . '
                    </div>
                    
                    <div class="main-message">
                        Your custom poster with <span class="highlight-text">DIVINE</span> is ready — and yeah, it\'s fire 🔥
                    </div>
                    
                    <!-- Download Section -->
                    <div class="download-section">
                        <div class="download-text">
                            Download the high-quality PDF 📄 — perfect for saving, printing, or showing off 📸
                        </div>
                        
                        ' . $downloadButton . '
                    </div>
                    
                    <!-- Social Sharing Section -->
                    <div class="social-section">
                        <h3 class="social-title">Go one step further:</h3>
                        <ul class="social-steps">
                            <li>
                                <span class="step-number">01</span>
                                1. Share your poster<br>on Instagram
                            </li>
                            <li>
                                <span class="step-number">02</span>
                                2. Tag <span style="color: #FFFF00; font-weight: bold;">@playwithparimatch</span> and use<br><span style="color: #FFFF00; font-weight: bold;">#DIVINExPARIMATCH</span>
                            </li>
                            <li>
                                <span class="step-number">03</span>
                                3. Get a chance to win a limited-edition merch from DIVINE x Parimatch! 🧢👕
                            </li>
                        </ul>
                    </div>
                    
                    <!-- Slot Game Section -->
                    <div class="slot-game-section">
                        <h3 class="slot-title">DIVINE Spin City</h3>
                        <div class="slot-message">
                            Now bring that same energy into DIVINE Spin City, Parimatch\'s brand-new slot game made for champions like You!
                        </div>
                        <div class="promo-code">
                            Use code <span class="promo-highlight">PM-DIVINE</span> to unlock your <span class="promo-highlight">30 Free Spins</span> and get started 🎁
                        </div>
                        <div style="margin-top: 15px;">
                            <a href="https://parimatchglobal.com/en/casino/slots/game/parimatch-games-divine-spin-city" style="display: inline-block; background: #FFFF00; color: #000; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-family: \'TT Firs Neue\', sans-serif;">
                                Play Now
                            </a>
                        </div>
                    </div>
                    
                    <div class="final-message">
                        This is your time to flex, Bro. Let\'s play! 🚀
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="footer-section">
                    <div class="footer-text">
                        This email was sent because you created a poster on our platform.
                    </div>
                    <div class="footer-text">
                        ' . $sessionInfo . '
                    </div>
                    
                    <div class="footer-small">
                        © 2024 Divine x Parimatch. All rights reserved.<br>
                        Visit us at posewithdivine.com
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>';
}
?> 