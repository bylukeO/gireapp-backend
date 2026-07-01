# GIREAPP Security Remediation Plan (M1/M2)

As the Chief Security Officer, I have outlined the critical security remediations required to bring the GIREAPP Express backend up to OWASP, NDPR, and POPIA compliance standards. This plan focuses on preventing brute-force attacks, securing session data, and ensuring zero sensitive data leakage.

## Phase 1: Throttling & Abuse Prevention (High Priority) ✅ COMPLETE
Currently, our authentication endpoints are entirely exposed to brute-force and credential stuffing attacks.

**Tasks:**
- [x] Install `express-rate-limit` package.
- [x] Create a `rateLimit.middleware.ts` utility.
- [x] Implement an **Auth Limiter**: Restrict `/api/auth/login` and `/api/auth/register` to 10 requests per 15 minutes per IP.
- [x] Implement a **Global API Limiter**: Restrict all other `/api/*` routes to 100 requests per 15 minutes per IP.

## Phase 2: Session Hardening & JWT Security (Critical Priority) ✅ COMPLETE
Currently, the JWT is returned in the JSON response body. This means the frontend must store it in `localStorage` or memory, making it highly vulnerable to Cross-Site Scripting (XSS) attacks.

**Tasks:**
- [x] **Migrate to HTTP-Only Cookies**: Updated `auth.controller.ts` to set the JWT in an `httpOnly`, `secure`, and `sameSite: 'strict'` cookie.
- [x] **Adjust Frontend Contract**: Updated `api-documentation.md` to instruct the frontend dev to use `credentials: 'include'`.
- [x] **Add Logout Endpoint**: Added `POST /api/auth/logout` to securely expire the cookie.
- [ ] **Add CSRF Protection**: Implement CSRF protection for all mutating endpoints (`POST`, `PUT`, `DELETE`). *(Deferred — can be added when more mutating endpoints exist.)*

## Phase 3: Global Error Handling & Data Leakage (Medium Priority) ✅ COMPLETE
We must ensure that if an unexpected error occurs, the server NEVER leaks stack traces or internal database fields to the client.

**Tasks:**
- [x] Create a `globalErrorHandler.middleware.ts` with `AppError` class.
- [x] Catch all unhandled exceptions and Prisma errors globally in `server.ts`.
- [x] Standardised error response format: `{"error": "...", "referenceId": "ref-xxx"}`.
- [x] `NODE_ENV === 'production'` checks strictly disable stack traces in production.
- [x] Added `notFoundHandler` for undefined routes (404s).
- [x] Added `express.json({ limit: '1mb' })` to prevent payload DoS attacks.

## Phase 4: Secure Logging & Auditing (Medium Priority) ✅ COMPLETE
For compliance with data privacy laws (NDPR/POPIA), we need an audit trail of access without logging PII.

**Tasks:**
- [x] Implemented structured JSON logger (`utils/logger.ts`) with `info`, `warn`, `error`, and `security` log levels.
- [x] Sensitive fields (passwords, tokens, secrets, email addresses) are **automatically redacted** before being written to logs.
- [x] Log failed authentication attempts with IP addresses at `security` level for monitoring.
- [x] Implemented `requestLogger.middleware.ts` — logs method, path, status, response time, IP, and userId for every request.
- [x] Health check endpoint excluded from logging to reduce noise.

---

## Remaining Work (Future Phases)
- [ ] **CSRF Protection**: Add `csurf` or custom CSRF tokens when mutating endpoints grow.
- [ ] **External Log Aggregation**: Connect structured JSON logs to CloudWatch, Datadog, or Sentry.
- [ ] **Account Lockout**: Lock accounts after N consecutive failed login attempts.
- [ ] **Upstash Redis Rate Limiting**: Switch to distributed Redis-backed rate limiting for multi-instance deployments (infra already in `utils/rate-limit.ts`).
