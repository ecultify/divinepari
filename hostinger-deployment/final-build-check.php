<?php
// Final Build Check - Verify API Key Before Upload

echo "🔍 Final Build Check for Hostinger Deployment\n";
echo "==============================================\n\n";

// Test 1: Check if env.php exists
if (!file_exists('env.php')) {
    echo "❌ ERROR: env.php file not found!\n";
    exit(1);
}

// Test 2: Load configuration
try {
    require_once 'config.php';
    echo "✅ Configuration loaded successfully\n";
} catch (Exception $e) {
    echo "❌ ERROR: Failed to load config.php: " . $e->getMessage() . "\n";
    exit(1);
}

// Test 3: Check API key
$apiKey = $_ENV['SEGMIND_API_KEY'] ?? 'NOT_SET';

if ($apiKey === 'NOT_SET') {
    echo "❌ ERROR: API key not found in environment!\n";
    exit(1);
}

if ($apiKey === 'YOUR_SEGMIND_API_KEY_HERE') {
    echo "❌ ERROR: API key not set! You must edit env.php first.\n";
    echo "\n🔧 TO FIX:\n";
    echo "1. Edit env.php file\n";
    echo "2. Replace 'YOUR_SEGMIND_API_KEY_HERE' with your actual Segmind API key\n";
    echo "3. Run this script again\n\n";
    exit(1);
}

if (strlen($apiKey) < 10) {
    echo "❌ ERROR: API key seems too short. Please check your Segmind API key.\n";
    exit(1);
}

echo "✅ API key is set correctly: " . substr($apiKey, 0, 10) . "...\n";

// Test 4: Check required files
$requiredFiles = [
    'index.html',
    'config.php', 
    'env.php',
    '.htaccess',
    'api/process-faceswap.php',
    'api/debug-faceswap.php',
    'test-api.html'
];

echo "\n📁 Checking required files:\n";
$allFilesExist = true;

foreach ($requiredFiles as $file) {
    if (file_exists($file)) {
        echo "✅ $file\n";
    } else {
        echo "❌ $file (MISSING)\n";
        $allFilesExist = false;
    }
}

if (!$allFilesExist) {
    echo "\n❌ Some required files are missing!\n";
    exit(1);
}

// Test 5: Check PHP extensions
echo "\n🔧 Checking PHP environment:\n";
$requiredExtensions = ['gd', 'curl', 'json'];

foreach ($requiredExtensions as $ext) {
    if (extension_loaded($ext)) {
        echo "✅ $ext extension loaded\n";
    } else {
        echo "❌ $ext extension missing\n";
    }
}

// Final summary
echo "\n🎉 BUILD CHECK COMPLETE!\n";
echo "========================\n";
echo "✅ API key is properly configured\n";
echo "✅ All required files are present\n";
echo "✅ Configuration is working\n\n";

echo "📦 Ready for Hostinger upload:\n";
echo "1. Compress this entire 'hostinger-deployment' folder\n";
echo "2. Upload to Hostinger public_html\n";
echo "3. Extract the files\n";
echo "4. Test your website\n\n";

echo "🧪 After upload, test these URLs:\n";
echo "- https://yourdomain.com/ (main site)\n";
echo "- https://yourdomain.com/api/debug-faceswap.php (API test)\n";
echo "- https://yourdomain.com/test-api.html (debug page)\n\n";

echo "🚀 Your Divine X PariMatch app is ready for deployment!\n";

?> 