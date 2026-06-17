# GIREAPP — Get It Right Edu App

Enabling Academic Excellence Across Africa. This is the official Next.js 15+ App Router MVP repository.

## Features (MVP Scope)

- **Role-Based Onboarding:** Secondary, Tertiary, and Professional tracks.
- **Personalised Dashboards:** Dynamic UI based on the user's selected department and mood.
- **Secure Authentication:** Self-hosted NextAuth (Auth.js) via JWT (NDPR/POPIA compliant) with email verification.
- **Gamification Engine:** Points (+50 pass / +10 fail) and Badges (Bronze, Silver, Gold, Current Master).
- **Security:** Strict CSP, HSTS, rate-limiting (Upstash Redis), and Zod input validation on all Server Actions.

## Tech Stack

- **Framework:** Next.js 15 (App Router, Server Actions, Turbopack)
- **Language:** TypeScript (Strict)
- **Database:** PostgreSQL (Neon) via Prisma ORM
- **Styling:** Tailwind CSS + shadcn/ui + Radix UI
- **Auth:** Auth.js v5
- **Email:** Resend
- **Rate Limiting:** Upstash Redis
- **Storage:** AWS S3 (Presigned URLs)

## Setup Instructions

### 1. Install Node.js
Ensure you have **Node.js 22.x** or **24.x** installed.
\`\`\`bash
nvm use 22 # Or install it if needed
\`\`\`

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Environment Variables
Copy the example env file and populate it:
\`\`\`bash
cp .env.example .env.local
\`\`\`

Required external services:
- **Neon / Supabase:** For the PostgreSQL `DATABASE_URL` and `DIRECT_URL`.
- **Resend:** For `RESEND_API_KEY`.
- **Upstash Redis:** (Optional for local dev) For rate limiting.
- **AWS S3:** (Optional for local dev) For file uploads.

### 4. Database Setup
Push the schema to your database and generate the Prisma Client:
\`\`\`bash
npm run db:push
npm run db:generate
\`\`\`

**Seed the Database:**
This will create the default admin account (`admin@gireapp.com` / `AdminPassword123!`) and populate the 3 foundational courses.
\`\`\`bash
npm run db:seed
\`\`\`

### 5. Run Development Server
\`\`\`bash
npm run dev
\`\`\`
The app will be available at [http://localhost:3000](http://localhost:3000).

## Architecture Notes

- **Server Actions by Default:** All mutations (auth, progress, course creation) are handled via Next.js Server Actions with strict Zod validation.
- **Feature-Sliced Design:** Code is organized by domain in `src/features/` rather than by tech type (e.g., `features/auth`, `features/courses`).
- **Security First:** The `middleware.ts` handles rate limiting and route guarding *before* any request hits the application logic.

## Milestone Progress

- [x] M1 - Foundation & Branding
- [x] M2 - Auth & Segment Onboarding
- [ ] M3 - Dashboard & Course Delivery (Partially Complete - Scaffolded)
- [ ] M4 - Assessment & Gamification
- [ ] M5 - Admin Panel & Mentorship
- [ ] M6 - QA & Launch
