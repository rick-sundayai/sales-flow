/**
 * CSRF (Cross-Site Request Forgery) Protection
 * Implements double-submit cookie pattern for CSRF protection
 */

import React from 'react';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { logger } from '@/lib/utils/logger';

export const CSRF_TOKEN_NAME = 'csrf-token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Set CSRF token in cookie
 */
export function setCSRFToken(response: Response, token: string): void {
  response.headers.set(
    'Set-Cookie',
    `${CSRF_TOKEN_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`
  );
}

/**
 * Get CSRF token from cookies (server-side)
 */
export async function getCSRFTokenFromCookies(): Promise<string | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(CSRF_TOKEN_NAME);
  return token?.value || null;
}

/**
 * Get CSRF token from request headers
 */
export function getCSRFTokenFromHeaders(req: NextRequest): string | null {
  return req.headers.get(CSRF_HEADER_NAME);
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(cookieToken: string, headerToken: string): boolean {
  if (!cookieToken || !headerToken) {
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(headerToken)
  );
}

/**
 * CSRF protection middleware for API routes
 */
export async function withCSRFProtection(
  handler: (req: NextRequest) => Promise<Response>
) {
  return async (req: NextRequest): Promise<Response> => {
    // Skip CSRF protection for GET, HEAD, OPTIONS (safe methods)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return handler(req);
    }

    const cookieToken = await getCSRFTokenFromCookies();
    const headerToken = getCSRFTokenFromHeaders(req);

    // Check if CSRF token is present and valid
    if (!cookieToken || !headerToken || !validateCSRFToken(cookieToken, headerToken)) {
      logger.warn('CSRF token validation failed', {
        action: 'csrf_validation_failed',
        metadata: {
          method: req.method,
          url: req.nextUrl.toString(),
          hasCookie: !!cookieToken,
          hasHeader: !!headerToken,
          userAgent: req.headers.get('user-agent'),
          referer: req.headers.get('referer'),
        },
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'CSRF token validation failed',
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return handler(req);
  };
}

/**
 * Hook for client-side CSRF token management
 */
export function useCSRFToken() {
  const getToken = (): string | null => {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    const csrfCookie = cookies.find(cookie => 
      cookie.trim().startsWith(`${CSRF_TOKEN_NAME}=`)
    );
    
    return csrfCookie ? csrfCookie.split('=')[1] : null;
  };

  const setTokenInHeaders = (headers: HeadersInit = {}): HeadersInit => {
    const token = getToken();
    if (!token) {
      logger.warn('CSRF token not available for request');
      return headers;
    }

    return {
      ...headers,
      [CSRF_HEADER_NAME]: token,
    };
  };

  return {
    getToken,
    setTokenInHeaders,
  };
}

/**
 * Fetch wrapper with automatic CSRF token inclusion
 */
export async function csrfFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const token = getCSRFTokenFromDocument();
  
  if (!token && !['GET', 'HEAD', 'OPTIONS'].includes(options.method?.toUpperCase() || 'GET')) {
    throw new Error('CSRF token not available');
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers[CSRF_HEADER_NAME] = token;
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin',
  });
}

/**
 * Get CSRF token from document cookies (client-side)
 */
function getCSRFTokenFromDocument(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(cookie => 
    cookie.trim().startsWith(`${CSRF_TOKEN_NAME}=`)
  );
  
  return csrfCookie ? csrfCookie.split('=')[1].trim() : null;
}

/**
 * Initialize CSRF token on page load
 */
export async function initializeCSRFToken(): Promise<string> {
  try {
    const response = await fetch('/api/auth/csrf', {
      method: 'GET',
      credentials: 'same-origin',
    });
    
    if (!response.ok) {
      throw new Error('Failed to initialize CSRF token');
    }
    
    const data = await response.json();
    return data.token;
  } catch (error) {
    logger.error('Failed to initialize CSRF token', {
      action: 'csrf_initialization_failed',
      error: error as Error,
    });
    throw error;
  }
}

/**
 * Component wrapper for CSRF protection
 */
export function withCSRF<T extends Record<string, any>>(
  Component: React.ComponentType<T>
) {
  return function CSRFProtectedComponent(props: T) {
    // Initialize CSRF token when component mounts
    React.useEffect(() => {
      if (typeof window !== 'undefined' && !getCSRFTokenFromDocument()) {
        initializeCSRFToken().catch(error => {
          logger.error('CSRF token initialization failed', {
            error: error as Error,
          });
        });
      }
    }, []);

    return <Component {...props} />;
  };
}