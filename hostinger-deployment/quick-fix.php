<?php
// Quick Fix: Direct API Key Configuration
// Use this if env.php isn't working properly

// REPLACE WITH YOUR ACTUAL API KEY
$SEGMIND_API_KEY = 'YOUR_SEGMIND_API_KEY_HERE';

// Update config.php to use direct API key
$configPath = __DIR__ . '/config.php';
$configContent = '<?php
// Environment Configuration for Hostinger Deployment
// Quick fix - direct API key configuration

// Segmind API Key - REPLACE WITH YOUR ACTUAL KEY
$_ENV[\'SEGMIND_API_KEY\'] = \'' . $SEGMIND_API_KEY . '\';

// Optional: Database configuration if you want to track usage
// $db_host = \'localhost\';
// $db_username = \'your_db_username\';
// $db_password = \'your_db_password\';
// $db_name = \'your_db_name\';

// Load environment variables
function loadEnvironment() {
    // You can add any additional environment setup here
    error_reporting(E_ALL);
    ini_set(\'display_errors\', 1);
    
    // Set maximum execution time for image processing
    set_time_limit(300); // 5 minutes
    
    // Increase memory limit for image processing
    ini_set(\'memory_limit\', \'256M\');
    
    return true;
}

// Initialize environment
loadEnvironment();

return true;
?>';

if (file_put_contents($configPath, $configContent)) {
    echo "✅ config.php updated successfully!\n";
    echo "🔑 API Key set to: " . substr($SEGMIND_API_KEY, 0, 10) . "...\n";
    echo "🧪 Now test your face swap API\n";
} else {
    echo "❌ Failed to update config.php\n";
    echo "Please manually edit config.php and set the API key\n";
}

// Test API key
if ($SEGMIND_API_KEY === 'YOUR_SEGMIND_API_KEY_HERE') {
    echo "\n⚠️  WARNING: You need to edit this file and set your actual API key first!\n";
} else {
    echo "\n✅ API key appears to be set correctly\n";
}

echo "\n📝 Next steps:\n";
echo "1. Edit this file and set your actual Segmind API key\n";
echo "2. Run this script: php quick-fix.php\n";
echo "3. Test your website\n";

?> 