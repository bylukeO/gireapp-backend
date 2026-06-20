// ─────────────────────────────────────────────────
// GIREAPP — Next.js Middleware
// Auth guards + rate limiting + input sanitisation
// ─────────────────────────────────────────────────

import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { getAuthRateLimiter, checkRateLimit } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth(async function middleware(req) {
  const { pathname } = req.nextUrl;
  const method = req.method;

  // ── Rate limiting on auth endpoints (M2: 20 req/min/IP) ──
  const isAuthRoute = 
    pathname.startsWith('/api/auth') || 
    pathname === '/login' || 
    pathname === '/register' ||
    pathname === '/forgot-password';

  if (isAuthRoute && method === 'POST') {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 
               req.headers.get('x-real-ip') ?? 
               '127.0.0.1';

    const limiter = getAuthRateLimiter();
    const result = await checkRateLimit(limiter, ip);

    if (result && !result.success) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
          },
        }
      );
    }
  }

  // ── Input Sanitisation check for mutation requests (BE-SEC-005) ──
  // Lightweight header-level validation in Edge middleware.
  // Deep sanitisation is performed inside each API route handler.
  if (['POST', 'PUT', 'PATCH'].includes(method) && pathname.startsWith('/api/')) {
    const contentType = req.headers.get('content-type') ?? '';

    // Reject requests with unexpected content types to API routes
    if (
      !contentType.includes('application/json') &&
      !contentType.includes('multipart/form-data') &&
      !contentType.includes('application/x-www-form-urlencoded') &&
      !contentType.includes('application/csp-report') &&
      pathname !== '/api/csp-report'
    ) {
      return new NextResponse(
        JSON.stringify({ error: 'Unsupported content type.' }),
        { status: 415, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Enforce max body size (1MB) for non-upload routes
    const contentLength = req.headers.get('content-length');
    if (
      contentLength &&
      parseInt(contentLength, 10) > 1_048_576 &&
      !pathname.includes('/upload')
    ) {
      return new NextResponse(
        JSON.stringify({ error: 'Request body too large.' }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // ── Redirect authenticated users away from auth pages ──
  const session = req.auth;
  const publicAuthPages = ['/login', '/register', '/forgot-password'];
  
  if (session?.user && publicAuthPages.includes(pathname)) {
    if (!session.user.isOnboardingComplete) {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // ── (Removed strict onboarding redirect to allow skipping) ──

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
