<?php
// Update HTML files to include API configuration for PHP endpoints

function updateHtmlFile($filePath) {
    if (!file_exists($filePath)) {
        echo "File not found: $filePath\n";
        return;
    }
    
    $content = file_get_contents($filePath);
    
    // Check if API config is already injected
    if (strpos($content, 'api-config.js') !== false) {
        echo "API config already injected in: $filePath\n";
        return;
    }
    
    // Find the </head> tag and inject our script before it
    $apiScript = '<script src="/js/api-config.js"></script>';
    $content = str_replace('</head>', $apiScript . '</head>', $content);
    
    // Also inject a script to override any existing API calls
    $overrideScript = '<script>
// Override API calls for Hostinger deployment
if (typeof window !== "undefined") {
    // Replace fetch calls to Next.js API routes with PHP endpoints
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        if (typeof url === "string" && url.includes("/api/process-faceswap")) {
            url = "/api/process-faceswap.php";
        }
        return originalFetch.call(this, url, options);
    };
}
</script>';
    
    $content = str_replace('</body>', $overrideScript . '</body>', $content);
    
    file_put_contents($filePath, $content);
    echo "Updated: $filePath\n";
}

// Find all HTML files and update them
function findAndUpdateHtmlFiles($dir) {
    $files = glob($dir . "/*.html");
    foreach ($files as $file) {
        updateHtmlFile($file);
    }
    
    // Recursively search subdirectories
    $subdirs = glob($dir . "/*", GLOB_ONLYDIR);
    foreach ($subdirs as $subdir) {
        // Skip certain directories
        if (basename($subdir) === 'api' || basename($subdir) === 'js') {
            continue;
        }
        findAndUpdateHtmlFiles($subdir);
    }
}

echo "Updating HTML files with API configuration...\n";
findAndUpdateHtmlFiles('./');
echo "HTML files updated successfully!\n";
?> 