# Email Functionality - Divine x Parimatch

This document explains the email functionality implementation for the Divine x Parimatch poster generation app.

## Overview

The app automatically sends a beautifully designed email to users when their poster is generated, containing:
- A personalized greeting
- A download link to their poster
- Instructions for the Instagram contest
- Contest rules and hashtags
- Branded styling matching the campaign

## Setup

### 1. Mandrill Configuration

The app uses Mandrill (Mailchimp Transactional) for reliable email delivery.

**API Key:** `md-uHR1LFMjBFB7Yn6aBnl7uA`
**From Email:** `support@posewithdivine.com`

### 2. Environment Variables

Add to your `.env.local` file:
```
MANDRILL_API_KEY=md-uHR1LFMjBFB7Yn6aBnl7uA
```

### 3. Database Schema

Run the database migration to add email fields:
```sql
-- See supabase_email_migration.sql for complete schema
ALTER TABLE generation_results 
ADD COLUMN user_name TEXT,
ADD COLUMN user_email TEXT,
ADD COLUMN email_sent BOOLEAN DEFAULT FALSE;
```

## How It Works

### 1. User Flow
1. User enters name and email on the generate page
2. Email is stored in localStorage during the session
3. After poster generation completes, email is automatically sent
4. Email delivery status is tracked in the database

### 2. Email Triggers
Emails are sent when:
- ✅ Face swap completes successfully (with hair swap)
- ✅ Face swap completes but hair swap fails (fallback)
- ✅ Hair swap completes successfully (preferred)

### 3. Email Content
The email includes:
- **Subject:** "Your Divine Poster is Ready! 🎤✨"
- **Personalized greeting** with user's name
- **Download button** linking to the poster
- **Contest instructions** with hashtags and rules
- **Branded styling** with campaign colors (#F8FF13)

## API Endpoints

### `/api/send-email` (POST)
Sends a poster notification email.

**Request:**
```json
{
  "to": "user@example.com",
  "userName": "John Doe",
  "posterUrl": "https://example.com/poster.jpg",
  "sessionId": "session_123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

### `/api/test-email` (POST)
Sends a test email for verification.

**Request:**
```json
{
  "email": "test@example.com"
}
```

## Testing

### 1. Test Page
Visit `/test-email.html` to test email functionality:
- Enter any email address
- Click "Send Test Email"
- Check inbox for test email

### 2. API Testing
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

### 3. Integration Testing
1. Complete the poster generation flow
2. Check that email is sent automatically
3. Verify email content and styling
4. Test download link functionality

## File Structure

```
src/
├── lib/
│   └── sendEmail.ts          # Email utility functions
├── app/
│   ├── api/
│   │   ├── send-email/
│   │   │   └── route.ts      # Email sending API
│   │   └── test-email/
│   │       └── route.ts      # Email testing API
│   ├── generate/
│   │   ├── page.tsx          # Email collection form
│   │   └── result/
│   │       └── page.tsx      # Email trigger after generation
│   └── ...
├── public/
│   └── test-email.html       # Email testing interface
└── ...
```

## Email Template Features

### Design
- **Responsive design** for mobile and desktop
- **Campaign branding** with Divine x Parimatch colors
- **Professional layout** with proper spacing and typography
- **Call-to-action buttons** with hover effects

### Content
- **Personalized greeting** using user's name
- **Clear instructions** for the Instagram contest
- **Branded hashtags:** #DIVINExparimatch
- **Social handles:** @playwithparimatch
- **Contest rules** and prize information

### Technical
- **HTML and text versions** for compatibility
- **Email tracking** with open and click tracking
- **Proper email headers** and authentication
- **Error handling** and retry logic

## Database Tracking

The system tracks:
- **Email delivery status** (sent/failed)
- **User information** (name, email)
- **Poster URLs** for download links
- **Session correlation** for analytics
- **Timestamp data** for reporting

## Security

- **API key stored securely** in environment variables
- **Email validation** to prevent spam
- **Rate limiting** on email endpoints
- **Session-based authentication** for poster access
- **No sensitive data** in email content

## Monitoring

Monitor email delivery through:
- **Database logs** in `email_logs` table
- **Console logging** for debugging
- **Mandrill dashboard** for delivery metrics
- **Error tracking** in application logs

## Troubleshooting

### Common Issues

1. **Email not sending:**
   - Check MANDRILL_API_KEY in environment
   - Verify email address format
   - Check console logs for errors

2. **Email in spam folder:**
   - Mandrill has good deliverability
   - Check sender reputation
   - Verify SPF/DKIM records for domain

3. **Missing poster URL:**
   - Check Supabase storage upload
   - Verify poster generation completed
   - Check session data persistence

### Debug Steps

1. **Check environment variables:**
   ```bash
   echo $MANDRILL_API_KEY
   ```

2. **Test API directly:**
   ```bash
   curl -X POST /api/test-email -d '{"email":"test@example.com"}'
   ```

3. **Check database records:**
   ```sql
   SELECT * FROM generation_results WHERE email_sent = true;
   SELECT * FROM email_logs ORDER BY created_at DESC;
   ```

## Future Enhancements

- **Email templates** for different poster types
- **Scheduled email campaigns** for winners
- **Email preferences** and unsubscribe handling
- **A/B testing** for email content
- **Analytics integration** for email performance
- **Webhook handling** for delivery status updates 