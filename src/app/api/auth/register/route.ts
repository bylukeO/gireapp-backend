// ─────────────────────────────────────────────────
// GIREAPP — POST /api/auth/register (BE-AUTH-001)
// Accepts name, email, password
// Returns 201 on success, 409 on duplicate, 422 on validation failure
// ─────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validations';
import { sanitizeObject, detectThreats } from '@/lib/sanitize';
import { sendVerificationEmail } from '@/lib/email';

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

    // ── 3. Sanitise input ──
    const sanitizedBody = sanitizeObject(body);

    // ── 4. Validate with Zod ──
    const result = registerSchema.safeParse(sanitizedBody);
    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Validation failed.',
          errors: result.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    const { name, email, password } = result.data;

    // ── 5. Check for duplicate email ──
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    // ── 6. Hash password (bcrypt cost ≥ 12) ──
    const passwordHash = await hash(password, 12);

    // ── 7. Generate verification token (24h expiry) ──
    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // ── 8. Create user ──
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email,
        passwordHash,
        verificationToken,
        verificationExpiry,
        emailVerified: new Date(), // TEMPORARY BYPASS FOR TEAM TESTING
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // TEMPORARILY COMMENTED OUT FOR TEAM TESTING
    // sendVerificationEmail(email, user.name, verificationToken).catch((err) => {
    //   console.error('[GIREAPP] Failed to send verification email:', err);
    // });

    // ── 10. Return 201 Created ──
    return NextResponse.json(
      {
        message: 'Account created successfully. You can now log in.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[GIREAPP] Registration error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
