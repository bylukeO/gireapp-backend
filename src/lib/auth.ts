// ─────────────────────────────────────────────────
// GIREAPP — Auth.js Node.js Configuration
// Implements the Credentials provider with Prisma & bcrypt
// ─────────────────────────────────────────────────

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { authConfig } from './auth.config';
import type { Role, AcademicLevel } from '@/types';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
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
            deletedAt: null,
          },
        });

        if (!user) {
          return null;
        }

        if (!user.emailVerified) {
          throw new Error('EMAIL_NOT_VERIFIED');
        }

        const isPasswordValid = await compare(password, user.passwordHash);
        if (!isPasswordValid) {
          return null;
        }

        const isOnboardingComplete = Boolean(user.academicLevel && user.department);

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
});
