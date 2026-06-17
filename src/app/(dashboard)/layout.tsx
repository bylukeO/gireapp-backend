import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DashboardSidebar } from '@/features/courses/dashboard-sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (!session.user.isOnboardingComplete) {
    redirect('/onboarding');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar + mobile bottom nav */}
      <DashboardSidebar user={session.user} />

      {/* Main content area */}
      <main
        id="main-content"
        className="lg:pl-64 pb-20 lg:pb-0 min-h-screen"
      >
        <div className="container max-w-6xl px-4 md:px-6 py-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
