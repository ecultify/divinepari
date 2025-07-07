<?php
header('Content-Type: text/html; charset=utf-8');

echo "<h1>🔧 Hostinger Email Debug Tool</h1>";
echo "<p><strong>Environment:</strong> Hostinger Shared Hosting</p>";
echo "<hr>";

// 1. PHP Version and Extensions Check
echo "<h2>1. PHP Environment Check</h2>";
echo "<strong>PHP Version:</strong> " . phpversion() . "<br>";

$required_extensions = ['curl', 'json', 'filter'];
foreach ($required_extensions as $ext) {
    $status = extension_loaded($ext) ? "✅ Enabled" : "❌ Missing";
    echo "<strong>$ext extension:</strong> $status<br>";
}

// 2. cURL Detailed Check
echo "<h2>2. cURL Configuration</h2>";
if (function_exists('curl_version')) {
    $curl_info = curl_version();
    echo "<strong>cURL Version:</strong> " . $curl_info['version'] . "<br>";
    echo "<strong>SSL Support:</strong> " . ($curl_info['features'] & CURL_VERSION_SSL ? "✅ Yes" : "❌ No") . "<br>";
    echo "<strong>Protocols:</strong> " . implode(', ', $curl_info['protocols']) . "<br>";
} else {
    echo "❌ cURL function not available<br>";
}

// 3. Environment File Check
echo "<h2>3. Environment Configuration</h2>";
$env_path = dirname(__DIR__) . '/env.php';
echo "<strong>env.php Path:</strong> $env_path<br>";

if (file_exists($env_path)) {
    echo "<strong>env.php Status:</strong> ✅ File exists<br>";
    echo "<strong>File Permissions:</strong> " . substr(sprintf('%o', fileperms($env_path)), -4) . "<br>";
    
    try {
        $_ENV = include($env_path);
        $api_key = $_ENV['MANDRILL_API_KEY'] ?? '';
        $from_email = $_ENV['FROM_EMAIL'] ?? '';
        
        echo "<strong>API Key Loaded:</strong> " . ($api_key ? "✅ Yes (" . substr($api_key, 0, 8) . "...)" : "❌ Missing") . "<br>";
        echo "<strong>From Email:</strong> " . ($from_email ? "✅ $from_email" : "❌ Missing") . "<br>";
        
    } catch (Exception $e) {
        echo "<strong>env.php Error:</strong> ❌ " . $e->getMessage() . "<br>";
    }
} else {
    echo "<strong>env.php Status:</strong> ❌ File not found<br>";
}

// 4. Network Connectivity Test
echo "<h2>4. Network Connectivity Test</h2>";

if (function_exists('curl_init')) {
    // Test basic HTTPS connectivity
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://mandrillapp.com');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For testing only
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);
    
    if ($response !== false && $http_code == 200) {
        echo "<strong>Mandrill Connectivity:</strong> ✅ Can reach mandrillapp.com<br>";
    } else {
        echo "<strong>Mandrill Connectivity:</strong> ❌ Failed<br>";
        echo "<strong>HTTP Code:</strong> $http_code<br>";
        if ($curl_error) {
            echo "<strong>cURL Error:</strong> $curl_error<br>";
        }
    }
} else {
    echo "<strong>Network Test:</strong> ❌ cURL not available<br>";
}

// 5. Test Mandrill API Authentication
echo "<h2>5. Mandrill API Test</h2>";

if (isset($_ENV) && isset($_ENV['MANDRILL_API_KEY'])) {
    $api_key = $_ENV['MANDRILL_API_KEY'];
    
    // Test API key with ping endpoint
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://mandrillapp.com/api/1.0/users/ping');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['key' => $api_key]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);
    
    if ($response !== false && $http_code == 200) {
        $result = json_decode($response, true);
        if (isset($result) && $result === 'PONG!') {
            echo "<strong>API Authentication:</strong> ✅ Valid API key<br>";
        } else {
            echo "<strong>API Authentication:</strong> ❌ Invalid response: " . htmlspecialchars($response) . "<br>";
        }
    } else {
        echo "<strong>API Authentication:</strong> ❌ Failed<br>";
        echo "<strong>HTTP Code:</strong> $http_code<br>";
        if ($curl_error) {
            echo "<strong>cURL Error:</strong> $curl_error<br>";
        }
    }
} else {
    echo "<strong>API Test:</strong> ❌ No API key available<br>";
}

