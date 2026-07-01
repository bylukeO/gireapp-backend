// ─────────────────────────────────────────────────
// GIREAPP — Rate Limiting (Upstash Redis)
// Protects auth endpoints: 20 req/min/IP (per M2)
// ─────────────────────────────────────────────────

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Singleton rate limiter instances
let authLimiter: Ratelimit | null = null;
let apiLimiter: Ratelimit | null = null;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('[GIREAPP] Upstash Redis not configured — rate limiting disabled');
    return null;
  }

  return new Redis({ url, token });
}

/**
 * Auth rate limiter: 20 requests per minute per IP
 * Applied to: /api/auth/*, /login, /register
 */
export function getAuthRateLimiter(): Ratelimit | null {
  if (authLimiter) return authLimiter;

  const redis = getRedis();
  if (!redis) return null;

  authLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    analytics: true,
    prefix: 'gireapp:auth',
  });

  return authLimiter;
}

/**
 * General API rate limiter: 100 requests per minute per IP
 * Applied to: /api/* (non-auth)
 */
export function getApiRateLimiter(): Ratelimit | null {
  if (apiLimiter) return apiLimiter;

  const redis = getRedis();
  if (!redis) return null;

  apiLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'gireapp:api',
  });

  return apiLimiter;
}

/**
 * Check rate limit for a given identifier (typically IP)
 * Returns { success, remaining, reset } or null if limiter unavailable
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset: number } | null> {
  if (!limiter) return null; // Rate limiting not configured — allow through

  const result = await limiter.limit(identifier);
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}
