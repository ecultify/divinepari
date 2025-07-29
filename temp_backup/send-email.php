<?php
// Load environment variables
require_once '../env.php';

// Set CORS headers for cross-origin requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check if email is enabled
if (!$_ENV['EMAIL_ENABLED']) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Email service is disabled']);
    exit();
}

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Validate required fields
$required_fields = ['to', 'posterUrl', 'sessionId'];
$missing_fields = [];

foreach ($required_fields as $field) {
    if (empty($data[$field])) {
        $missing_fields[] = $field;
    }
}

if (!empty($missing_fields)) {
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'message' => 'Missing required fields: ' . implode(', ', $missing_fields)
    ]);
    exit();
}

// Validate email format
if (!filter_var($data['to'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid email address']);
    exit();
}

// Sanitize inputs
$to_email = filter_var($data['to'], FILTER_SANITIZE_EMAIL);
$user_name = !empty($data['userName']) ? htmlspecialchars($data['userName'], ENT_QUOTES, 'UTF-8') : 'there';
$poster_url = filter_var($data['posterUrl'], FILTER_SANITIZE_URL);
$session_id = htmlspecialchars($data['sessionId'], ENT_QUOTES, 'UTF-8');

// Validate poster URL
if (!filter_var($poster_url, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid poster URL']);
    exit();
}

// Generate email content
function generateEmailContent($user_name, $poster_url, $session_id) {
    $html_content = '
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Divine x Parimatch Poster is Ready!</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #000000; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background-color: #F8FF13; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; color: #000000; font-size: 24px; font-weight: bold; }
            .content { padding: 30px 20px; }
            .greeting { font-size: 18px; font-weight: bold; margin-bottom: 20px; color: #000000; }
            .message { font-size: 16px; line-height: 1.6; margin-bottom: 30px; color: #333333; }
            .download-btn { text-align: center; margin: 30px 0; }
            .download-btn a { 
                background-color: #F8FF13; 
                color: #000000; 
                padding: 15px 30px; 
                text-decoration: none; 
                font-weight: bold; 
                font-size: 18px;
                border-radius: 5px;
                display: inline-block;
                text-transform: uppercase;
            }
            .contest-section { 
                background-color: #f8f9fa; 
                padding: 25px; 
                margin: 30px 0; 
                border-left: 5px solid #F8FF13; 
            }
            .contest-title { 
                font-size: 20px; 
                font-weight: bold; 
                margin-bottom: 15px; 
                color: #000000; 
            }
            .contest-steps { margin: 15px 0; }
            .contest-steps li { margin: 10px 0; font-size: 14px; }
            .hashtags { 
                font-weight: bold; 
                color: #F8FF13; 
                background-color: #000000; 
                padding: 10px; 
                border-radius: 5px; 
                text-align: center; 
                margin: 15px 0; 
            }
            .footer { 
                background-color: #000000; 
                color: #ffffff; 
                padding: 20px; 
                text-align: center; 
                font-size: 12px; 
            }
            .session-info { 
                font-size: 10px; 
                color: #cccccc; 
                margin-top: 10px; 
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Your Poster is Ready!</h1>
            </div>
            
            <div class="content">
                <div class="greeting">Hey ' . $user_name . '! 👋</div>
                
                <div class="message">
                    Your amazing <strong>Divine x Parimatch</strong> poster has been generated and is ready for download! 
                    You look absolutely incredible alongside the king of Indian rap - DIVINE himself! 🔥
                </div>
                
                <div class="download-btn">
                    <a href="' . $poster_url . '" target="_blank">DOWNLOAD YOUR POSTER</a>
                </div>
                
                <div class="contest-section">
                    <div class="contest-title">🏆 Enter the Contest & Win Amazing Prizes!</div>
                    
                    <p>Ready to show off your poster and win exclusive Divine x Parimatch merchandise? Here\'s how:</p>
                    
                    <ol class="contest-steps">
                        <li><strong>Upload</strong> your poster to your Instagram feed</li>
                        <li><strong>Tag</strong> @divine and @parimatch in your post</li>
                        <li><strong>Use the hashtags</strong> below in your caption</li>
                        <li><strong>Follow</strong> @playwithparimatch for contest updates</li>
                    </ol>
                    
                    <div class="hashtags">
                        #DivineXParimatch #PoseWithDivine #Contest
                    </div>
                    
                    <p><strong>🎁 Prizes:</strong> Parimatch will select 3 lucky winners each week to receive exclusive Divine x Parimatch merchandise!</p>
                    
                    <p style="font-size: 12px; color: #666;">
                        <em>Campaign runs until 2025. Terms and conditions apply. Winners will be contacted via Instagram.</em>
                    </p>
                </div>
                
                <div class="message">
                    Thank you for being part of the Divine x Parimatch experience! Good luck in the contest! 🚀
                </div>
            </div>
            
            <div class="footer">
                <p>© 2024 Divine x Parimatch. All rights reserved.</p>
                <p>This email was sent from support@posewithdivine.com</p>
                <div class="session-info">Session ID: ' . $session_id . '</div>
            </div>
        </div>
    </body>
    </html>';

    $text_content = "🎉 Your Divine x Parimatch Poster is Ready!

Hey " . $user_name . "! 👋

Your amazing Divine x Parimatch poster has been generated and is ready for download! You look absolutely incredible alongside the king of Indian rap - DIVINE himself! 🔥

Download your poster: " . $poster_url . "

🏆 ENTER THE CONTEST & WIN AMAZING PRIZES!

Ready to show off your poster and win exclusive Divine x Parimatch merchandise? Here's how:

1. Upload your poster to your Instagram feed
2. Tag @divine and @parimatch in your post  
3. Use these hashtags: #DivineXParimatch #PoseWithDivine #Contest
4. Follow @playwithparimatch for contest updates

🎁 PRIZES: Parimatch will select 3 lucky winners each week to receive exclusive Divine x Parimatch merchandise!

Thank you for being part of the Divine x Parimatch experience! Good luck in the contest! 🚀

---
© 2024 Divine x Parimatch. All rights reserved.
This email was sent from support@posewithdivine.com
Session ID: " . $session_id;

    return ['html' => $html_content, 'text' => $text_content];
}

// Generate email content
$email_content = generateEmailContent($user_name, $poster_url, $session_id);

// Prepare Mandrill API request
$mandrill_data = [
    'key' => $_ENV['MANDRILL_API_KEY'],
    'message' => [
        'html' => $email_content['html'],
        'text' => $email_content['text'],
        'subject' => '🎉 Your Divine x Parimatch Poster is Ready!',
        'from_email' => $_ENV['FROM_EMAIL'],
        'from_name' => $_ENV['FROM_NAME'],
        'to' => [
            [
                'email' => $to_email,
                'name' => $user_name,
                'type' => 'to'
            ]
        ],
        'headers' => [
            'Reply-To' => $_ENV['FROM_EMAIL']
        ],
        'important' => false,
        'track_opens' => true,
        'track_clicks' => true,
        'auto_text' => false,
        'auto_html' => false,
        'inline_css' => true,
        'url_strip_qs' => false,
        'preserve_recipients' => false,
        'view_content_link' => false,
        'tracking_domain' => null,
        'signing_domain' => null,
        'return_path_domain' => null,
        'tags' => ['divine-parimatch', 'poster-generated'],
        'metadata' => [
            'session_id' => $session_id,
            'poster_url' => $poster_url
        ]
    ],
    'async' => false
];

// Initialize cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://mandrillapp.com/api/1.0/messages/send.json');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($mandrill_data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

// Execute cURL request
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

// Handle cURL errors
if ($curl_error) {
    error_log("Email cURL Error: " . $curl_error);
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Failed to connect to email service',
        'debug' => $_ENV['DEBUG_MODE'] ? $curl_error : null
    ]);
    exit();
}

// Parse Mandrill response
$mandrill_response = json_decode($response, true);

// Log the response for debugging
if ($_ENV['DEBUG_MODE']) {
    error_log("Mandrill Response: " . print_r($mandrill_response, true));
}

// Handle Mandrill API errors
if ($http_code !== 200) {
    error_log("Email API Error: HTTP $http_code - " . $response);
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Email service error',
        'debug' => $_ENV['DEBUG_MODE'] ? $mandrill_response : null
    ]);
    exit();
}

// Check for Mandrill-specific errors
if (isset($mandrill_response['status']) && $mandrill_response['status'] === 'error') {
    error_log("Mandrill Error: " . $mandrill_response['message']);
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'message' => 'Email sending failed: ' . $mandrill_response['message'],
        'debug' => $_ENV['DEBUG_MODE'] ? $mandrill_response : null
    ]);
    exit();
}

// Check if email was sent successfully
if (is_array($mandrill_response) && count($mandrill_response) > 0) {
    $email_result = $mandrill_response[0];
    
    if (in_array($email_result['status'], ['sent', 'queued', 'scheduled'])) {
        echo json_encode([
            'success' => true,
            'message' => 'Email sent successfully',
            'data' => [
                'email' => $to_email,
                'status' => $email_result['status'],
                'message_id' => $email_result['_id'] ?? null,
                'session_id' => $session_id
            ]
        ]);
    } else {
        error_log("Email delivery failed: " . print_r($email_result, true));
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Email delivery failed: ' . ($email_result['reject_reason'] ?? 'Unknown error'),
            'debug' => $_ENV['DEBUG_MODE'] ? $email_result : null
        ]);
    }
} else {
    error_log("Unexpected Mandrill response: " . print_r($mandrill_response, true));
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Unexpected response from email service',
        'debug' => $_ENV['DEBUG_MODE'] ? $mandrill_response : null
    ]);
}
?> 