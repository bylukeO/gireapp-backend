import { Request, Response } from 'express';
import { hash, compare } from 'bcryptjs';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/prisma';
import { registerSchema, loginSchema } from '@gireapp/shared';
import { sanitizeObject, detectThreats } from '../utils/sanitize';
import { sendVerificationEmail } from '../services/email';
import { logger } from '../utils/logger';

if (!process.env.AUTH_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('AUTH_SECRET environment variable is required in production');
}

const JWT_SECRET = process.env.AUTH_SECRET || 'fallback-dev-secret-change-me';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body;

    // ── 1. Threat detection (BE-SEC-005) ──
    const rawString = JSON.stringify(body);
    const threats = detectThreats(rawString);
    if (threats.length > 0) {
      logger.security('Registration blocked — threat detected', {
        threats,
        ip: req.ip,
      });
      res.status(400).json({ error: 'Request blocked due to suspicious input.' });
      return;
    }

    // ── 2. Sanitise input ──
    const sanitizedBody = sanitizeObject(body);

    // ── 3. Validate with Zod ──
    const result = registerSchema.safeParse(sanitizedBody);
    if (!result.success) {
      res.status(422).json({
        error: 'Validation failed.',
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    const { name, email, password } = result.data;

    // ── 4. Check for duplicate email ──
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    // ── 5. Hash password (bcrypt cost ≥ 12) ──
    const passwordHash = await hash(password, 12);

    // ── 6. Generate verification token (24h expiry) ──
    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // ── 7. Create user ──
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

    // ── 8. Return 201 Created ──
    res.status(201).json({
      message: 'Account created successfully. You can now log in.',
      user,
    });
  } catch (error) {
    logger.error('Registration error', {
      errorMessage: (error as Error).message,
      ip: req.ip,
    });
    res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body;

    // ── 1. Threat detection (BE-SEC-005) ──
    const rawString = JSON.stringify(body);
    const threats = detectThreats(rawString);
    if (threats.length > 0) {
      logger.security('Login blocked — threat detected', {
        threats,
        ip: req.ip,
      });
      res.status(400).json({ error: 'Request blocked due to suspicious input.' });
      return;
    }

    // ── 2. Sanitise & validate ──
    const sanitizedBody = sanitizeObject(body);
    const result = loginSchema.safeParse(sanitizedBody);
    if (!result.success) {
      res.status(422).json({
        error: 'Validation failed.',
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } = result.data;

    // ── 3. Find user ──
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
    if (!user || !user.passwordHash) {
      logger.security('Failed login attempt — user not found or no password', {
        ip: req.ip,
      });
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // ── 4. Check email verification ──
    if (!user.emailVerified) {
      res.status(403).json({ error: 'Please verify your email address before logging in. Check your inbox.' });
      return;
    }

    // ── 5. Verify password ──
    const isValid = await compare(password, user.passwordHash);
    if (!isValid) {
      logger.security('Failed login attempt — wrong password', {
        userId: user.id,
        ip: req.ip,
      });
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // ── 6. Sign JWT (24h expiry, contains userId and role) ──
    const isOnboardingComplete = Boolean(user.academicLevel && user.department);

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        email: user.email,
        academicLevel: user.academicLevel,
        department: user.department,
        isOnboardingComplete,
      },
      JWT_SECRET,
      { expiresIn: '24h', subject: user.id }
    );

    // ── 7. Set HTTP-Only cookie and return profile ──
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.status(200).json({
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
      token,
    });
  } catch (error) {
    logger.error('Login error', {
      errorMessage: (error as Error).message,
      ip: req.ip,
    });
    res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0), // Expire immediately
  });
  res.status(200).json({ message: 'Logged out successfully' });
};
