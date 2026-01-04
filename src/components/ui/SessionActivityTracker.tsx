'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useSessionManager } from '@/lib/security/session-manager';
import { logger } from '@/lib/utils/logger';

interface SessionActivityTrackerProps {
  refreshInterval?: number; // in milliseconds
  idleThreshold?: number;   // in milliseconds
}

export function SessionActivityTracker({
  refreshInterval = 5 * 60 * 1000, // 5 minutes
  idleThreshold = 30 * 60 * 1000,  // 30 minutes
}: SessionActivityTrackerProps) {
  const { refreshActivity } = useSessionManager();
  const lastActivityRef = useRef(Date.now());
  const refreshIntervalRef = useRef<NodeJS.Timeout>();
  const idleTimeoutRef = useRef<NodeJS.Timeout>();

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    refreshActivity().catch(error => {
      logger.error('Failed to refresh session activity', {
        action: 'session_activity_refresh_failed',
        error: error as Error,
      });
    });
  }, [refreshActivity]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    idleTimeoutRef.current = setTimeout(() => {
      logger.info('Session idle timeout reached', {
        action: 'session_idle_timeout',
        metadata: {
          lastActivity: new Date(lastActivityRef.current).toISOString(),
          idleTime: Date.now() - lastActivityRef.current,
        },
      });
    }, idleThreshold);
  }, [idleThreshold]);

  const handleUserActivity = useCallback(() => {
    updateActivity();
    resetIdleTimer();
  }, [updateActivity, resetIdleTimer]);

  useEffect(() => {
    // Track various user activities
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Throttle activity tracking to avoid excessive API calls
    let activityThrottle: NodeJS.Timeout;
    const throttledActivity = () => {
      clearTimeout(activityThrottle);
      activityThrottle = setTimeout(handleUserActivity, 1000); // Throttle to 1 second
    };

    events.forEach(event => {
      document.addEventListener(event, throttledActivity, true);
    });

    // Set up periodic refresh
    refreshIntervalRef.current = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      
      // Only refresh if there has been recent activity
      if (timeSinceLastActivity < refreshInterval) {
        updateActivity();
      }
    }, refreshInterval);

    // Initial activity tracking
    handleUserActivity();

    return () => {
      // Clean up event listeners
      events.forEach(event => {
        document.removeEventListener(event, throttledActivity, true);
      });

      // Clean up timers
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      clearTimeout(activityThrottle);
    };
  }, [handleUserActivity, updateActivity, refreshInterval]);

  // Track page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refresh activity
        handleUserActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleUserActivity]);

  // Track focus/blur events
  useEffect(() => {
    const handleFocus = () => {
      handleUserActivity();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [handleUserActivity]);

  // This component doesn't render anything visible
  return null;
}

/**
 * Session timeout warning component
 */
export function SessionTimeoutWarning({
  warningTime = 5 * 60 * 1000, // Show warning 5 minutes before timeout
  children,
}: {
  warningTime?: number;
  children: (timeLeft: number, isWarning: boolean) => React.ReactNode;
}) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      // In a real implementation, you'd get the session expiry from the server
      // For now, we'll simulate it
      const sessionExpiry = Date.now() + 30 * 60 * 1000; // 30 minutes from now
      const remaining = sessionExpiry - Date.now();
      
      setTimeLeft(remaining);
      setIsWarning(remaining <= warningTime && remaining > 0);

      if (remaining <= 0) {
        // Session expired
        window.location.href = '/auth/login?expired=true';
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [warningTime]);

  return <>{children(timeLeft, isWarning)}</>;
}