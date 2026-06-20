// ─────────────────────────────────────────────────
// GIREAPP — Auth.js Edge Configuration
// Contains config safe for the Edge Runtime
// ─────────────────────────────────────────────────

import type { NextAuthConfig } from 'next-auth';
import type { Role, AcademicLevel } from '@/types';

// Extend the default session/JWT types for our custom fields
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      academicLevel: AcademicLevel | null;
      department: string | null;
      moodTheme: string | null;
      points: number;
      image: string | null;
      isOnboardingComplete: boolean;
      emailVerified: Date | null;
    };
  }

  interface User {
    role: Role;
    academicLevel: AcademicLevel | null;
    department: string | null;
    moodTheme: string | null;
    points: number;
    isOnboardingComplete: boolean;
  }
}

declare module 'next-auth' {
  interface JWT {
    id: string;
    role: Role;
    academicLevel: AcademicLevel | null;
    department: string | null;
    moodTheme: string | null;
    points: number;
    isOnboardingComplete: boolean;
  }
}

export const authConfig = {
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours (per M1: BE-AUTH-002)
  },

  pages: {
    signIn: '/login',
    error: '/login',
    newUser: '/onboarding',
  },

  providers: [], // Overridden in auth.ts

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.academicLevel = user.academicLevel;
        token.department = user.department;
        token.moodTheme = user.moodTheme;
        token.points = user.points;
        token.isOnboardingComplete = user.isOnboardingComplete;
      }

      if (trigger === 'update' && session) {
        const sessionData = session as Record<string, unknown>;
        if (sessionData.academicLevel) token.academicLevel = sessionData.academicLevel as AcademicLevel;
        if (sessionData.department) token.department = sessionData.department as string;
        if (sessionData.moodTheme) token.moodTheme = sessionData.moodTheme as string;
        if (typeof sessionData.points === 'number') token.points = sessionData.points;
        if (typeof sessionData.isOnboardingComplete === 'boolean') {
          token.isOnboardingComplete = sessionData.isOnboardingComplete;
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        name: token.name as string,
        email: token.email as string,
        emailVerified: null,
        role: token.role as Role,
        academicLevel: (token.academicLevel as AcademicLevel) ?? null,
        department: (token.department as string) ?? null,
        moodTheme: (token.moodTheme as string) ?? null,
        points: (token.points as number) ?? 0,
        image: (token.picture as string) ?? null,
        isOnboardingComplete: (token.isOnboardingComplete as boolean) ?? false,
      };
      return session;
    },

    async authorized({ auth: session, request }) {
      const isLoggedIn = !!session?.user;
      const { pathname } = request.nextUrl;

      // Public routes — always accessible
      const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
      const isPublicRoute = publicPaths.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
      );
      const isApiAuth = pathname.startsWith('/api/auth');
      const isApiHealth = pathname === '/api/health';

      if (isPublicRoute || isApiAuth || isApiHealth) {
        return true;
      }

      if (!isLoggedIn) {
        // Detect expired session: cookie exists but NextAuth parsed it as null/invalid
        const hasTokenCookie = request.cookies.getAll().some(c => c.name.includes('session-token'));
        
        if (hasTokenCookie) {
          const url = new URL('/login', request.nextUrl);
          url.searchParams.set('expired', 'true');
          url.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search);
          
          // Clear the invalid cookie manually to prevent redirect loops
          const response = Response.redirect(url);
          request.cookies.getAll().forEach(c => {
            if (c.name.includes('session-token')) {
              response.headers.append('Set-Cookie', `${c.name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`);
            }
          });
          return response;
        }

        // Standard unauthenticated redirect, preserves full URL including query params
        const url = new URL('/login', request.nextUrl);
        url.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search);
        return Response.redirect(url);
      }

      if (pathname.startsWith('/admin')) {
        const role = session.user.role as Role;
        if (role !== 'ADMIN' && role !== 'TUTOR') {
          return Response.redirect(new URL('/dashboard', request.nextUrl));
        }
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
