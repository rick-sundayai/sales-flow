/**
 * Session management utilities for enhanced security
 * Implements session timeout, concurrent session limits, and secure session handling
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import type { User } from '@supabase/supabase-js';

export interface SessionConfig {
  maxAge: number;           // Session max age in seconds (default: 24 hours)
  idleTimeout: number;      // Idle timeout in seconds (default: 30 minutes)
  maxConcurrentSessions: number; // Max sessions per user (default: 5)
  enableFingerprinting: boolean; // Browser fingerprinting for session security
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  maxAge: 24 * 60 * 60,        // 24 hours
  idleTimeout: 30 * 60,        // 30 minutes
  maxConcurrentSessions: 5,     // 5 concurrent sessions
  enableFingerprinting: true,   // Enable browser fingerprinting
};

export interface SessionData {
  userId: string;
  sessionId: string;
  createdAt: string;
  lastActivity: string;
  fingerprint?: string;
  userAgent?: string;
  ipAddress?: string;
}

// In-memory session store (in production, use Redis)
const sessionStore = new Map<string, SessionData>();

/**
 * Generate a secure session ID
 */
export function generateSessionId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate browser fingerprint for session security
 */
export function generateFingerprint(req: NextRequest): string {
  const userAgent = req.headers.get('user-agent') || '';
  const acceptLanguage = req.headers.get('accept-language') || '';
  const acceptEncoding = req.headers.get('accept-encoding') || '';
  
  const fingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  return Buffer.from(fingerprint).toString('base64');
}

/**
 * Get client IP address
 */
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  
  return forwarded?.split(',')[0] || realIp || req.ip || 'unknown';
}

/**
 * Create a new session
 */
export async function createSession(
  user: User,
  req: NextRequest,
  config: SessionConfig = DEFAULT_SESSION_CONFIG
): Promise<SessionData> {
  const sessionId = generateSessionId();
  const now = new Date().toISOString();
  
  const sessionData: SessionData = {
    userId: user.id,
    sessionId,
    createdAt: now,
    lastActivity: now,
    fingerprint: config.enableFingerprinting ? generateFingerprint(req) : undefined,
    userAgent: req.headers.get('user-agent') || undefined,
    ipAddress: getClientIP(req),
  };

  // Check concurrent session limit
  const userSessions = Array.from(sessionStore.values())
    .filter(session => session.userId === user.id);

  if (userSessions.length >= config.maxConcurrentSessions) {
    // Remove oldest session
    const oldestSession = userSessions
      .sort((a, b) => new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime())[0];
    
    sessionStore.delete(oldestSession.sessionId);
    
    logger.info('Session limit reached, removed oldest session', {
      action: 'session_limit_exceeded',
      userId: user.id,
      removedSessionId: oldestSession.sessionId,
      metadata: {
        concurrentSessions: userSessions.length,
        maxAllowed: config.maxConcurrentSessions,
      },
    });
  }

  sessionStore.set(sessionId, sessionData);

  logger.info('Session created', {
    action: 'session_created',
    userId: user.id,
    sessionId,
    metadata: {
      userAgent: sessionData.userAgent,
      ipAddress: sessionData.ipAddress,
    },
  });

  return sessionData;
}

/**
 * Validate session
 */
export async function validateSession(
  sessionId: string,
  req: NextRequest,
  config: SessionConfig = DEFAULT_SESSION_CONFIG
): Promise<{
  isValid: boolean;
  session?: SessionData;
  reason?: string;
}> {
  const session = sessionStore.get(sessionId);

  if (!session) {
    return { isValid: false, reason: 'Session not found' };
  }

  const now = Date.now();
  const sessionAge = now - new Date(session.createdAt).getTime();
  const idleTime = now - new Date(session.lastActivity).getTime();

  // Check session age
  if (sessionAge > config.maxAge * 1000) {
    sessionStore.delete(sessionId);
    logger.info('Session expired due to max age', {
      action: 'session_expired',
      sessionId,
      userId: session.userId,
      metadata: { sessionAge: sessionAge / 1000 },
    });
    return { isValid: false, reason: 'Session expired' };
  }

  // Check idle timeout
  if (idleTime > config.idleTimeout * 1000) {
    sessionStore.delete(sessionId);
    logger.info('Session expired due to idle timeout', {
      action: 'session_idle_expired',
      sessionId,
      userId: session.userId,
      metadata: { idleTime: idleTime / 1000 },
    });
    return { isValid: false, reason: 'Session idle timeout' };
  }

  // Check browser fingerprint (if enabled)
  if (config.enableFingerprinting && session.fingerprint) {
    const currentFingerprint = generateFingerprint(req);
    if (currentFingerprint !== session.fingerprint) {
      sessionStore.delete(sessionId);
      logger.warn('Session invalidated due to fingerprint mismatch', {
        action: 'session_fingerprint_mismatch',
        sessionId,
        userId: session.userId,
        metadata: {
          storedFingerprint: session.fingerprint.slice(0, 10) + '...',
          currentFingerprint: currentFingerprint.slice(0, 10) + '...',
        },
      });
      return { isValid: false, reason: 'Browser fingerprint mismatch' };
    }
  }

  // Update last activity
  session.lastActivity = new Date().toISOString();
  sessionStore.set(sessionId, session);

  return { isValid: true, session };
}

