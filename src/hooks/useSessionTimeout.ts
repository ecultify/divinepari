import { useState, useEffect, useCallback, useRef } from 'react';
import { SessionManager, SessionData } from '../lib/sessionManager';

interface UseSessionTimeoutReturn {
  sessionData: SessionData | null;
  timeRemaining: number;
  isExpired: boolean;
  isLoading: boolean;
  extendSession: () => Promise<void>;
  clearSession: () => Promise<void>;
  updateActivity: () => Promise<void>;
  formatTimeRemaining: () => string;
}

export const useSessionTimeout = (sessionId: string | null): UseSessionTimeoutReturn => {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(300000); // 5 minutes in ms
  const [isExpired, setIsExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Update activity timestamp
  const updateActivity = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      const success = await SessionManager.updateActivity(sessionId);
      if (success) {
        lastActivityRef.current = Date.now();
        setIsExpired(false);
      }
    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  }, [sessionId]);

  // Extend session by 5 minutes
  const extendSession = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      const success = await SessionManager.extendSession(sessionId);
      if (success) {
        lastActivityRef.current = Date.now();
        setIsExpired(false);
      }
    } catch (error) {
      console.error('Error extending session:', error);
    }
  }, [sessionId]);

  // Clear session and redirect
  const clearSession = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      await SessionManager.clearSession(sessionId);
      setIsExpired(true);
      setSessionData(null);
      setTimeRemaining(0);
      
      // Redirect to start page with timeout parameter
      window.location.href = '/generate/?timeout=true';
    } catch (error) {
      console.error('Error clearing session:', error);
      window.location.href = '/generate/?timeout=true';
    }
  }, [sessionId]);

  // Format remaining time for display
  const formatTimeRemaining = useCallback(() => {
    return SessionManager.formatRemainingTime(timeRemaining);
  }, [timeRemaining]);

  // Check session validity and update state
  const checkSession = useCallback(async () => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    try {
      const validation = await SessionManager.validateSession(sessionId);
      
      if (!validation.isValid) {
        setIsExpired(true);
        setSessionData(null);
        setTimeRemaining(0);
        setIsLoading(false);
        return;
      }

      setTimeRemaining(validation.timeRemainingSeconds * 1000);
      
      if (SessionManager.isExpired(validation.timeRemainingSeconds * 1000)) {
        setIsExpired(true);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking session:', error);
      setIsLoading(false);
    }
  }, [sessionId]);

  // Initialize session checking
  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    checkSession();
    intervalRef.current = setInterval(checkSession, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [sessionId, checkSession]);

  // Update activity on user interactions
  useEffect(() => {
    if (!sessionId || isExpired) return;

    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current > 30000) {
        updateActivity();
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [sessionId, isExpired, updateActivity]);

  // Auto-redirect when session expires
  useEffect(() => {
    if (isExpired && sessionId) {
      const redirectTimer = setTimeout(() => {
        clearSession();
      }, 3000);

      return () => clearTimeout(redirectTimer);
    }
  }, [isExpired, sessionId, clearSession]);

  return {
    sessionData,
    timeRemaining,
    isExpired,
    isLoading,
    extendSession,
    clearSession,
    updateActivity,
    formatTimeRemaining
  };
};