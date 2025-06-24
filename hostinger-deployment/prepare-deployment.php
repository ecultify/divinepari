<?php
// Hostinger Deployment Preparation Script
// This script copies all necessary files to the hostinger-deployment folder

echo "Preparing Hostinger deployment package...\n";

// Create directory structure
$dirs = [
    'api',
    'images',
    'images/posters',
    'images/icons', 
    'images/landing',
    'images/landing/backgrounds',
    'images/landing/normalimages',
    'images/mobile',
    'images/secondpage',
    'images/uploadpage',
    '_next',
    '_next/static'
];

foreach ($dirs as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
        echo "Created directory: $dir\n";
    }
}

// Copy static export files from out directory
function copyDirectory($src, $dst) {
    if (!is_dir($src)) {
        echo "Source directory not found: $src\n";
        return;
    }
    
    if (!is_dir($dst)) {
        mkdir($dst, 0755, true);
    }
    
    $dir = opendir($src);
    while (($file = readdir($dir)) !== false) {
        if ($file == '.' || $file == '..') continue;
        
        $srcPath = $src . '/' . $file;
        $dstPath = $dst . '/' . $file;
        
        if (is_dir($srcPath)) {
            copyDirectory($srcPath, $dstPath);
        } else {
            copy($srcPath, $dstPath);
            echo "Copied: $file\n";
        }
    }
    closedir($dir);
}

// Copy the Next.js static export
echo "\nCopying static files from Next.js export...\n";
copyDirectory('../out', './');

// Copy images directory
echo "\nCopying images...\n";
copyDirectory('../public/images', './images');

// Copy other public assets
$publicFiles = ['favicon.ico', 'next.svg', 'vercel.svg', 'window.svg', 'file.svg', 'globe.svg'];
foreach ($publicFiles as $file) {
    if (file_exists("../public/$file")) {
        copy("../public/$file", "./$file");
        echo "Copied public file: $file\n";
    }
}

echo "\nDeployment package prepared successfully!\n";
echo "\nNext steps:\n";
echo "1. Update config.php with your Segmind API key\n";
echo "2. Upload all files to your Hostinger public_html directory\n";
echo "3. Update the API URLs in your frontend code to point to the PHP endpoints\n";
echo "\nAPI endpoint will be: https://yourdomain.com/api/process-faceswap.php\n";
?> 