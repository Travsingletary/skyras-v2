/**
 * Rate Limiting Middleware for Next.js API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier, type RateLimitConfig } from './rateLimit';

/**
 * Apply rate limiting to an API route handler
 *
 * @param config - Rate limit configuration
 * @returns Response with rate limit headers or error if limit exceeded
 *
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = applyRateLimit(request, RATE_LIMITS.FILE_UPLOAD);
 *   if (!rateLimitResult.success) {
 *     return rateLimitResult.response;
 *   }
 *
 *   // Process request...
 *   return NextResponse.json({ success: true });
 * }
 * ```
 */
export function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig = {}
): { success: boolean; response?: NextResponse; headers: Headers } {
  const identifier = getClientIdentifier(request.headers);
  const result = checkRateLimit(identifier, config);

  const headers = new Headers();
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString());

  if (!result.success) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
    headers.set('Retry-After', retryAfter.toString());

    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        {
          status: 429,
          headers,
        }
      ),
      headers,
    };
  }

  return {
    success: true,
    headers,
  };
}

/**
 * Add rate limit headers to an existing response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  headers: Headers
): NextResponse {
  for (const [key, value] of headers.entries()) {
    if (key.startsWith('X-RateLimit') || key === 'Retry-After') {
      response.headers.set(key, value);
    }
  }
  return response;
}
