# Debugging 500 Error in process-faceswap.php

## 🔍 **Step-by-Step Debugging Plan**

### **Step 1: Check if the file exists and is accessible**
```bash
curl "https://posewithdivine.com/api/process-faceswap.php"
```

**Expected Results:**
- **405 Method Not Allowed** = File exists, needs POST
- **404 Not Found** = File missing from server  
- **500 Internal Server Error** = File has fatal PHP error

### **Step 2: Check server error logs**
**On your hosting provider (Hostinger):**
1. Login to **cPanel/Control Panel**
2. Go to **Error Logs** or **File Manager**
3. Look for **error.log** files in:
   - `/public_html/api/error.log`
   - `/public_html/error.log`
   - Main error logs in cPanel

### **Step 3: Test minimal PHP script**
Create a very simple test file to see if PHP execution works:

```php
<?php
// Save as: public/api/test-simple.php
header('Content-Type: application/json');
echo json_encode(['status' => 'PHP working', 'time' => date('Y-m-d H:i:s')]);
?>
```

Test: `curl "https://posewithdivine.com/api/test-simple.php"`

### **Step 4: Test environment loading**
```php
<?php
// Save as: public/api/test-env.php
header('Content-Type: application/json');
try {
    $env = include('../env.php');
    echo json_encode([
        'status' => 'Environment test',
        'env_loaded' => !empty($env),
        'api_key_set' => !empty($env['SEGMIND_API_KEY']),
        'api_key' => substr($env['SEGMIND_API_KEY'] ?? '', 0, 10) . '...'
    ]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
```

### **Step 5: Check PHP configuration**
The test-connection.php showed:
- **Memory limit**: 256M (might be too low for image processing)
- **Max execution time**: 300s
- **Upload max**: 10M

## 🚨 **Most Likely Causes:**

### **1. Memory Exhaustion:**
Your images + processing might exceed 256M memory limit

### **2. Fatal PHP Error:**
- **Syntax error** in process-faceswap.php
- **Missing function** or class
- **Include file not found**

### **3. File Corruption:**
The process-faceswap.php file might be corrupted during deployment

### **4. PHP Extension Missing:**
- **GD extension** for image processing
- **cURL extension** for API calls

## 🛠️ **Immediate Actions:**

### **Action 1: Check Error Logs**
**Hostinger cPanel → Error Logs → Look for recent errors**

### **Action 2: Test Basic PHP**
```bash
curl "https://posewithdivine.com/api/process-faceswap.php"
```

### **Action 3: Increase Memory Limit**
Add to the top of process-faceswap.php:
```php
ini_set('memory_limit', '512M');
ini_set('max_execution_time', 600);
```

### **Action 4: Check File Integrity**
Compare your local process-faceswap.php with what's deployed on the server.

## 🎯 **Next Steps:**

1. **Run the basic curl test** above
2. **Check Hostinger error logs**
3. **Tell me what you find**

The 500 error with empty response = **PHP fatal error before any output**. The error logs will show exactly what's failing.