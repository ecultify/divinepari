<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load environment variables from env.php
require_once __DIR__ . '/env.php';

// Get API key from environment variables
$SEGMIND_API_KEY = $_ENV['SEGMIND_API_KEY'] ?? '';

if (empty($SEGMIND_API_KEY)) {
    die("Error: SEGMIND_API_KEY not found in environment variables");
}

echo "<h1>Testing Segmind FaceSwap v4 API</h1>";
echo "<p>API Key found: " . (empty($SEGMIND_API_KEY) ? "No" : "Yes") . "</p>";

// Function to convert an image file to base64
function imageFileToBase64($imagePath) {
    if (!file_exists($imagePath)) {
        die("Error: Image file not found at $imagePath");
    }
    $imageData = file_get_contents($imagePath);
    return base64_encode($imageData);
}

// Function to download an image from URL and convert to base64
function imageUrlToBase64($imageUrl) {
    $imageData = file_get_contents($imageUrl);
    if ($imageData === false) {
        die("Error: Failed to download image from $imageUrl");
    }
    return base64_encode($imageData);
}

// Test with sample images from URLs or local files
try {
    // You can use either URL or local file
    // For testing with local files:
    $sourceImagePath = __DIR__ . '/images/posters/Option1M.avif'; // Changed path to be relative to public
    $targetImagePath = __DIR__ . '/images/posters/Option2M.avif'; // Changed path to be relative to public
    
    echo "<p>Using source image: $sourceImagePath</p>";
    echo "<p>Using target image: $targetImagePath</p>";
    
    $sourceImageBase64 = imageFileToBase64($sourceImagePath);
    $targetImageBase64 = imageFileToBase64($targetImagePath);
    
    // Alternatively, use URLs (uncomment to use)
    /*
    $sourceImageUrl = "https://segmind-resources.s3.amazonaws.com/input/b872c581-a20a-4fda-98aa-b78d2e221ccb-v4-source-img.jpg";
    $targetImageUrl = "https://segmind-resources.s3.amazonaws.com/output/7401f2ea-5652-4f2a-93d9-a587f1ccb62f-fs-v4-target.png";
    
    echo "<p>Using source image URL: $sourceImageUrl</p>";
    echo "<p>Using target image URL: $targetImageUrl</p>";
    
    $sourceImageBase64 = imageUrlToBase64($sourceImageUrl);
    $targetImageBase64 = imageUrlToBase64($targetImageUrl);
    */
    
    // Prepare API request data
    $apiData = [
        'source_image' => $sourceImageBase64,
        'target_image' => $targetImageBase64,
        'model_type' => 'quality', // 'quality' or 'speed'
        'swap_type' => 'head',
        'style_type' => 'normal',
        'seed' => rand(1, 1000000),
        'image_format' => 'png',
        'image_quality' => 95,
        'hardware' => 'fast',
        'base64' => true
    ];
    
    echo "<p>Sending request to Segmind API...</p>";
    
    // Initialize cURL session
    $ch = curl_init('https://api.segmind.com/v1/faceswap-v4');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($apiData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'x-api-key: ' . $SEGMIND_API_KEY,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 120); // 2 minute timeout
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Disable SSL verification for testing
    
    // Execute cURL request
    $startTime = microtime(true);
    $response = curl_exec($ch);
    $endTime = microtime(true);
    $executionTime = round($endTime - $startTime, 2);
    
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    echo "<p>API Response Status: $httpCode</p>";
    echo "<p>Execution Time: $executionTime seconds</p>";
    
    if (!empty($curlError)) {
        echo "<p>cURL Error: $curlError</p>";
    }
    
    if ($httpCode !== 200) {
        echo "<p>API Error: Non-200 status code received</p>";
        echo "<pre>" . htmlspecialchars($response) . "</pre>";
    } else {
        $responseData = json_decode($response, true);
        
        if (!$responseData || !isset($responseData['image'])) {
            echo "<p>Error: Invalid API response format</p>";
            echo "<pre>" . htmlspecialchars(substr($response, 0, 1000)) . "...</pre>";
        } else {
            echo "<p>Success! Image received from API</p>";
            echo "<img src='data:image/png;base64," . $responseData['image'] . "' style='max-width: 500px;'>";
            
            // Save the image to a file (optional)
            $outputDir = __DIR__ . '/temp';
            if (!is_dir($outputDir)) {
                mkdir($outputDir, 0755, true);
            }
            
            $outputFile = $outputDir . '/segmind_test_' . time() . '.png';
            file_put_contents($outputFile, base64_decode($responseData['image']));
            echo "<p>Image saved to: $outputFile</p>";
        }
    }
    
} catch (Exception $e) {
    echo "<h2>Error</h2>";
    echo "<p>" . $e->getMessage() . "</p>";
}
?> 