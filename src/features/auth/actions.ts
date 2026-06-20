// ─────────────────────────────────────────────────
// GIREAPP — Auth Server Actions
// Registration, login, verification, password reset
// All inputs validated with Zod
// ─────────────────────────────────────────────────

'use server';

import { hash, compare } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { signIn, signOut } from '@/lib/auth';
import { AuthError } from 'next-auth';
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/email';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  onboardingSchema,
  type RegisterInput,
  type LoginInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type OnboardingInput,
} from '@/lib/validations';
import { sanitizeInput } from '@/lib/utils';
import type { ApiResponse } from '@/types';

// ── Register ──

export async function registerAction(
  _prevState: ApiResponse,
  formData: FormData
): Promise<ApiResponse> {
  // Extract and validate
  const raw = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  };

  const result = registerSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, email, password } = result.data;
  const sanitizedName = sanitizeInput(name);

  // Check for existing user
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return {
      success: false,
      error: 'An account with this email already exists.',
    };
  }

  // Hash password (bcrypt cost ≥ 12 per M1: BE-AUTH-001)
  const passwordHash = await hash(password, 12);

  // Generate verification token
  const verificationToken = randomBytes(32).toString('hex');
  const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Create user
  await prisma.user.create({
    data: {
      name: sanitizedName,
      email,
      passwordHash,
      verificationToken,
      verificationExpiry,
      emailVerified: new Date(), // TEMPORARY BYPASS FOR TEAM TESTING
    },
  });

  // TEMPORARILY COMMENTED OUT FOR TEAM TESTING
  // sendVerificationEmail(email, sanitizedName, verificationToken).catch((err) => {
  //   console.error('[GIREAPP] Failed to send verification email:', err);
  // });

  // Auto-sign in and redirect to onboarding (AC-4: redirect to onboarding flow)
  // NOTE: When email verification is re-enabled, revert to returning success
  // and letting the user verify email first, then log in manually.
  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/onboarding',
    });
  } catch (error) {
    // signIn with redirectTo throws a NEXT_REDIRECT — must re-throw for Next.js
    throw error;
  }

  // This line won't execute due to the redirect above
  return { success: true };
}

// ── Verify Email ──

export async function verifyEmailAction(token: string): Promise<ApiResponse> {
  if (!token) {
    return { success: false, error: 'Verification token is required.' };
  }

  const user = await prisma.user.findFirst({
    where: {
      verificationToken: token,
      verificationExpiry: { gte: new Date() },
    },
  });

  if (!user) {
    return { success: false, error: 'Invalid or expired verification link.' };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      verificationToken: null,
      verificationExpiry: null,
    },
  });

  return {
    success: true,
    data: { message: 'Email verified successfully! You can now log in.' },
  };
}

// ── Login ──

export async function loginAction(
  _prevState: ApiResponse,
  formData: FormData
): Promise<ApiResponse> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };
  
  const rawCallbackUrl = formData.get('callbackUrl') as string | null;
  // Prevent open redirects by ensuring it's a relative path starting with /
  const callbackUrl = (rawCallbackUrl && rawCallbackUrl.startsWith('/') && !rawCallbackUrl.startsWith('//'))
    ? rawCallbackUrl
    : '/dashboard';

  const result = loginSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await signIn('credentials', {
      email: result.data.email,
      password: result.data.password,
      redirectTo: callbackUrl, // Honor the callbackUrl
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === 'CredentialsSignin') {
        return { success: false, error: 'Invalid email or password.' };
      }
      return { success: false, error: 'Something went wrong.' };
    }
    
    // If it's a generic Error (like EMAIL_NOT_VERIFIED thrown in authorize)
    if (error instanceof Error && error.message.includes('EMAIL_NOT_VERIFIED')) {
      return {
        success: false,
        error: 'Please verify your email address before logging in. Check your inbox.',
      };
    }

    // Must re-throw Next.js RedirectError for the cookie to be set!
    throw error;
  }

  // Code below will not execute on success due to the redirect
  return { success: true };
}

// ── Forgot Password ──

export async function forgotPasswordAction(
  _prevState: ApiResponse,
  formData: FormData
): Promise<ApiResponse> {
  const raw = { email: formData.get('email') as string };

  const result = forgotPasswordSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: result.data.email, deletedAt: null },
    select: { id: true, name: true, email: true },
  });

  // Always return success to prevent user enumeration
  if (!user) {
    return {
      success: true,
      data: { message: 'If an account exists with that email, a reset link has been sent.' },
    };
  }

  const resetToken = randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiry },
  });

  sendPasswordResetEmail(user.email, user.name, resetToken).catch((err) => {
    console.error('[GIREAPP] Failed to send password reset email:', err);
  });

  return {
    success: true,
    data: { message: 'If an account exists with that email, a reset link has been sent.' },
  };
}

// ── Reset Password ──

export async function resetPasswordAction(
  _prevState: ApiResponse,
  formData: FormData
): Promise<ApiResponse> {
  const raw = {
    token: formData.get('token') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  };

  const result = resetPasswordSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const user = await prisma.user.findFirst({
    where: {
      resetToken: result.data.token,
      resetTokenExpiry: { gte: new Date() },
    },
  });

  if (!user) {
    return { success: false, error: 'Invalid or expired reset link.' };
  }

  const passwordHash = await hash(result.data.password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return {
    success: true,
    data: { message: 'Password reset successfully! You can now log in with your new password.' },
  };
}

// ── Onboarding (Profile Update) ──

export async function completeOnboardingAction(
  _prevState: ApiResponse,
  formData: FormData
): Promise<ApiResponse> {
  const raw = {
    academicLevel: formData.get('academicLevel') as string,
    department: formData.get('department') as string,
    moodTheme: formData.get('moodTheme') as string,
  };

  const result = onboardingSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // Get current user from session (this action should be called from an authenticated context)
  // The userId would be passed securely or derived from session
  // For Server Actions, we rely on the auth middleware
  const { auth } = await import('@/lib/auth');
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: 'Authentication required.' };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      academicLevel: result.data.academicLevel,
      department: result.data.department,
      moodTheme: result.data.moodTheme,
    },
  });

  return { success: true };
}

// ── Logout ──

export async function logoutAction() {
  await signOut({ redirect: false });
  redirect('/');
}
