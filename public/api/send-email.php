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
        <div style="text-align: center; margin: 40px 0;">
            <a href="' . htmlspecialchars($posterUrl) . '" style="display: inline-block; background: linear-gradient(135deg, #F8FF13 0%, #E6E600 100%); color: #000; padding: 18px 40px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 18px; margin: 20px 0; text-align: center; box-shadow: 0 8px 25px rgba(248, 255, 19, 0.3); transition: all 0.3s ease; border: none; font-family: \'Montserrat\', sans-serif; text-transform: uppercase; letter-spacing: 1px;">
                🎯 DOWNLOAD YOUR EPIC POSTER
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
        
        <!-- Google Fonts for better typography -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        
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
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 20px;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
                position: relative;
            }
            
            .header-section {
                background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%);
                padding: 40px 30px;
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            
            .header-section::before {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url("data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23F8FF13\" fill-opacity=\"0.05\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
                opacity: 0.3;
                animation: float 20s ease-in-out infinite;
            }
            
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }
            
            .logo-section {
                position: relative;
                z-index: 2;
                margin-bottom: 20px;
            }
            
            .brand-title {
                font-family: "Montserrat", sans-serif;
                font-size: 32px;
                font-weight: 800;
                color: #F8FF13;
                text-transform: uppercase;
                letter-spacing: 3px;
                margin-bottom: 10px;
                text-shadow: 0 0 20px rgba(248, 255, 19, 0.5);
                position: relative;
                z-index: 2;
            }
            
            .brand-subtitle {
                font-family: "Poppins", sans-serif;
                color: #ffffff;
                font-size: 16px;
                font-weight: 300;
                letter-spacing: 1px;
                opacity: 0.9;
                position: relative;
                z-index: 2;
            }
            
            .main-title {
                font-family: "Montserrat", sans-serif;
                font-size: 28px;
                font-weight: 700;
                color: #F8FF13;
                margin: 20px 0 10px;
                text-transform: uppercase;
                letter-spacing: 2px;
                position: relative;
                z-index: 2;
            }
            
            .content-section {
                padding: 50px 40px;
                background: #ffffff;
                position: relative;
            }
            
            .greeting {
                font-size: 20px;
                font-weight: 600;
                color: #2c2c2c;
                margin-bottom: 20px;
                text-align: center;
            }
            
            .main-message {
                font-size: 16px;
                color: #555555;
                margin-bottom: 30px;
                text-align: center;
                line-height: 1.8;
            }
            
            .highlight-text {
                color: #F8FF13;
                font-weight: 700;
                background: linear-gradient(135deg, #F8FF13 0%, #E6E600 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .cta-section {
                text-align: center;
                margin: 40px 0;
                padding: 30px;
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                border-radius: 15px;
                border-left: 5px solid #F8FF13;
            }
            
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #F8FF13 0%, #E6E600 100%);
                color: #000000 !important;
                padding: 18px 40px;
                text-decoration: none;
                border-radius: 50px;
                font-weight: 700;
                font-size: 16px;
                text-transform: uppercase;
                letter-spacing: 1px;
                box-shadow: 0 8px 25px rgba(248, 255, 19, 0.3);
                transition: all 0.3s ease;
                border: none;
                font-family: "Montserrat", sans-serif;
                margin: 10px 0;
            }
            
            .instructions-box {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 15px;
                margin: 30px 0;
                box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
            }
            
            .instructions-title {
                font-family: "Montserrat", sans-serif;
                font-size: 20px;
                font-weight: 700;
                margin-bottom: 20px;
                text-align: center;
                color: #F8FF13;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .instructions-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .instructions-list li {
                background: rgba(255, 255, 255, 0.1);
                margin: 10px 0;
                padding: 15px 20px;
                border-radius: 10px;
                border-left: 4px solid #F8FF13;
                backdrop-filter: blur(10px);
                font-weight: 500;
            }
            
            .instructions-list li strong {
                color: #F8FF13;
                font-weight: 700;
            }
            
            .social-section {
                text-align: center;
                margin: 40px 0;
                padding: 30px;
                background: linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%);
                border-radius: 15px;
                color: white;
            }
            
            .social-title {
                font-family: "Montserrat", sans-serif;
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 20px;
                color: #F8FF13;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .social-links {
                display: flex;
                justify-content: center;
                gap: 20px;
                flex-wrap: wrap;
            }
            
            .social-link {
                display: inline-block;
                background: linear-gradient(135deg, #F8FF13 0%, #E6E600 100%);
                color: #000000 !important;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 25px;
                font-weight: 600;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                transition: all 0.3s ease;
                box-shadow: 0 5px 15px rgba(248, 255, 19, 0.3);
            }
            
            .footer-section {
                background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%);
                color: #ffffff;
                padding: 30px;
                text-align: center;
                border-top: 3px solid #F8FF13;
            }
            
            .footer-brand {
                font-family: "Montserrat", sans-serif;
                font-size: 18px;
                font-weight: 700;
                color: #F8FF13;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
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
                body {
                    padding: 10px;
                }
                
                .email-container {
                    border-radius: 10px;
                }
                
                .header-section,
                .content-section {
                    padding: 30px 20px;
                }
                
                .brand-title {
                    font-size: 24px;
                    letter-spacing: 2px;
                }
                
                .main-title {
                    font-size: 22px;
                    letter-spacing: 1px;
                }
                
                .social-links {
                    flex-direction: column;
                    align-items: center;
                }
                
                .cta-button {
                    padding: 16px 30px;
                    font-size: 14px;
                }
            }
            
            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
                .content-section {
                    background: #1a1a1a;
                }
                
                .greeting,
                .main-message {
                    color: #ffffff;
                }
                
                .instructions-box {
                    background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <!-- Header Section -->
            <div class="header-section">
                <div class="logo-section">
                    <div class="brand-title">DIVINE × PARIMATCH</div>
                    <div class="brand-subtitle">Time to Shine Campaign 2024</div>
                </div>
                <h1 class="main-title">🎤 Your Poster is Ready! ✨</h1>
            </div>
            
            <!-- Main Content -->
            <div class="content-section">
                <div class="greeting">
                    Hey ' . htmlspecialchars($userName) . '! 👋
                </div>
                
                <div class="main-message">
                    Your epic poster featuring you and India\'s rap king <span class="highlight-text">DIVINE</span> is ready to download! 🔥
                    <br><br>
                    This is your moment to <strong>shine bright</strong> alongside one of India\'s most iconic artists!
                </div>
                
                ' . $downloadButton . '
                
                <!-- Instructions Section -->
                <div class="instructions-box">
                    <h3 class="instructions-title">🚀 Share Your Moment</h3>
                    <ul class="instructions-list">
                        <li><strong>1. Download</strong> your personalized poster above</li>
                        <li><strong>2. Share</strong> on social media and tag your friends! 📱</li>
                        <li><strong>3. Use hashtags:</strong> #DivineXParimatch #TimeToShine #PoseWithDivine</li>
                        <li><strong>4. Show support</strong> for DIVINE and Parimatch! 🙌</li>
                    </ul>
                </div>
                
                <!-- Social Section -->
                <div class="social-section">
                    <h3 class="social-title">Connect With Us</h3>
                    <div class="social-links">
                        <a href="#" class="social-link">@DivineRapper</a>
                        <a href="#" class="social-link">@Parimatch</a>
                        <a href="#" class="social-link">#TimeToShine</a>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0; font-size: 16px; color: #666;">
                    Share your poster and let the world see your <span class="highlight-text">DIVINE</span> collaboration! 🎤⭐
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer-section">
                <div class="footer-brand">DIVINE × PARIMATCH</div>
                <div class="footer-text">Official Time to Shine Campaign</div>
                <div class="footer-text">Making Dreams Come True Since 2024</div>
                
                <div class="footer-small">
                    This email was sent because you created a poster on our platform.<br>
                    ' . $sessionInfo . '<br><br>
                    © 2024 Divine x Parimatch. All rights reserved.<br>
                    Visit us at posewithdivine.com
                </div>
            </div>
        </div>
    </body>
    </html>';
}
?> 