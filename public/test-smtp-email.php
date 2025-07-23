<?php
// Test SMTP Email Configuration
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load environment variables
require_once __DIR__ . '/env.php';

echo "<h1>SMTP Email Test</h1>";

// Display current email configuration
echo "<h2>Current Email Configuration:</h2>";
echo "<table border='1' cellpadding='5' cellspacing='0'>";
echo "<tr><td><strong>SMTP Host:</strong></td><td>" . ($_ENV['HOSTINGER_SMTP_HOST'] ?? 'Not set') . "</td></tr>";
echo "<tr><td><strong>SMTP Port:</strong></td><td>" . ($_ENV['HOSTINGER_SMTP_PORT'] ?? 'Not set') . "</td></tr>";
echo "<tr><td><strong>SMTP Username:</strong></td><td>" . ($_ENV['HOSTINGER_SMTP_USERNAME'] ?? 'Not set') . "</td></tr>";
echo "<tr><td><strong>SMTP Password:</strong></td><td>" . (isset($_ENV['HOSTINGER_SMTP_PASSWORD']) ? '[SET - ' . strlen($_ENV['HOSTINGER_SMTP_PASSWORD']) . ' characters]' : 'Not set') . "</td></tr>";
echo "<tr><td><strong>From Email:</strong></td><td>" . ($_ENV['FROM_EMAIL'] ?? 'Not set') . "</td></tr>";
echo "<tr><td><strong>From Name:</strong></td><td>" . ($_ENV['FROM_NAME'] ?? 'Not set') . "</td></tr>";
echo "</table>";

// Test email configuration
$testEmail = isset($_GET['email']) ? $_GET['email'] : '';