// 6. Email Sending Test Form
echo "<h2>6. Email Test</h2>";

if (isset($_POST['test_email'])) {
    $test_email = $_POST['test_email'];
    
    if (filter_var($test_email, FILTER_VALIDATE_EMAIL)) {
        echo "<strong>Testing email to:</strong> $test_email<br>";
        
        // Use the same logic as send-email.php
        try {
            if (!isset($_ENV)) {
                $_ENV = include($env_path);
            }
            
            $MANDRILL_API_KEY = $_ENV['MANDRILL_API_KEY'] ?? '';
            $FROM_EMAIL = $_ENV['FROM_EMAIL'] ?? '';
            $FROM_NAME = $_ENV['FROM_NAME'] ?? '';
            
            $message = [
                'from_email' => $FROM_EMAIL,
                'from_name' => $FROM_NAME,
                'subject' => '[TEST] Divine x Parimatch Email Test',
                'to' => [['email' => $test_email, 'type' => 'to']],
                'html' => "<h1>Test Email from Hostinger</h1><p>This is a test email sent from your Hostinger hosting to verify email functionality.</p><p>Time: " . date('Y-m-d H:i:s') . "</p>",
                'text' => "Test Email from Hostinger\n\nThis is a test email sent from your Hostinger hosting to verify email functionality.\n\nTime: " . date('Y-m-d H:i:s'),
                'tags' => ['hostinger-test']
            ];
            
            $payload = ['message' => $message];
            
            $ch = curl_init('https://mandrillapp.com/api/1.0/messages/send');
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'X-Mandrill-Key: ' . $MANDRILL_API_KEY
            ]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            
            $response = curl_exec($ch);
            $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curl_error = curl_error($ch);
            curl_close($ch);
            
            if ($response !== false && $http_code == 200) {
                $result = json_decode($response, true);
                if (isset($result[0]) && isset($result[0]['status'])) {
                    $status = $result[0]['status'];
                    if ($status === 'sent') {
                        echo "<strong>Email Test Result:</strong> ✅ Email sent successfully!<br>";
                        echo "<strong>Message ID:</strong> " . ($result[0]['_id'] ?? 'N/A') . "<br>";
                    } else {
                        echo "<strong>Email Test Result:</strong> ❌ Email rejected<br>";
                        echo "<strong>Status:</strong> $status<br>";
                        echo "<strong>Reason:</strong> " . ($result[0]['reject_reason'] ?? 'Unknown') . "<br>";
                    }
                } else {
                    echo "<strong>Email Test Result:</strong> ❌ Unexpected response format<br>";
                }
            } else {
                echo "<strong>Email Test Result:</strong> ❌ API call failed<br>";
                echo "<strong>HTTP Code:</strong> $http_code<br>";
                if ($curl_error) {
                    echo "<strong>cURL Error:</strong> $curl_error<br>";
                }
            }
            
        } catch (Exception $e) {
            echo "<strong>Email Test Result:</strong> ❌ Exception: " . $e->getMessage() . "<br>";
        }
    } else {
        echo "<strong>Email Test Result:</strong> ❌ Invalid email address<br>";
    }
}

?>

<form method="POST" style="margin-top: 20px; padding: 20px; border: 1px solid #ddd; background: #f9f9f9;">
    <h3>Test Email Sending</h3>
    <input type="email" name="test_email" placeholder="Enter your email address" required style="padding: 10px; width: 300px;">
    <button type="submit" style="padding: 10px 20px; background: #F8FF13; border: none; font-weight: bold;">Send Test Email</button>
</form>

<h2>7. Next Steps</h2>
<ul>
    <li>If any checks show ❌, contact Hostinger support to enable required features</li>
    <li>Check Hostinger cPanel → Error Logs for PHP errors</li>
    <li>Verify your domain's DNS settings for email delivery</li>
    <li>Test the actual send-email.php endpoint after resolving issues</li>
</ul>

<p><strong>Last Updated:</strong> <?= date('Y-m-d H:i:s') ?></p> 