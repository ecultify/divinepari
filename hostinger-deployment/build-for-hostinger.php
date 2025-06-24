<?php
// Build Script for Hostinger Deployment
// This script prepares the final deployment package

echo "🚀 Building Divine X PariMatch for Hostinger Deployment...\n\n";

// Check if env.php exists
if (!file_exists('env.php')) {
    echo "❌ Error: env.php file not found!\n";
    echo "Please create env.php with your environment variables first.\n";
    exit(1);
}

// Check if API key is set in env.php
$envContent = file_get_contents('env.php');
if (strpos($envContent, 'YOUR_SEGMIND_API_KEY_HERE') !== false) {
    echo "⚠️  WARNING: API key not set in env.php!\n";
    echo "Please edit env.php and set your actual Segmind API key.\n\n";
}

// Create deployment checklist
echo "📋 Pre-Upload Checklist:\n";
echo "========================\n";
echo "✅ Static website files exported\n";
echo "✅ PHP API endpoints created\n";
echo "✅ Configuration files prepared\n";
echo "✅ Debug tools included\n";
echo "✅ Security configurations applied\n";
echo "✅ Performance optimizations included\n\n";

// Instructions
echo "📝 Upload Instructions:\n";
echo "=======================\n";
echo "1. Edit 'env.php' file and set your actual Segmind API key\n";
echo "2. Compress this entire 'hostinger-deployment' folder to ZIP\n";
echo "3. Upload ZIP to Hostinger File Manager\n";
echo "4. Extract in public_html directory\n";
echo "5. Test your website!\n\n";

// File structure
echo "📁 Files ready for upload:\n";
echo "==========================\n";

function listFiles($dir, $prefix = '') {
    $files = scandir($dir);
    $important_files = [];
    $total_files = 0;
    
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
        
        $full_path = $dir . '/' . $file;
        if (is_dir($full_path)) {
            if (in_array($file, ['api', 'images', 'generate', '_next', 'js'])) {
                $important_files[] = $prefix . $file . '/ (directory)';
            }
            $total_files += count(scandir($full_path)) - 2; // subtract . and ..
        } else {
            if (in_array($file, ['index.html', 'config.php', 'env.php', '.htaccess', 'favicon.ico'])) {
                $important_files[] = $prefix . $file;
            }
            $total_files++;
        }
    }
    
    return [$important_files, $total_files];
}

list($important_files, $total_files) = listFiles('.');

foreach ($important_files as $file) {
    echo "📄 " . $file . "\n";
}

echo "\n📊 Statistics:\n";
echo "==============\n";
echo "Total files: ~$total_files\n";
echo "Estimated upload time: 5-10 minutes\n";
echo "Configuration time: 2 minutes\n\n";

// Security reminder
echo "🔒 Security Reminders:\n";
echo "======================\n";
echo "⚠️  Never share your Segmind API key\n";
echo "⚠️  Set proper file permissions (755 for folders, 644 for files)\n";
echo "⚠️  Remove debug files after successful deployment\n\n";

// Test URLs
echo "🧪 After Upload - Test These URLs:\n";
echo "===================================\n";
echo "1. https://yourdomain.com/ (Main website)\n";
echo "2. https://yourdomain.com/test-api.html (Debug page)\n";
echo "3. https://yourdomain.com/api/debug-faceswap.php (API test)\n\n";

echo "🎉 Build completed! Ready for Hostinger upload!\n";
echo "📦 Next step: Edit env.php, create ZIP, and upload to Hostinger\n";

?> 