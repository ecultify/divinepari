# Hostinger Background Processing Setup (Trigger Method)

To prevent 503 Service Unavailable errors, use the lightweight trigger approach:

## Method 1: Trigger Endpoint (Recommended for Hostinger)

Use this command in your Hostinger cron job:

```bash
curl -s https://posewithdivine.com/api/trigger-background.php
```

**Why this works:**
- The trigger endpoint responds immediately (no timeout)
- It then calls the actual background processor asynchronously
- Prevents 503 errors from long-running processes

## Method 2: Direct Call (Alternative)

If the trigger method doesn't work, try:

```bash
curl -s https://posewithdivine.com/api/background-processor.php
```

## Cron Job Schedule

Set up the cron job to run every 2 minutes:

```
*/2 * * * * curl -s https://posewithdivine.com/api/trigger-background.php
```

## Troubleshooting

1. **503 Errors**: Use the trigger method instead of direct calls
2. **No logs**: Check that the files are uploaded to the correct directory
3. **No jobs processed**: Verify Supabase credentials in env.php

## Logs

Check the logs at: `/public_html/api/background-processor.log`

Look for entries marked with `[TRIGGER]` and `[BACKGROUND]` to track the process.