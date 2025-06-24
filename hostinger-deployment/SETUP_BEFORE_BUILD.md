# 🔧 SETUP BEFORE BUILDING - IMPORTANT!

## ⚠️ **CRITICAL: You MUST do this BEFORE uploading to Hostinger**

### **Step 1: Set Your API Key**

**EDIT the `env.php` file RIGHT NOW** and replace:

```php
$_ENV['SEGMIND_API_KEY'] = 'YOUR_SEGMIND_API_KEY_HERE';
```

**With your actual Segmind API key:**

```php
$_ENV['SEGMIND_API_KEY'] = 'sk-your-actual-api-key-from-segmind-dashboard';
```

### **Step 2: Verify the Setup**

Run this command to check if your API key is set:

```bash
php -r "require 'env.php'; echo 'API Key: ' . substr(\$_ENV['SEGMIND_API_KEY'], 0, 10) . '...' . PHP_EOL;"
```

You should see something like:
```
API Key: sk-abc123...
```

**NOT:**
```
API Key: YOUR_SEGMI...
```

### **Step 3: Build and Upload**

Only AFTER setting the API key:

1. **Compress the entire `hostinger-deployment` folder**
2. **Upload to Hostinger public_html**
3. **Extract the files**
4. **Test your website**

## 🚨 **Why This Matters**

- The `env.php` file is loaded by `config.php`
- This happens on the server when the PHP API runs
- If you don't set the API key BEFORE uploading, you'll get the 500 error
- The debug will show `"api_key_set": false`

## ✅ **File Structure After Upload**

Your Hostinger `public_html` should look like:

```
public_html/
├── env.php          ← Contains your ACTUAL API key
├── config.php       ← Loads env.php  
├── api/
│   └── process-faceswap.php ← Uses config.php
├── index.html
├── images/
└── ... (other files)
```

## 🧪 **Test Commands**

After setting API key, test locally:

```bash
# Check API key is set
php -r "require 'config.php'; echo \$_ENV['SEGMIND_API_KEY'] ? 'API KEY SET!' : 'API KEY MISSING!';"

# Run build checker  
php build-for-hostinger.php
```

**DO NOT SKIP STEP 1!** Set the API key in `env.php` before uploading! 🎯 