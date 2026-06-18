// ─────────────────────────────────────────────────
// GIREAPP — Dashboard Index (M2: Segment Router)
// Redirects to the correct segment dashboard
// ─────────────────────────────────────────────────

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

const SEGMENT_MAP: Record<string, string> = {
  SECONDARY: '/dashboard/secondary',
  TERTIARY: '/dashboard/tertiary',
  PROFESSIONAL: '/dashboard/professional',
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const segment = session.user.academicLevel;
  const target = segment ? SEGMENT_MAP[segment] : null;

  if (target) {
    redirect(target);
  }

  // Fallback — shouldn't reach here if onboarding is complete
  redirect('/onboarding');
}
