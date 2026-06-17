// ─────────────────────────────────────────────────
// GIREAPP — Next.js Middleware
// Auth guards + rate limiting + security headers
// ─────────────────────────────────────────────────

import { auth } from '@/lib/auth';
import { getAuthRateLimiter, checkRateLimit } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';

export default auth(async function middleware(req) {
  const { pathname } = req.nextUrl;

  // ── Rate limiting on auth endpoints (M2: 20 req/min/IP) ──
  const isAuthRoute = 
    pathname.startsWith('/api/auth') || 
    pathname === '/login' || 
    pathname === '/register' ||
    pathname === '/forgot-password';

  if (isAuthRoute && req.method === 'POST') {
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

  // ── Redirect authenticated users away from auth pages ──
  const session = req.auth;
  const publicAuthPages = ['/login', '/register', '/forgot-password'];
  
  if (session?.user && publicAuthPages.includes(pathname)) {
    if (!session.user.isOnboardingComplete) {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // ── Redirect to onboarding if incomplete ──
  if (
    session?.user && 
    !session.user.isOnboardingComplete && 
    pathname.startsWith('/dashboard')
  ) {
    return NextResponse.redirect(new URL('/onboarding', req.url));
  }

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
