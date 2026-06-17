// ─────────────────────────────────────────────────
// GIREAPP — Auth.js (NextAuth v5) Configuration
// Credentials provider with JWT strategy
// httpOnly cookies, role-based session
// ─────────────────────────────────────────────────

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
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

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours (per M1: BE-AUTH-002)
  },

  pages: {
    signIn: '/login',
    error: '/login',
    newUser: '/onboarding',
  },

  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: {
            email: email.toLowerCase().trim(),
            deletedAt: null, // Exclude soft-deleted users
          },
        });

        if (!user) {
          // Unified error message to prevent user enumeration (OWASP)
          return null;
        }

        // Check email verification (M2: BE-SEC-002)
        if (!user.emailVerified) {
          throw new Error('EMAIL_NOT_VERIFIED');
        }

        const isPasswordValid = await compare(password, user.passwordHash);
        if (!isPasswordValid) {
          return null;
        }

        const isOnboardingComplete = Boolean(
          user.academicLevel && user.department
        );

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role as Role,
          academicLevel: user.academicLevel as AcademicLevel | null,
          department: user.department,
          moodTheme: user.moodTheme,
          points: user.points,
          isOnboardingComplete,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign-in — populate token with user data
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.academicLevel = user.academicLevel;
        token.department = user.department;
        token.moodTheme = user.moodTheme;
        token.points = user.points;
        token.isOnboardingComplete = user.isOnboardingComplete;
      }

      // Session update trigger (after onboarding or settings change)
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

      // All other routes require authentication
      if (!isLoggedIn) {
        return false; // Redirects to signIn page
      }

      // Admin routes require ADMIN or TUTOR role
      if (pathname.startsWith('/admin')) {
        const role = session.user.role as Role;
        if (role !== 'ADMIN' && role !== 'TUTOR') {
          return Response.redirect(new URL('/dashboard', request.nextUrl));
        }
      }

      return true;
    },
  },
});
