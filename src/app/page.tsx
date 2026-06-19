// ─────────────────────────────────────────────────
// GIREAPP — Landing Page (M2: FE-AUTH-001)
// Hero, features, CTAs — responsive at 375/768/1440px
// Server Component for LCP < 2.5s on 4G
// ─────────────────────────────────────────────────

import Link from 'next/link';
import { GraduationCap, BookOpen, Trophy, Users, ArrowRight, Sparkles, Shield } from 'lucide-react';
import { SafeLink } from '@/components/shared/safe-link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Navigation ── */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <nav className="container flex items-center justify-between h-16 px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <span className="font-heading font-bold text-xl text-foreground">
              GIREAPP
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              Log in
            </Link>
            <SafeLink
              href="/register"
              id="nav-signup-cta"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Sign Up
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </SafeLink>
          </div>
        </nav>
      </header>

      <main id="main-content">
        {/* ── Hero Section ── */}
        <section className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-hero opacity-[0.03] dark:opacity-[0.08]" aria-hidden="true" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-coral-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" aria-hidden="true" />

          <div className="container relative px-4 md:px-6 py-20 md:py-32 lg:py-40">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium animate-fade-in">
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                Enabling Academic Excellence Across Africa
              </div>

              {/* Headline */}
              <h1 className="text-3xl md:text-h1 lg:text-display text-foreground animate-fade-in break-words" style={{ animationDelay: '100ms' }}>
                Get It Right,{' '}
                <span className="text-gradient-brand">The First Time</span>
              </h1>

              {/* Subheadline */}
              <p
                className="text-body-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in break-words"
                style={{ animationDelay: '200ms' }}
              >
                Personalised courses tailored to your academic journey. Whether you&apos;re in 
                high school, university, or pursuing professional certifications — GIREAPP 
                delivers the right content, right when you need it.
              </p>

              {/* CTAs */}
              <div
                className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in"
                style={{ animationDelay: '300ms' }}
              >
                <SafeLink
                  href="/register"
                  id="hero-signup-cta"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl text-base font-semibold hover:opacity-90 transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
                >
                  Start Learning — Free
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </SafeLink>
                <Link
                  href="#features"
                  className="inline-flex items-center gap-2 px-8 py-4 border border-border text-foreground rounded-xl text-base font-medium hover:bg-muted transition-colors"
                >
                  Explore Features
                </Link>
              </div>

              {/* Social proof */}
              <p className="text-caption text-muted-foreground animate-fade-in" style={{ animationDelay: '400ms' }}>
                Trusted by students across Nigeria, Ghana, and South Africa
              </p>
            </div>
          </div>
        </section>

        {/* ── Segments Section ── */}
        <section className="py-20 md:py-28 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-h2 text-foreground">
                Your Track, Your Dashboard
              </h2>
              <p className="text-body text-muted-foreground max-w-2xl mx-auto">
                GIREAPP instantly tailors your experience based on your academic level. 
                No noise, no irrelevant content — just what you need to succeed.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Secondary */}
              <div className="group relative bg-card rounded-2xl border border-border p-8 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-indigo-800 dark:text-indigo-300" aria-hidden="true" />
                </div>
                <h3 className="text-h4 text-foreground mb-2">Secondary</h3>
                <p className="text-body-sm text-muted-foreground mb-4">
                  Science, Business, and Arts tracks for high school students. 
                  WAEC and JAMB-ready content with targeted exam prep.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Science', 'Business', 'Arts'].map((dept) => (
                    <span
                      key={dept}
                      className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-md text-caption font-medium"
                    >
                      {dept}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tertiary */}
              <div className="group relative bg-card rounded-2xl border border-border p-8 hover:border-coral-300 dark:hover:border-coral-700 transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-coral-100 dark:bg-coral-900/40 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-6 h-6 text-coral-600 dark:text-coral-300" aria-hidden="true" />
                </div>
                <h3 className="text-h4 text-foreground mb-2">Tertiary</h3>
                <p className="text-body-sm text-muted-foreground mb-4">
                  Undergraduate and Postgraduate modules. 
                  Research methodology, thesis support, and career mentorship.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Undergraduate', 'Postgraduate'].map((dept) => (
                    <span
                      key={dept}
                      className="px-2.5 py-1 bg-coral-50 dark:bg-coral-900/20 text-coral-700 dark:text-coral-300 rounded-md text-caption font-medium"
                    >
                      {dept}
                    </span>
                  ))}
                </div>
              </div>

              {/* Professional */}
              <div className="group relative bg-card rounded-2xl border border-border p-8 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Trophy className="w-6 h-6 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
                </div>
                <h3 className="text-h4 text-foreground mb-2">Professional</h3>
                <p className="text-body-sm text-muted-foreground mb-4">
                  Industry-certified training for working adults and career changers. 
                  Data-saver mode for cost-efficient learning.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Data Analytics', 'Project Mgmt', 'Digital Marketing'].map((dept) => (
                    <span
                      key={dept}
                      className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-md text-caption font-medium"
                    >
                      {dept}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features Section ── */}
        <section id="features" className="py-20 md:py-28">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-h2 text-foreground">
                Everything You Need to Excel
              </h2>
              <p className="text-body text-muted-foreground max-w-2xl mx-auto">
                From structured lessons to gamified assessments and real mentorship — 
                GIREAPP is your complete academic companion.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {[
                {
                  icon: BookOpen,
                  title: 'Structured Courses',
                  description: 'Multi-format lessons: text, PDFs, and rich markdown. Organised by modules for clear progression.',
                  color: 'indigo' as const,
                },
                {
                  icon: Trophy,
                  title: 'Gamified Learning',
                  description: 'Earn points and badges (Bronze → Gold → Current Master) as you complete assessments.',
                  color: 'coral' as const,
                },
                {
                  icon: Users,
                  title: 'Mentorship Access',
                  description: 'Connect with verified mentors and counsellors for academic and career guidance.',
                  color: 'emerald' as const,
                },
                {
                  icon: Shield,
                  title: 'Data Privacy',
                  description: 'NDPR and POPIA compliant. Your academic data is encrypted and access-controlled.',
                  color: 'violet' as const,
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow"
                >
                  <feature.icon 
                    className={`w-8 h-8 mb-4 ${
                      feature.color === 'indigo' ? 'text-indigo-600 dark:text-indigo-400' :
                      feature.color === 'coral' ? 'text-coral-500 dark:text-coral-400' :
                      feature.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                      'text-violet-600 dark:text-violet-400'
                    }`} 
                    aria-hidden="true" 
                  />
                  <h3 className="text-h4 text-foreground mb-2">{feature.title}</h3>
                  <p className="text-body-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Section ── */}
        <section className="py-20 md:py-28 bg-gradient-hero text-white">
          <div className="container px-4 md:px-6 text-center space-y-8">
            <h2 className="text-h1 text-white">
              Ready to Get It Right?
            </h2>
            <p className="text-body-lg text-indigo-200 max-w-xl mx-auto">
              Join thousands of students across Africa who are taking control of their academic future.
            </p>
            <SafeLink
              href="/register"
              id="footer-signup-cta"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-800 rounded-xl text-base font-semibold hover:bg-indigo-50 transition-colors active:scale-[0.98]"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </SafeLink>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-brand flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <span className="font-heading font-bold text-foreground">GIREAPP</span>
            </div>
            <p className="text-caption text-muted-foreground">
              © {new Date().getFullYear()} GIREAPP — Enabling Academic Excellence Across Africa. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
