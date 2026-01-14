/**
 * Rate limiting utilities for API routes
 * Uses Upstash Redis for distributed rate limiting in production (Vercel)
 * Falls back to in-memory store for local development
 */

import { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
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

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  message?: string;
}

// Check if Upstash Redis is configured
const isUpstashConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

// Initialize Redis client if configured
let redis: Redis | null = null;
if (isUpstashConfigured) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

// In-memory store fallback for local development
const memoryStore = new Map<string, RateLimitStore>();

/**
 * Clean up expired entries from the in-memory store
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (now > entry.resetTime) {
      memoryStore.delete(key);
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
 * In-memory rate limiting (fallback for development)
 */
async function memoryRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }

  const now = Date.now();
  let entry = memoryStore.get(key);

  // Initialize or reset if window has passed
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    memoryStore.set(key, entry);
  }

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const reset = new Date(entry.resetTime);

  // Check if rate limit exceeded
  if (entry.count >= config.maxRequests) {
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
  memoryStore.set(key, entry);

  return {
    success: true,
    limit: config.maxRequests,
    remaining: remaining - 1,
    reset,
  };
}

/**
 * Create Upstash rate limiter with sliding window
 */
function createUpstashRateLimiter(config: RateLimitConfig) {
  if (!redis) return null;

  // Convert windowMs to seconds for Upstash
  const windowSeconds = Math.ceil(config.windowMs / 1000);

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.maxRequests, `${windowSeconds} s`),
    analytics: true,
    prefix: 'salesflow:ratelimit',
  });
}

/**
 * Rate limiting middleware - uses Upstash Redis if available, otherwise in-memory
 */
export function rateLimit(config: RateLimitConfig) {
  const upstashLimiter = createUpstashRateLimiter(config);

  return async (
    req: NextRequest,
    identifier?: string
  ): Promise<RateLimitResult> => {
    const key = generateKey(req, identifier);

    // Use Upstash if configured
    if (upstashLimiter) {
      try {
        const result = await upstashLimiter.limit(key);

        if (!result.success) {
          logger.warn('Rate limit exceeded (Upstash)', {
            action: 'rate_limit_exceeded',
            metadata: {
              key,
              limit: result.limit,
              remaining: result.remaining,
              reset: result.reset,
              userAgent: req.headers.get('user-agent'),
            },
          });
        }

        return {
          success: result.success,
          limit: result.limit,
          remaining: result.remaining,
          reset: new Date(result.reset),
          message: result.success ? undefined : config.message || 'Too many requests',
        };
      } catch (error) {
        // If Upstash fails, fall back to in-memory
        logger.error('Upstash rate limit error, falling back to memory', {
          action: 'upstash_rate_limit_error',
          error: error as Error,
        });
      }
    }

    // Fallback to in-memory rate limiting
    const result = await memoryRateLimit(key, config);

    if (!result.success) {
      logger.warn('Rate limit exceeded (memory)', {
        action: 'rate_limit_exceeded',
        metadata: {
          key,
          limit: config.maxRequests,
          windowMs: config.windowMs,
          userAgent: req.headers.get('user-agent'),
        },
      });
    }

    return result;
  };
}

/**
 * User-specific rate limiter (uses user ID instead of IP)
 * Uses Upstash Redis if available
 */
export function userRateLimit(config: RateLimitConfig) {
  const upstashLimiter = createUpstashRateLimiter(config);

  return async (userId: string): Promise<RateLimitResult> => {
    const key = `user:${userId}`;

    // Use Upstash if configured
    if (upstashLimiter) {
      try {
        const result = await upstashLimiter.limit(key);

        if (!result.success) {
          logger.warn('User rate limit exceeded (Upstash)', {
            userId,
            action: 'user_rate_limit_exceeded',
            metadata: {
              limit: result.limit,
              remaining: result.remaining,
              reset: result.reset,
            },
          });
        }

        return {
          success: result.success,
          limit: result.limit,
          remaining: result.remaining,
          reset: new Date(result.reset),
          message: result.success ? undefined : config.message || 'Too many requests',
        };
      } catch (error) {
        logger.error('Upstash user rate limit error, falling back to memory', {
          userId,
          action: 'upstash_user_rate_limit_error',
          error: error as Error,
        });
      }
    }

    // Fallback to in-memory rate limiting
    const result = await memoryRateLimit(key, config);

    if (!result.success) {
      logger.warn('User rate limit exceeded (memory)', {
        userId,
        action: 'user_rate_limit_exceeded',
        metadata: {
          count: config.maxRequests,
          limit: config.maxRequests,
          windowMs: config.windowMs,
        },
      });
    }

    return result;
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

// AI endpoint rate limiter (5 requests per minute per user)
// Used to prevent API quota exhaustion and cost abuse
export const aiRateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,
  message: 'AI request limit exceeded. Please wait a moment before trying again.',
};

export const aiRateLimit = userRateLimit(aiRateLimitConfig);

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
 * Clear rate limit for a specific key (useful for testing)
 */
export function clearRateLimit(key: string): void {
  memoryStore.delete(key);
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(key: string, config: RateLimitConfig): {
  remaining: number;
  reset: Date;
} {
  const entry = memoryStore.get(key);
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

/**
 * Check if Upstash Redis is being used
 */
export function isUsingUpstash(): boolean {
  return isUpstashConfigured && redis !== null;
}
