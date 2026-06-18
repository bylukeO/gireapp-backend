// ─────────────────────────────────────────────────
// GIREAPP — POST /api/auth/login (BE-AUTH-002)
// Returns signed JWT (24h expiry) on valid credentials
// Returns 401 with unified message on failure
// ─────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { SignJWT } from 'jose';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validations';
import { sanitizeObject, detectThreats } from '@/lib/sanitize';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? 'fallback-dev-secret-change-me'
);

export async function POST(req: NextRequest) {
  try {
    // ── 1. Parse body ──
    const body: unknown = await req.json();

    // ── 2. Threat detection (BE-SEC-005) ──
    const rawString = JSON.stringify(body);
    const threats = detectThreats(rawString);
    if (threats.length > 0) {
      return NextResponse.json(
        { error: 'Request blocked due to suspicious input.' },
        { status: 400 }
      );
    }

    // ── 3. Sanitise & validate ──
    const sanitizedBody = sanitizeObject(body);
    const result = loginSchema.safeParse(sanitizedBody);
    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Validation failed.',
          errors: result.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    const { email, password } = result.data;

    // ── 4. Find user ──
    const user = await prisma.user.findUnique({
      where: { email, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
        academicLevel: true,
        department: true,
        moodTheme: true,
        points: true,
        emailVerified: true,
        image: true,
      },
    });

    // Unified error message to prevent user enumeration (OWASP)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // ── 5. Check email verification ──
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email address before logging in. Check your inbox.' },
        { status: 403 }
      );
    }

    // ── 6. Verify password ──
    const isValid = await compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // ── 7. Sign JWT (24h expiry, contains userId and role) ──
    const isOnboardingComplete = Boolean(user.academicLevel && user.department);

    const token = await new SignJWT({
      userId: user.id,
      role: user.role,
      email: user.email,
      academicLevel: user.academicLevel,
      department: user.department,
      isOnboardingComplete,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .setSubject(user.id)
      .sign(JWT_SECRET);

    // ── 8. Return token + profile ──
    return NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          academicLevel: user.academicLevel,
          department: user.department,
          moodTheme: user.moodTheme,
          points: user.points,
          image: user.image,
          isOnboardingComplete,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GIREAPP] Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
