# 🚀 Hostinger Background Processing Setup

## Overview
This setup allows users to leave the website while their poster is being generated. The system will process their face-swap in the background and email them the result.

## 📋 Prerequisites
- Hostinger hosting with cron job support
- Supabase database configured
- Segmind API key
- Mandrill/SMTP email configured

## 🗄️ Database Setup

### 1. Run the Background Jobs Migration
Execute the SQL file on your Supabase database:
```sql
-- Run: supabase_background_jobs_migration.sql
```

This creates:
- `background_jobs` table for job queue
- Database functions for job management
- Indexes for performance
- Email tracking columns

### 2. Verify Tables Created
Check that these tables exist:
- ✅ `background_jobs`
- ✅ `user_sessions` 
- ✅ `generation_results` (updated with new column)

## 📁 File Deployment

### 1. Upload Files to Hostinger
Place these files in your `public_html` directory:

```
public_html/
├── api/
│   ├── background-processor.php     # NEW - Main background processor
│   ├── process-faceswap.php        # Existing face-swap processor
│   └── send-email.php              # Existing email sender
├── env.php                         # Environment variables
└── [rest of your static files]
```

### 2. Required Environment Variables
Ensure your `env.php` contains:

```php
<?php
// Essential for background processing
$_ENV['SEGMIND_API_KEY'] = 'SG_your_actual_key_here';
$_ENV['MANDRILL_API_KEY'] = 'md-your_actual_key_here';

// Supabase configuration
$_ENV['SUPABASE_URL'] = 'https://nuoizrqsnxoldzcvwszu.supabase.co';
$_ENV['SUPABASE_SERVICE_KEY'] = 'your_service_role_key_here';
?>
```

## ⏰ Hostinger Cron Job Setup

### 1. Access Cron Jobs in Hostinger
1. Log into Hostinger control panel
2. Go to **Advanced** → **Cron Jobs**
3. Click **Create New Cron Job**

### 2. Cron Job Configuration

**Frequency:** Every 2 minutes
```
*/2 * * * *
```

**Command:**
```bash
/usr/bin/php /home/your_username/public_html/api/background-processor.php
```

**Alternative Command (if above doesn't work):**
```bash
curl -s https://your_domain.com/api/background-processor.php
```

**Or using wget:**
```bash
wget -q -O /dev/null https://your_domain.com/api/background-processor.php
```

### 3. Cron Job Settings
- **Name:** Background Poster Processing
- **Frequency:** Every 2 minutes (`*/2 * * * *`)
- **Email notifications:** Enabled (for error alerts)

## 🔧 How It Works

### User Flow
1. **User uploads photo** → Background job queued automatically
2. **User can continue** → Normal processing continues
3. **User can leave early** → Background system takes over
4. **Email delivered** → User receives poster regardless

### Background Processing Flow
```
Cron Job (every 2 min) 
    ↓
Get Next Pending Job
    ↓
Check if Email Already Sent (deduplication)
    ↓
Process Face-Swap (Segmind API)
    ↓
Send Email (existing email system)
    ↓
Mark Job Complete
```

### Job States
- **pending** → Waiting to be processed
- **processing** → Currently being worked on
- **completed** → Successfully finished
- **failed** → Error occurred (with retry logic)

## 📊 Monitoring & Debugging

### 1. Log Files
Background processor creates logs at:
```
public_html/api/background-processor.log
```

Monitor with:
```bash
tail -f /home/your_username/public_html/api/background-processor.log
```

### 2. Check Job Status
Query Supabase to see job queue:
```sql
SELECT 
  id, session_id, status, attempts, 
  created_at, error_message
FROM background_jobs 
ORDER BY created_at DESC 
LIMIT 10;
```

### 3. Test Background Processor Manually
Visit in browser:
```
https://your_domain.com/api/background-processor.php
```

Expected responses:
- `{"success":true,"message":"No pending jobs"}` - No jobs to process
- `{"success":true,"message":"Job processed successfully","email_sent":true}` - Job completed

## 🛡️ Error Handling

### Automatic Retry Logic
- **Failed jobs** are automatically retried up to 3 times
- **Exponential backoff** prevents spam (2^attempts minutes)
- **Permanent failures** after max attempts reached

### Common Issues & Solutions

**Issue:** Cron job not running
```bash
# Check cron service status
systemctl status cron

# Verify your cron syntax
crontab -l
```

**Issue:** PHP path problems
```bash
# Find PHP path
which php
# Use full path in cron command
```

**Issue:** File permissions
```bash
# Make processor executable
chmod +x /home/your_username/public_html/api/background-processor.php
```

**Issue:** Environment variables not loaded
- Verify `env.php` is in correct location
- Check file permissions (readable by web server)

## 🔍 Testing the Complete System

### 1. Test Background Job Queuing
1. Upload a photo on the website
2. Check database for new job:
   ```sql
   SELECT * FROM background_jobs WHERE status = 'pending';
   ```

### 2. Test Manual Processing
Run the processor manually:
```bash
php /home/your_username/public_html/api/background-processor.php
```

### 3. Test Complete User Journey
1. Upload photo
2. Wait 30 seconds for "leave early" message
3. Close browser/leave website
4. Wait 2-4 minutes
5. Check email for poster

## 📈 Performance Considerations

### Recommended Settings
- **Cron frequency:** Every 2 minutes (balance of responsiveness vs. resource usage)
- **Job timeout:** 120 seconds (matches Segmind API timeout)
- **Max concurrent jobs:** 1 (prevents API rate limiting)

### Scaling Options
For higher volume:
- Increase cron frequency to every minute
- Add job priority system (already implemented)
- Implement multiple worker processes

## 🚨 Troubleshooting

### Check System Health
1. **Database connection:** Verify Supabase credentials
2. **API access:** Test Segmind API key
3. **Email service:** Verify Mandrill configuration
4. **File permissions:** Ensure web server can read/write
5. **Cron execution:** Check Hostinger cron logs

### Emergency Stops
To stop background processing:
1. Disable the cron job in Hostinger panel
2. Mark all pending jobs as failed:
   ```sql
   UPDATE background_jobs 
   SET status = 'failed', error_message = 'Manually stopped'
   WHERE status = 'pending';
   ```

## ✅ Deployment Checklist

- [ ] Database migration executed
- [ ] `background-processor.php` uploaded to `/api/` folder
- [ ] Environment variables configured in `env.php`
- [ ] Cron job created in Hostinger panel (every 2 minutes)
- [ ] File permissions set correctly
- [ ] Manual test of background processor successful
- [ ] End-to-end test with real photo upload
- [ ] Email delivery confirmed
- [ ] Log monitoring set up

## 🎯 Success Metrics

### Key Indicators
- ✅ Background jobs processing successfully
- ✅ Emails delivered within 2-4 minutes of user leaving
- ✅ No duplicate emails sent
- ✅ Error rate < 5%
- ✅ User experience improved (can leave early)

### Monitoring Dashboard
Create a simple monitoring query:
```sql
SELECT 
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/60) as avg_processing_minutes
FROM background_jobs 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

---

## 🆘 Support

If you encounter issues:
1. Check the log files first
2. Verify all configuration settings
3. Test individual components separately
4. Ensure Hostinger cron jobs are enabled on your plan

**This system ensures users get their posters even if they leave early, significantly improving the user experience!**