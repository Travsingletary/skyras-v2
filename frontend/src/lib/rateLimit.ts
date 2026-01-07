/**
 * Rate Limiting Middleware
 *
 * Simple in-memory rate limiter for API routes.
 * For production, consider using Redis or a dedicated service.
 */

interface RateLimitStore {
  count: number;
  resetTime: number;
}

// In-memory store (consider Redis for production with multiple instances)
const limitStore = new Map<string, RateLimitStore>();

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   * @default 10
   */
  max?: number;

  /**
   * Time window in milliseconds
   * @default 60000 (1 minute)
   */
  windowMs?: number;

  /**
   * Custom key generator function
   * @default Uses IP address
   */
  keyGenerator?: (identifier: string) => string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Unique identifier (usually IP address or user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and metadata
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = {}
): RateLimitResult {
  const max = config.max ?? 10;
  const windowMs = config.windowMs ?? 60000; // 1 minute default
  const key = config.keyGenerator ? config.keyGenerator(identifier) : identifier;

  const now = Date.now();
  const record = limitStore.get(key);

  // If no record or window has expired, create new record
  if (!record || now > record.resetTime) {
    const resetTime = now + windowMs;
    limitStore.set(key, { count: 1, resetTime });

    return {
      success: true,
      limit: max,
      remaining: max - 1,
      reset: resetTime,
    };
  }

  // Check if limit exceeded
  if (record.count >= max) {
    return {
      success: false,
      limit: max,
      remaining: 0,
      reset: record.resetTime,
    };
  }

  // Increment count
  record.count++;

  return {
    success: true,
    limit: max,
    remaining: max - record.count,
    reset: record.resetTime,
  };
}

/**
 * Get client identifier from request headers
 * Tries multiple headers to find the real IP address
 */
export function getClientIdentifier(headers: Headers): string {
  // Try to get real IP from various headers (in order of preference)
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = headers.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to a default identifier
  return 'unknown';
}

/**
 * Cleanup old entries from the rate limit store
 * Call this periodically to prevent memory leaks
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, record] of limitStore.entries()) {
    if (now > record.resetTime) {
      limitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

/**
 * Preset rate limit configurations
 */
export const RATE_LIMITS = {
  /** Strict: 5 requests per minute */
  STRICT: { max: 5, windowMs: 60000 },

  /** Standard: 10 requests per minute */
  STANDARD: { max: 10, windowMs: 60000 },

  /** Moderate: 30 requests per minute */
  MODERATE: { max: 30, windowMs: 60000 },

  /** Generous: 100 requests per minute */
  GENEROUS: { max: 100, windowMs: 60000 },

  /** File uploads: 5 uploads per 5 minutes */
  FILE_UPLOAD: { max: 5, windowMs: 5 * 60000 },

  /** AI generation: 10 requests per 5 minutes */
  AI_GENERATION: { max: 10, windowMs: 5 * 60000 },

  /** Auth: 5 attempts per 15 minutes */
  AUTH: { max: 5, windowMs: 15 * 60000 },
} as const;
