# Hostinger Deployment Guide

## 📁 Project Structure
Your deployment package is now ready! Here's what's included:

```
hostinger-deployment/
├── index.html                  # Main landing page
├── 404.html                   # Error page
├── favicon.ico                 # Site icon
├── config.php                 # Environment configuration
├── api/
│   └── process-faceswap.php   # PHP face swap API
├── js/
│   └── api-config.js          # Frontend API configuration
├── images/                    # All images and assets
│   ├── posters/              # Poster templates
│   ├── landing/              # Landing page images
│   ├── icons/                # UI icons
│   └── mobile/               # Mobile-specific images
├── generate/                  # App pages
│   ├── index.html
│   ├── gender/index.html
│   ├── poster/index.html
│   ├── upload/index.html
│   └── result/index.html
└── _next/                     # Next.js static assets
    └── static/               # CSS, JS, and font files
```

## 🚀 Deployment Steps

### Step 1: Prepare Your Hostinger Account
1. Log in to your Hostinger control panel (hPanel)
2. Navigate to your hosting plan
3. Access the **File Manager**

### Step 2: Upload Files
1. In Hostinger File Manager, navigate to the `public_html` directory
2. **Delete any existing files** in public_html (backup first if needed)
3. **Upload all files** from the `hostinger-deployment` folder to `public_html`
   - You can compress the entire `hostinger-deployment` folder into a ZIP file
   - Upload the ZIP file via File Manager
   - Extract it directly in `public_html`

### Step 3: Configure Environment Variables
1. Open `config.php` in the File Manager text editor
2. Replace `YOUR_SEGMIND_API_KEY_HERE` with your actual Segmind API key:
   ```php
   $_ENV['SEGMIND_API_KEY'] = 'your_actual_api_key_here';
   ```
3. Save the file

### Step 4: Set PHP Configuration (if needed)
Create a `.htaccess` file in your `public_html` root with these settings:
```apache
# Increase PHP limits for image processing
php_value max_execution_time 300
php_value memory_limit 256M
php_value upload_max_filesize 10M
php_value post_max_size 10M

# Enable error reporting (remove in production)
php_flag display_errors on
php_value error_reporting E_ALL

# Pretty URLs for single page app
RewriteEngine On
RewriteBase /

# Handle client-side routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} ^/generate
RewriteRule ^generate/(.*)$ /generate/index.html [L]

# API routes
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ /api/$1 [L]
```

### Step 5: Test Your Deployment
1. Visit your domain (e.g., `https://yourdomain.com`)
2. Test the complete flow:
   - Navigate through the app pages
   - Upload an image and generate a poster
   - Verify the face swap functionality works

## 🔧 Troubleshooting

### Common Issues:

1. **500 Internal Server Error**
   - Check PHP error logs in hPanel
   - Verify `config.php` has correct API key
   - Ensure GD and cURL extensions are enabled

2. **API Not Found (404)**
   - Verify `.htaccess` file is uploaded
   - Check file permissions (755 for directories, 644 for files)

3. **Face Swap Fails**
   - Verify Segmind API key is correct
   - Check PHP memory and execution time limits
   - Review error logs for specific errors

4. **Images Not Loading**
   - Check file paths are correct
   - Verify all image files were uploaded
   - Ensure proper file permissions

### PHP Requirements:
- PHP 7.4 or higher
- GD extension (for image processing)
- cURL extension (for API calls)
- Memory limit: 256MB or higher
- Max execution time: 300 seconds or higher

## 📊 Performance Notes

- The PHP implementation processes images server-side
- Face swap operations take 45-90 seconds typically
- Hostinger's PHP hosting should handle the processing well
- Consider upgrading to a higher plan if you experience timeouts

## 🔒 Security Considerations

1. **Protect config.php**: Ensure it's not accessible via web browser
2. **API Key Security**: Never expose your Segmind API key in client-side code
3. **File Upload Validation**: The PHP script validates uploaded images
4. **Error Handling**: Errors are logged but not exposed to users

## 📱 Features Included

✅ **Static Website**: Fast loading with Next.js static export  
✅ **PHP API**: Server-side face swap processing  
✅ **Image Processing**: Smart poster side detection  
✅ **Mobile Responsive**: Works on all devices  
✅ **Error Handling**: Proper error messages and logging  
✅ **Security**: Protected API endpoints and validation  

## 🎯 What's Different from Netlify Version

- **No serverless functions**: Uses traditional PHP instead
- **No timeout limits**: PHP can run for 5+ minutes if needed
- **Server-side processing**: All image processing happens on server
- **Traditional hosting**: Works with any PHP hosting provider

## 📞 Support

If you encounter issues:
1. Check Hostinger's knowledge base
2. Review PHP error logs in hPanel
3. Verify all files were uploaded correctly
4. Test the Segmind API key separately

Your Divine X PariMatch app is now ready for Hostinger deployment! 🚀 