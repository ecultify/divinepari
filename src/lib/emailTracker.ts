import { supabase } from './supabase';

export type EmailType = 'success' | 'failure' | 'none';
export type EmailStatus = 'pending' | 'sent' | 'failed' | 'bounced' | 'delivered' | 'opened' | 'clicked';
export type EmailProvider = 'hostinger' | 'mandrill' | 'gmail' | 'sendgrid';

export interface EmailTrackingData {
  sessionId: string;
  emailType: EmailType;
  emailProvider?: EmailProvider;
  userEmail?: string;
  userName?: string;
  messageId?: string;
  errorMessage?: string;
}

export class EmailTracker {
  /**
   * Track an email sending attempt
   */
  static async trackEmailAttempt(data: EmailTrackingData): Promise<boolean> {
    try {
      // First get current email_attempts count
      const { data: currentData } = await supabase
        .from('generation_results')
        .select('email_attempts')
        .eq('session_id', data.sessionId)
        .single();

      const currentAttempts = currentData?.email_attempts || 0;

      const { error } = await supabase
        .from('generation_results')
        .update({
          email_attempts: currentAttempts + 1,
          email_type: data.emailType,
          email_status: 'pending',
          email_provider: data.emailProvider || 'hostinger',
          user_email: data.userEmail,
          user_name: data.userName
        })
        .eq('session_id', data.sessionId);

      if (error) {
        console.warn('Email tracking not available:', error.message);
        return false;
      }

      console.log(`Email attempt tracked: ${data.emailType} email for session ${data.sessionId}`);
      return true;
    } catch (error) {
      console.warn('Email tracking not available:', error);
      return false;
    }
  }

  /**
   * Track successful email sending
   */
  static async trackEmailSuccess(data: EmailTrackingData): Promise<boolean> {
    try {
      const updateData: any = {
        email_status: 'sent',
        email_sent_at: new Date().toISOString(),
        email_message_id: data.messageId,
        email_provider: data.emailProvider || 'hostinger'
      };

      if (data.emailType === 'success') {
        updateData.success_email_sent = true;
        updateData.success_email_sent_at = new Date().toISOString();
        updateData.email_sent = true; // Legacy compatibility
      } else if (data.emailType === 'failure') {
        updateData.failure_email_sent = true;
        updateData.failure_email_sent_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('generation_results')
        .update(updateData)
        .eq('session_id', data.sessionId);

      if (error) {
        console.warn('Email success tracking not available:', error.message);
        return false;
      }

      console.log(`Email success tracked: ${data.emailType} email sent for session ${data.sessionId}`);
      return true;
    } catch (error) {
      console.warn('Email success tracking not available:', error);
      return false;
    }
  }

  /**
   * Track failed email sending
   */
  static async trackEmailFailure(data: EmailTrackingData): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('generation_results')
        .update({
          email_status: 'failed',
          email_error_message: data.errorMessage || 'Unknown error',
          email_provider: data.emailProvider || 'hostinger',
          email_sent_at: new Date().toISOString()
        })
        .eq('session_id', data.sessionId);

      if (error) {
        console.warn('Email failure tracking not available:', error.message);
        return false;
      }

      console.log(`Email failure tracked: ${data.emailType} email failed for session ${data.sessionId}`);
      return true;
    } catch (error) {
      console.warn('Email failure tracking not available:', error);
      return false;
    }
  }

  /**
   * Enhanced email sending function with comprehensive tracking
   */
  static async sendEmailWithTracking(
    sessionId: string,
    emailType: EmailType,
    emailData: {
      to: string;
      userName?: string;
      posterUrl?: string;
      isFailure?: boolean;
    },
    provider: EmailProvider = 'hostinger'
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Track email attempt
      await this.trackEmailAttempt({
        sessionId,
        emailType,
        emailProvider: provider,
        userEmail: emailData.to,
        userName: emailData.userName
      });

      // Send email via API
      const response = await fetch('/api/send-email.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...emailData,
          sessionId
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Track success
        await this.trackEmailSuccess({
          sessionId,
          emailType,
          emailProvider: provider,
          messageId: result.messageId || result.response?.id
        });

        return { 
          success: true, 
          messageId: result.messageId || result.response?.id 
        };
      } else {
        // Track failure
        await this.trackEmailFailure({
          sessionId,
          emailType,
          emailProvider: provider,
          errorMessage: result.error || 'Unknown error'
        });

        return { 
          success: false, 
          error: result.error || 'Email sending failed' 
        };
      }
    } catch (error) {
      // Track exception as failure
      await this.trackEmailFailure({
        sessionId,
        emailType,
        emailProvider: provider,
        errorMessage: error instanceof Error ? error.message : 'Exception occurred'
      });

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Exception occurred' 
      };
    }
  }
}