if ($testEmail) {
    echo "<h2>Testing Email Send to: " . htmlspecialchars($testEmail) . "</h2>";
    
    try {
        // Check if required settings are available
        if (empty($_ENV['HOSTINGER_SMTP_HOST']) || empty($_ENV['HOSTINGER_SMTP_USERNAME']) || empty($_ENV['HOSTINGER_SMTP_PASSWORD'])) {
            throw new Exception('SMTP configuration is incomplete');
        }
        
        // Prepare email content
        $to = $testEmail;
        $subject = "Divine x Parimatch - SMTP Test Email";
        $message = "
        <html>
        <head>
            <title>SMTP Test Email</title>
        </head>
        <body>
            <h2>SMTP Email Test Successful!</h2>
            <p>This is a test email sent from your Divine x Parimatch application.</p>
            <p><strong>Sent at:</strong> " . date('Y-m-d H:i:s') . "</p>
            <p><strong>From:</strong> " . $_ENV['FROM_EMAIL'] . "</p>
            <p><strong>SMTP Host:</strong> " . $_ENV['HOSTINGER_SMTP_HOST'] . "</p>
            <p><strong>SMTP Port:</strong> " . $_ENV['HOSTINGER_SMTP_PORT'] . "</p>
            <p>If you received this email, your SMTP configuration is working correctly!</p>
        </body>
        </html>
        ";
        
        // Headers
        $headers = array(
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            'From: ' . $_ENV['FROM_NAME'] . ' <' . $_ENV['FROM_EMAIL'] . '>',
            'Reply-To: ' . $_ENV['FROM_EMAIL'],
            'X-Mailer: PHP/' . phpversion()
        );
        
        // Check if mail() function is available
        if (!function_exists('mail')) {
            throw new Exception('PHP mail() function is not available');
        }
        
        // Configure SMTP settings for mail() function
        ini_set('SMTP', $_ENV['HOSTINGER_SMTP_HOST']);
        ini_set('smtp_port', $_ENV['HOSTINGER_SMTP_PORT']);
        ini_set('sendmail_from', $_ENV['FROM_EMAIL']);
        
        // Try to send email using PHP's mail() function
        echo "<p>Attempting to send test email using PHP mail() function...</p>";
        
        $result = mail($to, $subject, $message, implode("\r\n", $headers));
        
        if ($result) {
            echo "<div style='color: green; border: 2px solid green; padding: 10px; margin: 10px 0;'>";
            echo "<h3>✅ EMAIL SENT SUCCESSFULLY!</h3>";
            echo "<p>Test email was sent to: <strong>" . htmlspecialchars($testEmail) . "</strong></p>";
            echo "<p>Please check your inbox (and spam folder) for the test email.</p>";
            echo "</div>";
        } else {
            throw new Exception('mail() function returned false');
        }
        
    } catch (Exception $e) {
        echo "<div style='color: red; border: 2px solid red; padding: 10px; margin: 10px 0;'>";
        echo "<h3>❌ EMAIL SEND FAILED</h3>";
        echo "<p><strong>Error:</strong> " . $e->getMessage() . "</p>";
        echo "</div>";
        
        // Try alternative method using PHPMailer-like approach
        echo "<h3>Trying Alternative SMTP Method...</h3>";
        
        try {
            // Use PHP's built-in SMTP functionality
            $smtp_server = $_ENV['HOSTINGER_SMTP_HOST'];
            $smtp_port = $_ENV['HOSTINGER_SMTP_PORT'];
            $smtp_username = $_ENV['HOSTINGER_SMTP_USERNAME'];
            $smtp_password = $_ENV['HOSTINGER_SMTP_PASSWORD'];
            
            // Create socket connection
            $socket = fsockopen($smtp_server, $smtp_port, $errno, $errstr, 30);
            
            if (!$socket) {
                throw new Exception("Cannot connect to SMTP server: $errstr ($errno)");
            }
            
            // Read server greeting
            $response = fgets($socket, 256);
            echo "<p>Server greeting: " . htmlspecialchars(trim($response)) . "</p>";
            
            // Send EHLO
            fputs($socket, "EHLO " . $_SERVER['HTTP_HOST'] . "\r\n");
            $response = fgets($socket, 256);
            echo "<p>EHLO response: " . htmlspecialchars(trim($response)) . "</p>";
            
            // Start TLS if using port 587
            if ($smtp_port == 587) {
                fputs($socket, "STARTTLS\r\n");
                $response = fgets($socket, 256);
                echo "<p>STARTTLS response: " . htmlspecialchars(trim($response)) . "</p>";
            }
            
            // AUTH LOGIN
            fputs($socket, "AUTH LOGIN\r\n");
            $response = fgets($socket, 256);
            echo "<p>AUTH response: " . htmlspecialchars(trim($response)) . "</p>";
            
            fputs($socket, base64_encode($smtp_username) . "\r\n");
            $response = fgets($socket, 256);
            echo "<p>Username response: " . htmlspecialchars(trim($response)) . "</p>";
            
            fputs($socket, base64_encode($smtp_password) . "\r\n");
            $response = fgets($socket, 256);
            echo "<p>Password response: " . htmlspecialchars(trim($response)) . "</p>";
            
            if (strpos($response, '235') !== false) {
                echo "<div style='color: green; padding: 10px; margin: 10px 0; border: 1px solid green;'>";
                echo "<h4>✅ SMTP Authentication Successful!</h4>";
                echo "<p>Your SMTP credentials are correct and the server is accepting connections.</p>";
                echo "</div>";
            } else {
                echo "<div style='color: red; padding: 10px; margin: 10px 0; border: 1px solid red;'>";
                echo "<h4>❌ SMTP Authentication Failed</h4>";
                echo "<p>Check your SMTP username and password.</p>";
                echo "</div>";
            }
            
            // Close connection
            fputs($socket, "QUIT\r\n");
            fclose($socket);
            
        } catch (Exception $altError) {
            echo "<div style='color: red; border: 2px solid red; padding: 10px; margin: 10px 0;'>";
            echo "<h4>❌ Alternative SMTP Test Failed</h4>";
            echo "<p><strong>Error:</strong> " . $altError->getMessage() . "</p>";
            echo "</div>";
        }
    }
} else {
    // Show form to enter test email
    echo "<h2>Enter Email Address to Test:</h2>";
    echo "<form method='GET'>";
    echo "<input type='email' name='email' placeholder='your-email@example.com' required style='padding: 10px; width: 300px;'>";
    echo "<button type='submit' style='padding: 10px 20px; margin-left: 10px; background: #4CAF50; color: white; border: none; cursor: pointer;'>Send Test Email</button>";
    echo "</form>";
    
    echo "<h3>Quick Test Emails:</h3>";
    echo "<ul>";
    echo "<li><a href='?email=98abrai@gmail.com'>Test with 98abrai@gmail.com</a></li>";
    echo "<li><a href='?email=support@posewithdivine.com'>Test with support@posewithdivine.com</a></li>";
    echo "</ul>";
}

// Show PHP mail configuration
echo "<h2>PHP Mail Configuration:</h2>";
echo "<table border='1' cellpadding='5' cellspacing='0'>";
echo "<tr><td><strong>mail() function available:</strong></td><td>" . (function_exists('mail') ? 'Yes ✅' : 'No ❌') . "</td></tr>";
echo "<tr><td><strong>SMTP (php.ini):</strong></td><td>" . (ini_get('SMTP') ?: 'Not set') . "</td></tr>";
echo "<tr><td><strong>smtp_port (php.ini):</strong></td><td>" . (ini_get('smtp_port') ?: 'Not set') . "</td></tr>";
echo "<tr><td><strong>sendmail_from (php.ini):</strong></td><td>" . (ini_get('sendmail_from') ?: 'Not set') . "</td></tr>";
echo "</table>";

echo "<h2>Server Information:</h2>";
echo "<table border='1' cellpadding='5' cellspacing='0'>";
echo "<tr><td><strong>PHP Version:</strong></td><td>" . phpversion() . "</td></tr>";
echo "<tr><td><strong>Server Software:</strong></td><td>" . ($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown') . "</td></tr>";
echo "<tr><td><strong>Current Time:</strong></td><td>" . date('Y-m-d H:i:s') . "</td></tr>";
echo "</table>";
?> 