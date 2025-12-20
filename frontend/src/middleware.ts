import { NextRequest, NextResponse } from 'next/server';

/**
 * CORS Middleware for Production (Railway)
 *
 * Handles:
 * - OPTIONS preflight requests
 * - CORS headers on all API responses
 * - Allowlist from env var CORS_ORIGINS
 */

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');

  // Get allowed origins from env var (comma-separated)
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',').map(o => o.trim()) || [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ];

  // Check if origin is allowed
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);

  // Handle OPTIONS preflight request
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400', // 24 hours
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }

  // Clone the response and add CORS headers to all API responses
  const response = NextResponse.next();

  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

// Apply middleware only to API routes
export const config = {
  matcher: '/api/:path*',
};
