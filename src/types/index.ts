// ─────────────────────────────────────────────────
// GIREAPP — Shared Types & Enums
// Single source of truth for TypeScript types
// ─────────────────────────────────────────────────

/** Academic level segments — maps to user onboarding selection */
export const ACADEMIC_LEVELS = ['SECONDARY', 'TERTIARY', 'PROFESSIONAL'] as const;
export type AcademicLevel = (typeof ACADEMIC_LEVELS)[number];

/** User roles for RBAC */
export const ROLES = ['STUDENT', 'TUTOR', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

/** Content types supported in lessons */
export const CONTENT_TYPES = ['TEXT', 'PDF', 'MARKDOWN', 'VIDEO'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

/** Gamification badge tiers */
export const BADGE_TYPES = ['BRONZE', 'SILVER', 'GOLD', 'CURRENT_MASTER'] as const;
export type BadgeType = (typeof BADGE_TYPES)[number];

/** Mood themes for UI personalization */
export const MOOD_THEMES = ['calm', 'focused', 'energized', 'relaxed'] as const;
export type MoodTheme = (typeof MOOD_THEMES)[number];

/** Department options per academic level */
export const DEPARTMENTS: Record<AcademicLevel, readonly string[]> = {
  SECONDARY: ['Science', 'Business', 'Arts'] as const,
  TERTIARY: ['Undergraduate', 'Postgraduate'] as const,
  PROFESSIONAL: ['Data Analytics', 'Project Management', 'Digital Marketing', 'Software Engineering'] as const,
} as const;

// ── Gamification Constants ──

export const POINTS = {
  QUIZ_PASS: 50,
  QUIZ_FAIL: 10,
} as const;

export const BADGE_THRESHOLDS: Record<BadgeType, { label: string; minScore: number; color: string }> = {
  BRONZE: { label: 'Bronze', minScore: 50, color: '#CD7F32' },
  SILVER: { label: 'Silver', minScore: 70, color: '#C0C0C0' },
  GOLD: { label: 'Gold', minScore: 90, color: '#FFD700' },
  CURRENT_MASTER: { label: 'Current Master', minScore: 95, color: '#3730A3' },
} as const;

// ── Session / Auth Types ──

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  academicLevel: AcademicLevel | null;
  department: string | null;
  moodTheme: string | null;
  points: number;
  image: string | null;
  isOnboardingComplete: boolean;
}

// ── API Response Types ──

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

// ── Dashboard Types ──

export interface DashboardOverview {
  profile: SessionUser;
  totalPoints: number;
  badgeCount: number;
  activeCourses: CourseCard[];
  recentActivity: ActivityItem[];
}

export interface CourseCard {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  moduleCount: number;
  lessonCount: number;
  progress: number; // 0.0 to 1.0
  estimatedMinutes: number;
}

export interface ActivityItem {
  id: string;
  type: 'lesson_completed' | 'quiz_passed' | 'quiz_failed' | 'badge_earned' | 'course_enrolled';
  title: string;
  timestamp: Date;
  metadata?: Record<string, string | number>;
}

// ── Quiz Types ──

export interface QuizQuestion {
  id: string;
  text: string;
  choices: QuizChoice[];
  order: number;
}

export interface QuizChoice {
  id: string;
  text: string;
  order: number;
}

export interface QuizSubmission {
  quizId: string;
  answers: Record<string, string>; // { questionId: choiceId }
  startedAt: string; // ISO timestamp
}

export interface QuizResult {
  score: number;
  totalRight: number;
  totalWrong: number;
  passed: boolean;
  pointsEarned: number;
  badgeEarned: BadgeType | null;
  timeTakenSec: number;
}
