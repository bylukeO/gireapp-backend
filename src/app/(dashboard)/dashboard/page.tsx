import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SegmentDashboard } from '@/features/courses/segment-dashboard';

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

  // Fallback — Render default content for users who skipped onboarding
  return (
    <div className="space-y-6">
      <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg flex items-center justify-between">
        <p className="text-sm font-medium text-primary">
          You haven't completed your profile setup. Personalise your experience!
        </p>
        <a href="/onboarding" className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90">
          Complete Setup
        </a>
      </div>
      <SegmentDashboard
        config={{
          level: 'SECONDARY',
          title: 'Welcome to GIREAPP',
          subtitle: 'Explore courses and prepare for your future.',
          accentColor: 'indigo',
          badgeBg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
        }}
      />
    </div>
  );
}
