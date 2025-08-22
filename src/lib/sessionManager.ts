import { supabase } from './supabase';

export interface SessionData {
  sessionId: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  isActive: boolean;
  timeRemaining: number;
}

export interface SessionValidationResult {
  isValid: boolean;
  expiresAt: Date | null;
  timeRemainingSeconds: number;
}

export class SessionManager {
  private static readonly TIMEOUT_MINUTES = 5;

  /**
   * Generate a new session ID with timeout
   */
  static generateSessionWithTimeout(): string {
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substr(2, 9);
    return `session_${timestamp}_${randomPart}`;
  }

  /**
   * Create a new session in the database with timeout
   */
  static async createSession(sessionId: string): Promise<boolean> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.TIMEOUT_MINUTES * 60 * 1000);

      const { error } = await supabase
        .from('user_sessions')
        .insert([{
          session_id: sessionId,
          created_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          last_activity: now.toISOString(),
          is_active: true
        }]);

      if (error) {
        console.error('Error creating session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception creating session:', error);
      return false;
    }
  }

  /**
   * Validate if a session is still active and not expired
   */
  static async validateSession(sessionId: string): Promise<SessionValidationResult> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('expires_at, is_active')
        .eq('session_id', sessionId)
        .single();

      if (error || !data) {
        return { isValid: false, expiresAt: null, timeRemainingSeconds: 0 };
      }

      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      const timeRemainingMs = expiresAt.getTime() - now.getTime();
      const timeRemainingSeconds = Math.max(0, Math.floor(timeRemainingMs / 1000));

      return {
        isValid: data.is_active && timeRemainingMs > 0,
        expiresAt: expiresAt,
        timeRemainingSeconds: timeRemainingSeconds
      };
    } catch (error) {
      console.error('Exception validating session:', error);
      return { isValid: false, expiresAt: null, timeRemainingSeconds: 0 };
    }
  }

  /**
   * Update session activity (extends timeout by 5 minutes)
   */
  static async updateActivity(sessionId: string): Promise<boolean> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.TIMEOUT_MINUTES * 60 * 1000);

      const { error } = await supabase
        .from('user_sessions')
        .update({
          last_activity: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          is_active: true
        })
        .eq('session_id', sessionId);

      if (error) {
        console.error('Error updating session activity:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception updating session activity:', error);
      return false;
    }
  }

  /**
   * Extend session timeout by 5 minutes
   */
  static async extendSession(sessionId: string): Promise<boolean> {
    return this.updateActivity(sessionId);
  }

  /**
   * Expire a session immediately
   */
  static async expireSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          expires_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);

      if (error) {
        console.error('Error expiring session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception expiring session:', error);
      return false;
    }
  }

  /**
   * Clear session from localStorage and mark as expired
   */
  static async clearSession(sessionId: string): Promise<void> {
    try {
      localStorage.removeItem('sessionId');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      
      await this.expireSession(sessionId);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  /**
   * Check if session should show warning (1 minute remaining)
   */
  static shouldShowWarning(timeRemainingMs: number): boolean {
    return timeRemainingMs <= 60000 && timeRemainingMs > 0;
  }

  /**
   * Check if session is expired
   */
  static isExpired(timeRemainingMs: number): boolean {
    return timeRemainingMs <= 0;
  }

  /**
   * Format remaining time for display
   */
  static formatRemainingTime(timeRemainingMs: number): string {
    const minutes = Math.floor(timeRemainingMs / 60000);
    const seconds = Math.floor((timeRemainingMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}