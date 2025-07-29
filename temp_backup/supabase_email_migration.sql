-- Email tracking migration for Divine x Parimatch application
-- This migration adds email-related fields to track email sending status

-- Add email tracking columns to generation_results table
ALTER TABLE generation_results 
ADD COLUMN user_name TEXT,
ADD COLUMN user_email TEXT,
ADD COLUMN email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN email_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN email_status TEXT CHECK (email_status IN ('pending', 'sent', 'failed', 'bounced', 'delivered', 'opened', 'clicked')),
ADD COLUMN email_message_id TEXT,
ADD COLUMN email_error_message TEXT;

-- Create index for email queries
CREATE INDEX IF NOT EXISTS idx_generation_results_email_sent ON generation_results(email_sent);
CREATE INDEX IF NOT EXISTS idx_generation_results_user_email ON generation_results(user_email);
CREATE INDEX IF NOT EXISTS idx_generation_results_email_status ON generation_results(email_status);

-- Create a separate table for email tracking details
CREATE TABLE IF NOT EXISTS email_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES user_sessions(session_id) ON DELETE CASCADE,
  generation_result_id UUID REFERENCES generation_results(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  email_type TEXT DEFAULT 'poster_delivery' CHECK (email_type IN ('poster_delivery', 'welcome', 'contest_reminder')),
  mandrill_message_id TEXT,
  poster_url TEXT,
  email_status TEXT DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'failed', 'bounced', 'delivered', 'opened', 'clicked')),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create indexes for email tracking table
CREATE INDEX IF NOT EXISTS idx_email_tracking_session_id ON email_tracking(session_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_email ON email_tracking(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_tracking_status ON email_tracking(email_status);
CREATE INDEX IF NOT EXISTS idx_email_tracking_type ON email_tracking(email_type);
CREATE INDEX IF NOT EXISTS idx_email_tracking_sent_at ON email_tracking(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_tracking_mandrill_id ON email_tracking(mandrill_message_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_tracking_updated_at
    BEFORE UPDATE ON email_tracking
    FOR EACH ROW
    EXECUTE PROCEDURE update_email_tracking_updated_at();

-- Add sample email templates table for future use
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT UNIQUE NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('poster_delivery', 'welcome', 'contest_reminder')),
  subject_template TEXT NOT NULL,
  html_template TEXT NOT NULL,
  text_template TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create indexes for email templates
CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(template_name);
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);

-- Insert default poster delivery template
INSERT INTO email_templates (template_name, template_type, subject_template, html_template, text_template, variables)
VALUES (
  'poster_delivery_default',
  'poster_delivery',
  '🎉 Your Divine x Parimatch Poster is Ready!',
  '<!-- HTML template will be managed by PHP for now -->',
  'Your Divine x Parimatch poster is ready for download!',
  '{"userName": "string", "posterUrl": "string", "sessionId": "string"}'
) ON CONFLICT (template_name) DO NOTHING;

-- Create a view for email analytics
CREATE OR REPLACE VIEW email_analytics AS
SELECT 
  DATE(sent_at) as date,
  email_type,
  email_status,
  COUNT(*) as count,
  COUNT(DISTINCT recipient_email) as unique_recipients
FROM email_tracking 
WHERE sent_at IS NOT NULL
GROUP BY DATE(sent_at), email_type, email_status
ORDER BY date DESC;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON email_tracking TO authenticated;
GRANT SELECT ON email_templates TO authenticated;
GRANT SELECT ON email_analytics TO authenticated;

-- Comments for documentation
COMMENT ON TABLE email_tracking IS 'Tracks all email sending activity with status updates from Mandrill webhooks';
COMMENT ON TABLE email_templates IS 'Stores email templates for different types of communications';
COMMENT ON VIEW email_analytics IS 'Provides aggregated email sending statistics for dashboard reporting';

COMMENT ON COLUMN email_tracking.mandrill_message_id IS 'Unique message ID from Mandrill API for tracking delivery status';
COMMENT ON COLUMN email_tracking.poster_url IS 'URL of the poster included in the email';
COMMENT ON COLUMN email_tracking.email_status IS 'Current status of the email: pending, sent, failed, bounced, delivered, opened, clicked'; 