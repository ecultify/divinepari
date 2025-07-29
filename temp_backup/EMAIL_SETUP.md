# 📧 Email System Setup Guide

## Overview

The Divine x Parimatch application includes a complete PHP-based email sending system that automatically sends branded emails to users after their poster is generated. The system uses Mandrill (Mailchimp Transactional) for reliable email delivery.

## 🔧 Architecture

### Email Flow
1. **User Input**: User enters name and email on `/generate` page
2. **Data Storage**: Name and email stored in localStorage
3. **Poster Generation**: User goes through the poster creation flow
4. **Email Trigger**: After successful poster generation, email is automatically sent
5. **Delivery**: Branded email with download link sent via Mandrill

### Technical Stack
- **Backend**: Pure PHP (compatible with Hostinger shared hosting)
- **Email Service**: Mandrill (Mailchimp Transactional)
- **Database**: Supabase PostgreSQL for tracking
- **Frontend**: Next.js with TypeScript integration

## 🚀 Setup Instructions

### 1. Environment Configuration

Update `public/env.php` with your email settings:

```php
<?php
$_ENV['MANDRILL_API_KEY'] = 'your-mandrill-api-key';
$_ENV['FROM_EMAIL'] = 'support@posewithdivine.com';
$_ENV['FROM_NAME'] = 'Divine x Parimatch';
$_ENV['EMAIL_ENABLED'] = true;
$_ENV['DEBUG_MODE'] = false; // Set to true for debugging
?>
```

### 2. Mandrill Setup

