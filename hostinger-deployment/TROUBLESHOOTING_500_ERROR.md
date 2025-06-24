# 🚨 Troubleshooting 500 Internal Server Error

The 500 error you're seeing indicates a server-side PHP issue. Let's debug this step by step.

## 🔍 Step 1: Run the Debug Script

1. **Upload the debug files** to your Hostinger account:
   - `api/debug-faceswap.php`
   - `api/process-faceswap-debug.php`

2. **Test the debug script** by visiting:
   ```
   https://yourdomain.com/api/debug-faceswap.php
   ```

This will show you exactly what's wrong with your PHP configuration.

## 🛠️ Step 2: Common Issues & Fixes

### Issue 1: API Key Not Set
**Symptoms**: Debug shows `api_key_set: false`

**Fix**: Edit `config.php` in Hostinger File Manager:
```php
$_ENV['SEGMIND_API_KEY'] = 'your_actual_segmind_api_key_here';
```

### Issue 2: Missing PHP Extensions
**Symptoms**: Debug shows `extension_gd: FAIL` or `extension_curl: FAIL`

**Fix**: Contact Hostinger support to enable these extensions, or check if they're available in your hosting plan.

### Issue 3: Memory/Time Limits Too Low
**Symptoms**: Debug shows low memory_limit or max_execution_time

**Fix**: Update your `.htaccess` file (should already be included):
```apache
php_value memory_limit 256M
php_value max_execution_time 300
```

### Issue 4: File Permissions
**Symptoms**: Debug shows files not readable

**Fix**: In Hostinger File Manager, set permissions:
- Directories: 755
- Files: 644

### Issue 5: Path Issues
**Symptoms**: Config file fails to load

**Fix**: Verify the file structure in Hostinger matches:
```
public_html/
├── config.php
├── api/
│   └── process-faceswap.php
```

## 🧪 Step 3: Test with Debug Version

1. **Temporarily modify** the API call in your frontend to use the debug version:
   - Change `/api/process-faceswap.php` to `/api/process-faceswap-debug.php`

2. **Try the face swap again** and check the browser console for detailed error messages.

## 🔧 Step 4: Check Hostinger Error Logs

1. **In Hostinger hPanel**:
   - Go to **Advanced** → **Error Logs**
   - Look for recent PHP errors
   - Note the exact error message and line number

## 🚀 Step 5: Quick Fixes to Try

### Fix 1: Simplified .htaccess
If you're still having issues, try this minimal `.htaccess`:

```apache
# Basic PHP settings
php_value memory_limit 256M
php_value max_execution_time 300
php_value upload_max_filesize 10M
php_value post_max_size 10M

RewriteEngine On
RewriteBase /
```

### Fix 2: Check File Upload Settings
Add this to your `.htaccess`:

```apache
php_value file_uploads On
php_value upload_tmp_dir /tmp
```

### Fix 3: Alternative Config Loading
If `config.php` loading fails, try this in `process-faceswap.php`:

```php
// Alternative config loading
if (file_exists('../config.php')) {
    include '../config.php';
} elseif (file_exists('config.php')) {
    include 'config.php';
} else {
    // Hardcode API key temporarily for testing
    $_ENV['SEGMIND_API_KEY'] = 'your_api_key_here';
}
```

## 📞 Most Likely Issues on Hostinger

1. **GD Extension Missing**: Some Hostinger plans don't include GD by default
2. **cURL Restrictions**: Some shared hosting plans restrict external API calls
3. **Memory Limits**: Default PHP memory might be too low for image processing
4. **File Path Issues**: Relative paths might not work as expected

## ✅ Next Steps

1. **Run the debug script first** - this will tell you exactly what's wrong
2. **Share the debug output** - send me the JSON response from the debug script
3. **Check error logs** - look for specific PHP errors in Hostinger hPanel
4. **Try the debug version** - use `process-faceswap-debug.php` temporarily

Once you run the debug script, I can provide targeted fixes based on the specific issues found!

## 🔄 After Fixing

1. **Test with debug version first**
2. **Switch back to main API** once it works
3. **Remove debug files** for security

The debug tools will help us identify the exact cause of the 500 error quickly! 🚀 