/**
 * Refresh session activity
 */
export async function refreshSession(sessionId: string): Promise<boolean> {
  const session = sessionStore.get(sessionId);
  
  if (!session) {
    return false;
  }

  session.lastActivity = new Date().toISOString();
  sessionStore.set(sessionId, session);
  
  return true;
}

/**
 * Destroy session
 */
export async function destroySession(sessionId: string): Promise<void> {
  const session = sessionStore.get(sessionId);
  
  if (session) {
    sessionStore.delete(sessionId);
    
    logger.info('Session destroyed', {
      action: 'session_destroyed',
      sessionId,
      userId: session.userId,
    });
  }
}

/**
 * Destroy all user sessions (useful for security incidents)
 */
export async function destroyAllUserSessions(userId: string): Promise<void> {
  const userSessions = Array.from(sessionStore.entries())
    .filter(([_, session]) => session.userId === userId);

  for (const [sessionId, _] of userSessions) {
    sessionStore.delete(sessionId);
  }

  logger.info('All user sessions destroyed', {
    action: 'all_sessions_destroyed',
    userId,
    metadata: { sessionsDestroyed: userSessions.length },
  });
}

/**
 * Get active sessions for a user
 */
export async function getUserSessions(userId: string): Promise<SessionData[]> {
  return Array.from(sessionStore.values())
    .filter(session => session.userId === userId)
    .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
}

/**
 * Session management hook for client-side
 */
export function useSessionManager() {
  const refreshActivity = async (): Promise<void> => {
    try {
      await fetch('/api/auth/session/refresh', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } catch (error) {
      logger.error('Failed to refresh session activity', {
        action: 'session_refresh_failed',
        error: error as Error,
      });
    }
  };

  const endSession = async (): Promise<void> => {
    try {
      await fetch('/api/auth/session/destroy', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } catch (error) {
      logger.error('Failed to end session', {
        action: 'session_end_failed',
        error: error as Error,
      });
    }
  };

  const endAllSessions = async (): Promise<void> => {
    try {
      await fetch('/api/auth/session/destroy-all', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } catch (error) {
      logger.error('Failed to end all sessions', {
        action: 'session_end_all_failed',
        error: error as Error,
      });
    }
  };

  return {
    refreshActivity,
    endSession,
    endAllSessions,
  };
}

/**
 * Session middleware for API routes
 */
export function withSessionValidation(
  handler: (req: NextRequest, session: SessionData) => Promise<Response>,
  config: SessionConfig = DEFAULT_SESSION_CONFIG
) {
  return async (req: NextRequest): Promise<Response> => {
    const sessionId = req.cookies.get('session-id')?.value;

    if (!sessionId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No session found',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const validation = await validateSession(sessionId, req, config);

    if (!validation.isValid || !validation.session) {
      return new Response(
        JSON.stringify({
          success: false,
          error: validation.reason || 'Invalid session',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return handler(req, validation.session);
  };
}

/**
 * Cleanup expired sessions (should be run periodically)
 */
export function cleanupExpiredSessions(config: SessionConfig = DEFAULT_SESSION_CONFIG): void {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [sessionId, session] of sessionStore.entries()) {
    const sessionAge = now - new Date(session.createdAt).getTime();
    const idleTime = now - new Date(session.lastActivity).getTime();

    if (sessionAge > config.maxAge * 1000 || idleTime > config.idleTimeout * 1000) {
      sessionStore.delete(sessionId);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    logger.info('Cleaned up expired sessions', {
      action: 'sessions_cleaned',
      metadata: { cleanedCount, remainingSessions: sessionStore.size },
    });
  }
}

/**
 * Initialize session cleanup interval
 */
export function initSessionCleanup(intervalMs: number = 5 * 60 * 1000): void {
  setInterval(() => {
    cleanupExpiredSessions();
  }, intervalMs);

  logger.info('Session cleanup initialized', {
    action: 'session_cleanup_initialized',
    metadata: { intervalMs },
  });
}