1. **Create Mandrill Account**:
   - Go to [Mandrill](https://mandrillapp.com/)
   - Sign up or use existing Mailchimp account
   - Get your API key from Settings → SMTP & API Info

2. **Configure Sender Domain**:
   - Add and verify your sending domain (`posewithdivine.com`)
   - Set up SPF and DKIM records for deliverability

3. **Set Up Tracking**:
   - Enable open tracking in Mandrill settings
   - Enable click tracking for link analytics

### 3. Database Migration

Run the email tracking migration:

```sql
-- Apply the migration
\i supabase_email_migration.sql
```

This creates:
- Email tracking fields in `generation_results` table
- Dedicated `email_tracking` table for detailed logs
- `email_templates` table for template management
- Analytics views for reporting

### 4. File Structure

Ensure these files are in place:

```
public/
├── api/
│   └── send-email.php          # Main email endpoint
├── test-email.html             # Testing interface
├── debug-email.html            # Debug tools
└── env.php                     # Environment config

src/app/generate/
├── page.tsx                    # User input form (updated)
└── result/
    └── page.tsx                # Email sending integration (updated)
```

## 🧪 Testing

### 1. Test Email Interface

Access the testing interface at: `/test-email.html`

Features:
- Pre-filled test data
- Real-time response display
- Sample poster URL generation
- Session ID generation

### 2. Debug Interface

Use the debug interface at: `/debug-email.html`

Capabilities:
- Environment validation
- API connectivity testing
- Mandrill connection verification
- Full diagnostic reporting

### 3. Manual Testing Steps

1. **Complete User Flow**:
   ```
   /generate → Enter name/email → Generate poster → Check email
   ```

2. **Direct API Testing**:
   ```bash
   curl -X POST /api/send-email.php \
     -H "Content-Type: application/json" \
     -d '{
       "to": "test@example.com",
       "userName": "Test User",
       "posterUrl": "https://example.com/poster.jpg",
       "sessionId": "test_123"
     }'
   ```

## 📧 Email Template

### Features
- **Responsive Design**: Works on mobile and desktop
- **Brand Colors**: Uses Divine x Parimatch yellow (#F8FF13) and black
- **Contest Instructions**: Complete participation guide
- **Download Button**: Prominent poster download CTA
- **Tracking**: Open and click tracking enabled

### Content Sections
1. **Header**: Yellow branded header with emoji
2. **Greeting**: Personalized with user's name
3. **Poster Download**: Direct download button
4. **Contest Instructions**: Step-by-step guide
5. **Hashtags**: Social media hashtags for sharing
6. **Footer**: Brand information and session tracking

## 🔍 Monitoring & Analytics

### Email Tracking
- **Delivery Status**: Track sent, delivered, opened, clicked
- **Error Handling**: Detailed error logging and reporting
- **User Journey**: Integration with existing analytics

### Database Queries

**Check email sending stats**:
```sql
SELECT 
  email_status,
  COUNT(*) as count
FROM email_tracking 
GROUP BY email_status;
```

**View recent email activity**:
```sql
SELECT 
  recipient_email,
  email_status,
  sent_at,
  error_message
FROM email_tracking 
ORDER BY sent_at DESC 
LIMIT 20;
```

## 🛠️ Troubleshooting

### Common Issues

1. **Email Not Sending**
   - Check Mandrill API key validity
   - Verify environment variables loaded
   - Check PHP error logs

2. **Emails Going to Spam**
   - Verify domain authentication (SPF, DKIM)
   - Check sender reputation
   - Review email content for spam triggers

3. **CORS Errors**
   - Ensure CORS headers set in PHP
   - Check allowed origins configuration

4. **Invalid Poster URLs**
   - Verify Supabase storage URLs are public
   - Check URL format and accessibility

### Debug Steps

1. **Check Environment**:
   ```bash
   # Visit debug interface
   /debug-email.html
   ```

2. **Test API Directly**:
   ```bash
   # Test endpoint availability
   curl -X OPTIONS /api/send-email.php
   ```

3. **Validate Email Content**:
   ```bash
   # Use test interface with real email
   /test-email.html
   ```

4. **Check Logs**:
   ```bash
   # Check server error logs
   tail -f /var/log/apache2/error.log
   ```

## 🔐 Security

### Data Protection
- Input validation and sanitization
- Email format validation
- URL validation for poster links
- SQL injection prevention

### API Security
- CORS headers for cross-origin requests
- Request method validation
- Rate limiting (implement if needed)
- Error message sanitization

## 📈 Performance

### Optimization
- **Non-blocking**: Email sending doesn't block user interface
- **Timeouts**: 30-second timeout for email API calls
- **Error Handling**: Graceful fallback if email fails
- **Tracking**: Minimal database queries for tracking

### Scalability
- Mandrill handles email delivery scaling
- Database indexing for fast queries
- Async processing ready for high volume

## 🔄 Maintenance

### Regular Tasks
1. **Monitor Delivery Rates**: Check Mandrill dashboard weekly
2. **Review Error Logs**: Address any recurring issues
3. **Update Templates**: Refresh content as needed
4. **Database Cleanup**: Archive old tracking data monthly

### Template Updates
- HTML template embedded in PHP for easy updates
- Text version for email clients without HTML support
- Variables system for dynamic content

## 📞 Support

### Resources
- **Mandrill Documentation**: [Mandrill API Docs](https://mandrillapp.com/api/docs/)
- **Testing Tools**: Use provided test and debug interfaces
- **Error Logs**: Check server logs for detailed error information

### Contact Points
- Check database tracking for delivery status
- Use debug interface for connectivity issues
- Monitor Mandrill dashboard for account limits

---

## ✅ Checklist

Pre-deployment verification:

- [ ] Mandrill API key configured
- [ ] Domain authentication set up (SPF, DKIM)
- [ ] Database migration applied
- [ ] Test email successfully sent
- [ ] Debug interface shows all green status
- [ ] Error handling tested
- [ ] User flow end-to-end tested
- [ ] Email template renders correctly
- [ ] Contest instructions are accurate
- [ ] Tracking data populates correctly

This email system provides a complete, production-ready solution for automatically sending branded poster delivery emails to users of the Divine x Parimatch application. 