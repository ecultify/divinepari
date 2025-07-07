# Hostinger Deployment Guide - Divine x Parimatch

This guide explains how to properly deploy the Divine x Parimatch app to Hostinger with email functionality.

## 🚨 IMPORTANT: Environment Variables Security

**NEVER put API keys in the public folder!** This would expose them to anyone visiting your website.

## ✅ Correct Deployment Steps for Hostinger

### 1. Build the Application Locally

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

### 2. Create Environment File on Server

**On your Hostinger server**, create a file called `.env.local` in your application root:

```bash
# SSH into your Hostinger server or use File Manager
# Create .env.local file with:

MANDRILL_API_KEY=md-uHR1LFMjBFB7Yn6aBnl7uA
```

### 3. Upload Files to Hostinger

Upload these folders/files to your Hostinger hosting:

```
your-domain/
├── .next/                 # Built application
├── public/               # Static assets
├── package.json          # Dependencies
├── next.config.ts        # Next.js configuration
├── .env.local           # Environment variables (CREATE ON SERVER)
└── node_modules/        # Dependencies (or run npm install on server)
```

### 4. Hostinger-Specific Setup

#### Option A: Using Hostinger's Node.js Hosting

1. **Enable Node.js** in your Hostinger control panel
2. **Set Node.js version** to 18 or higher
3. **Upload your files** to the public_html directory
4. **Create .env.local** file via File Manager:
   ```
   MANDRILL_API_KEY=md-uHR1LFMjBFB7Yn6aBnl7uA
   ```
5. **Install dependencies** via SSH or terminal:
   ```bash
   npm install --production
   ```
6. **Start the application**:
   ```bash
   npm start
   ```

#### Option B: Using Static Export (if API routes not supported)

If Hostinger doesn't support Node.js API routes, you'll need to modify the approach:

1. **Update next.config.ts**:
   ```typescript
   const nextConfig: NextConfig = {
     output: 'export',
     trailingSlash: true,
     images: {
       unoptimized: true
     }
   };
   ```

2. **Create external email service** (PHP script):
   ```php
   <?php
   // email-handler.php
   header('Content-Type: application/json');
   header('Access-Control-Allow-Origin: *');
   header('Access-Control-Allow-Methods: POST');
   header('Access-Control-Allow-Headers: Content-Type');

   if ($_SERVER['REQUEST_METHOD'] === 'POST') {
       $input = json_decode(file_get_contents('php://input'), true);
       
       $to = $input['to'];
       $userName = $input['userName'] ?? 'there';
       $posterUrl = $input['posterUrl'] ?? '';
       
       // Use Mandrill API via cURL
       $apiKey = 'md-uHR1LFMjBFB7Yn6aBnl7uA';
       
       // Email sending logic here
       // (PHP implementation of Mandrill API)
       
       echo json_encode(['success' => true]);
   }
   ?>
   ```

### 5. File Structure on Hostinger

```
public_html/
├── _next/                # Next.js build files
├── images/              # Your image assets
├── test-email.html      # Email testing page
├── .env.local          # Environment variables (SECURE)
├── index.html          # Main app entry
└── api/                # If using Node.js hosting
    ├── send-email/
    └── test-email/
```

### 6. Environment Variables Setup

Create `.env.local` on your Hostinger server:

```bash
# Method 1: Via SSH
echo "MANDRILL_API_KEY=md-uHR1LFMjBFB7Yn6aBnl7uA" > .env.local

# Method 2: Via File Manager
# Create new file named .env.local
# Add content: MANDRILL_API_KEY=md-uHR1LFMjBFB7Yn6aBnl7uA
```

### 7. Testing on Hostinger

1. **Visit your domain**: `https://yourdomain.com`
2. **Test email functionality**: `https://yourdomain.com/test-email.html`
3. **Check API endpoints**: `https://yourdomain.com/api/test-email`

## 🔧 Troubleshooting

### Common Hostinger Issues

1. **API routes not working:**
   - Check if Hostinger supports Node.js
   - Verify Node.js is enabled in control panel
   - Use PHP alternative if needed

2. **Environment variables not loading:**
   - Ensure `.env.local` is in the correct directory
   - Check file permissions (644)
   - Verify file encoding (UTF-8)

3. **Email not sending:**
   - Check server logs
   - Verify Mandrill API key is correct
   - Test with curl:
     ```bash
     curl -X POST https://yourdomain.com/api/test-email \
       -H "Content-Type: application/json" \
       -d '{"email":"test@example.com"}'
     ```

### Alternative: PHP Email Handler

If Node.js isn't available, create `email-handler.php`:

```php
<?php
require_once 'vendor/autoload.php'; // If using Composer

use MailchimpTransactional\ApiClient;

$apiKey = 'md-uHR1LFMjBFB7Yn6aBnl7uA';
$mailchimp = new ApiClient();
$mailchimp->setApiKey($apiKey);

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $message = [
        'from_email' => 'support@posewithdivine.com',
        'subject' => 'Your Divine Poster is Ready! 🎤✨',
        'to' => [['email' => $input['to']]],
        'html' => generateEmailHTML($input['userName'], $input['posterUrl'])
    ];
    
    try {
        $response = $mailchimp->messages->send(['message' => $message]);
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function generateEmailHTML($userName, $posterUrl) {
    // Return the same HTML template from sendEmail.ts
    return "<!-- Your email HTML template here -->";
}
?>
```

## 🚀 Final Checklist

- [ ] Built application locally (`npm run build`)
- [ ] Uploaded build files to Hostinger
- [ ] Created `.env.local` on server (NOT in public folder)
- [ ] Installed dependencies on server
- [ ] Tested email functionality
- [ ] Verified API endpoints work
- [ ] Tested poster generation flow
- [ ] Confirmed emails are being sent

## 📞 Support

If you encounter issues:

1. **Check Hostinger documentation** for Node.js support
2. **Use PHP alternative** if Node.js isn't available
3. **Test API endpoints** individually
4. **Check server logs** for error messages
5. **Verify environment variables** are loaded correctly

Remember: **NEVER put API keys in public folders or client-side code!** 