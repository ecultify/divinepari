# 🚀 Hostinger Deployment Instructions

## Step 1: Set Your API Key

**BEFORE uploading**, edit the `env.php` file:

```php
// Change this line:
$_ENV['SEGMIND_API_KEY'] = 'YOUR_SEGMIND_API_KEY_HERE';

// To your actual API key:
$_ENV['SEGMIND_API_KEY'] = 'your_actual_segmind_api_key';
```

## Step 2: Create ZIP File

1. Select all files in the `hostinger-deployment` folder
2. Create a ZIP file (e.g., `divine-parimatch.zip`)
3. **Include all files and folders**

## Step 3: Upload to Hostinger

1. Log in to Hostinger hPanel
2. Go to **File Manager**
3. Navigate to `public_html`
4. **Delete existing files** (backup first if needed)
5. Upload your ZIP file
6. **Extract** the ZIP file in `public_html`

## Step 4: Test Your Website

Visit these URLs to test:

1. **Main Site**: `https://yourdomain.com/`
2. **Debug Page**: `https://yourdomain.com/test-api.html`
3. **API Test**: `https://yourdomain.com/api/debug-faceswap.php`

## 📁 What's Included

✅ **Complete Website** - All HTML, CSS, JS files  
✅ **PHP API** - Face swap functionality  
✅ **Environment Config** - Easy API key setup  
✅ **Debug Tools** - For troubleshooting  
✅ **Security Setup** - Protected config files  
✅ **Performance** - Optimized for fast loading  

## 🔧 If Something Goes Wrong

1. **Check API Key**: Make sure it's set correctly in `env.php`
2. **Check File Permissions**: 755 for folders, 644 for files
3. **Use Debug Tools**: Visit `/test-api.html` for detailed testing
4. **Check Error Logs**: In Hostinger hPanel → Advanced → Error Logs

## ⚡ Quick Start Commands

```bash
# Run the build checker
php build-for-hostinger.php

# Create ZIP file (optional)
zip -r divine-parimatch.zip .
```

## 🎯 Expected Results

- **Fast loading** static website
- **Working face swap** in 45-90 seconds
- **Mobile responsive** design
- **All browsers** supported

That's it! Your Divine X PariMatch app will be live on Hostinger! 🎉 