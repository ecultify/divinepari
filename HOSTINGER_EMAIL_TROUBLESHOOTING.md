# 🔧 Hostinger Email Troubleshooting Guide

## Issue: Emails Not Being Sent After Poster Generation

### Quick Diagnosis Steps

1. **Check Environment File**
   - Create `.env.local` file in your app root directory
   - Add: `MANDRILL_API_KEY=md-uHR1LFMjBFB7Yn6aBnl7uA`
   - **Important**: This file must be on the server, not just locally

2. **Test Email System**
   - Visit: `https://yourdomain.com/debug-email.html`
   - Run all 4 tests to identify the issue
   - Check both Node.js and PHP APIs

3. **Check Browser Console**
   - Open browser dev tools (F12)
   - Go to Console tab
   - Look for email-related errors

---

## Most Common Issues & Solutions

### 1. Missing Environment File
**Symptoms**: Email sending fails silently
**Solution**: 
```bash
# Create .env.local in your app root
echo "MANDRILL_API_KEY=md-uHR1LFMjBFB7Yn6aBnl7uA" > .env.local
```

### 2. User Data Not Saved
**Symptoms**: Console shows "No email found in localStorage"
**Solution**: Check if user enters email on generate page
- Go to `/generate` page
- Ensure email input is working
- Check browser localStorage in dev tools

### 3. API Route Not Working
**Symptoms**: 404 errors or API failures
**Solution**: 
- Test `/api/send-email` endpoint directly
- If Node.js fails, use PHP fallback at `/api/send-email.php`
- Check server logs for detailed errors

### 4. Mandrill API Issues
**Symptoms**: API connection errors
**Solution**:
- Verify API key is correct: `md-uHR1LFMjBFB7Yn6aBnl7uA`
- Check Mandrill service status
- Ensure sender domain `support@posewithdivine.com` is configured

---

## Step-by-Step Debugging Process

### Step 1: Check Environment
```bash
# On your server, verify .env.local exists
ls -la .env.local
cat .env.local
```

### Step 2: Test API Endpoints
```bash
# Test Node.js API
curl -X POST https://yourdomain.com/api/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","userName":"Test","posterUrl":"https://example.com/test.jpg","sessionId":"test123"}'

# Test PHP API
curl -X POST https://yourdomain.com/api/send-email.php \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","userName":"Test","posterUrl":"https://example.com/test.jpg","sessionId":"test123"}'
```

### Step 3: Check Browser Console
1. Go to poster generation page
2. Enter email and generate poster
3. Open browser dev tools (F12)
4. Check Console tab for errors like:
   - "No email found in localStorage"
   - "Email sending failed"
   - Network errors

### Step 4: Verify User Flow
1. **Generate Page**: User enters email → stored in localStorage
2. **Result Page**: After poster generation → email sent automatically
3. **Check**: localStorage should contain `userEmail` and `userName`

---

## File Checklist

Ensure these files exist on your server:

### Required Files:
- ✅ `.env.local` (with MANDRILL_API_KEY)
- ✅ `/api/send-email/route.ts` (Node.js API)
- ✅ `/api/send-email.php` (PHP fallback)
- ✅ `/api/test-email/route.ts` (Testing endpoint)
- ✅ `/debug-email.html` (Debug tool)

### File Locations:
```
your-app/
├── .env.local                    # Environment variables
├── src/app/api/send-email/route.ts
├── src/app/api/test-email/route.ts
├── public/api/send-email.php
└── public/debug-email.html
```

---

## Testing Commands

### Local Testing:
```bash
# Start development server
npm run dev

# Test email in browser
open http://localhost:3000/debug-email.html
```

### Production Testing:
```bash
# Test production deployment
curl -X GET https://yourdomain.com/debug-email.html
```

---

## Expected Email Flow

1. **User Journey**:
   ```
   Generate Page → Enter Email → Select Poster → Upload Photo → 
   Result Page → Poster Generated → Email Sent Automatically
   ```

2. **Technical Flow**:
   ```
   localStorage.setItem('userEmail', email) →
   Poster Generation Complete →
   sendEmailNotification() called →
   Try Node.js API → If fails, try PHP API →
   Email sent with poster download link
   ```

---

## Common Error Messages

### "No email found in localStorage"
- **Cause**: User didn't enter email on generate page
- **Fix**: Ensure email input is working on `/generate` page

### "Email sending failed"
- **Cause**: API configuration issue
- **Fix**: Check `.env.local` file and API endpoints

### "Network error" 
- **Cause**: API route not accessible
- **Fix**: Verify file structure and server configuration

### "Mandrill API error"
- **Cause**: Invalid API key or service issue
- **Fix**: Verify API key and check Mandrill service status

---

## Support Contacts

If issues persist:
1. Check server error logs
2. Test with debug tool: `/debug-email.html`
3. Verify all files are uploaded correctly
4. Ensure environment variables are set on server

---

## Quick Fix Checklist

- [ ] `.env.local` file exists on server
- [ ] API key is correct in environment file
- [ ] User enters email on generate page
- [ ] Email is saved to localStorage
- [ ] API endpoints are accessible
- [ ] Debug tool shows no errors
- [ ] Test email sends successfully 