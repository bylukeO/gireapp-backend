import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { OnboardingForm } from '@/features/auth/onboarding-form';

export const metadata: Metadata = {
  title: 'Welcome — Set Up Your Profile',
  description: 'Personalise your GIREAPP experience by selecting your academic level and department.',
};

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.isOnboardingComplete) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-h1 text-foreground">Welcome, {session.user.name}!</h1>
          <p className="text-body text-muted-foreground">
            Let&apos;s personalise your learning experience. This takes 30 seconds.
          </p>
        </div>

        <OnboardingForm />
      </div>
    </div>
  );
}
