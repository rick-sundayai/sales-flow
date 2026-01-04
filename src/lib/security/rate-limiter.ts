/**
 * Rate limiting utilities for API routes
 * Implements token bucket algorithm with Redis-like in-memory store
 */

import { NextRequest } from 'next/server';
import { logger } from '@/lib/utils/logger';

interface RateLimitConfig {
  windowMs: number;    // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;    // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean;     // Don't count failed requests
}

interface RateLimitStore {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (in production, use Redis)
const store = new Map<string, RateLimitStore>();

/**
 * Clean up expired entries from the store
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}

/**
 * Generate a rate limit key from request
 */
function generateKey(req: NextRequest, identifier?: string): string {
  if (identifier) return identifier;
  
  // Try to get real IP behind proxies
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  
  const ip = forwarded?.split(',')[0] || realIp || req.ip || 'anonymous';
  
  return `${req.nextUrl.pathname}:${ip}`;
}

/**
 * Rate limiting middleware
 */
export function rateLimit(config: RateLimitConfig) {
  return async (
    req: NextRequest,
    identifier?: string
  ): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: Date;
    message?: string;
  }> => {
    // Clean up expired entries periodically
    if (Math.random() < 0.01) { // 1% chance
      cleanupExpiredEntries();
    }

    const key = generateKey(req, identifier);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    let entry = store.get(key);

    // Initialize or reset if window has passed
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      store.set(key, entry);
    }

    const remaining = Math.max(0, config.maxRequests - entry.count);
    const reset = new Date(entry.resetTime);

    // Check if rate limit exceeded
    if (entry.count >= config.maxRequests) {
      logger.warn('Rate limit exceeded', {
        action: 'rate_limit_exceeded',
        metadata: {
          key,
          count: entry.count,
          limit: config.maxRequests,
          windowMs: config.windowMs,
          userAgent: req.headers.get('user-agent'),
        },
      });

      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        reset,
        message: config.message || 'Too many requests',
      };
    }

    // Increment counter
    entry.count++;
    store.set(key, entry);

    return {
      success: true,
      limit: config.maxRequests,
      remaining: remaining - 1,
      reset,
    };
  };
}

/**
 * Predefined rate limiters for common scenarios
 */

// General API rate limiter (100 requests per minute)
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  message: 'Too many API requests, please try again later',
});

// Authentication rate limiter (5 attempts per 15 minutes)
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many authentication attempts, please try again later',
});

// Strict rate limiter for sensitive operations (10 requests per hour)
export const strictRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  message: 'Rate limit exceeded for sensitive operation',
});

// Email sending rate limiter (5 emails per minute)
export const emailRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,
  message: 'Email sending rate limit exceeded',
});

/**
 * Middleware factory for Next.js API routes
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<Response>,
  limiter: ReturnType<typeof rateLimit>
) {
  return async (req: NextRequest): Promise<Response> => {
    const result = await limiter(req);

    if (!result.success) {
      logger.warn('Rate limit blocked request', {
        action: 'rate_limit_blocked',
        metadata: {
          url: req.nextUrl.toString(),
          method: req.method,
          userAgent: req.headers.get('user-agent'),
        },
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: result.message,
          retryAfter: Math.ceil((result.reset.getTime() - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toISOString(),
            'Retry-After': Math.ceil((result.reset.getTime() - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Add rate limit headers to successful responses
    const response = await handler(req);
    
    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.reset.toISOString());

    return response;
  };
}

/**
 * User-specific rate limiter (uses user ID instead of IP)
 */
export function userRateLimit(config: RateLimitConfig) {
  return async (
    userId: string
  ): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: Date;
    message?: string;
  }> => {
    const now = Date.now();
    const key = `user:${userId}`;

    let entry = store.get(key);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      store.set(key, entry);
    }

    const remaining = Math.max(0, config.maxRequests - entry.count);
    const reset = new Date(entry.resetTime);

    if (entry.count >= config.maxRequests) {
      logger.warn('User rate limit exceeded', {
        userId,
        action: 'user_rate_limit_exceeded',
        metadata: {
          count: entry.count,
          limit: config.maxRequests,
          windowMs: config.windowMs,
        },
      });

      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        reset,
        message: config.message || 'Too many requests',
      };
    }

    entry.count++;
    store.set(key, entry);

    return {
      success: true,
      limit: config.maxRequests,
      remaining: remaining - 1,
      reset,
    };
  };
}

/**
 * Clear rate limit for a specific key (useful for testing)
 */
export function clearRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(key: string, config: RateLimitConfig): {
  remaining: number;
  reset: Date;
} {
  const entry = store.get(key);
  const now = Date.now();

  if (!entry || now > entry.resetTime) {
    return {
      remaining: config.maxRequests,
      reset: new Date(now + config.windowMs),
    };
  }

  return {
    remaining: Math.max(0, config.maxRequests - entry.count),
    reset: new Date(entry.resetTime),
  };
}