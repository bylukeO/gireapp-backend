# JWT Secret Rotation Runbook (BE-AUTH-002)

## Overview

GIREAPP uses `AUTH_SECRET` as the JWT signing key for both Auth.js sessions and the standalone `/api/auth/login` endpoint. This document describes the procedure for rotating this secret.

## When to Rotate

- **Scheduled:** Every 90 days (quarterly)
- **Emergency:** If a secret is suspected compromised
- **Personnel change:** When team members with access leave the project

## Rotation Procedure

### 1. Generate a New Secret

```bash
# Generate a cryptographically secure random secret (64 bytes)
openssl rand -base64 64
```

### 2. Update Environment Variables

**Vercel Dashboard:**
1. Go to **Project Settings → Environment Variables**
2. Update `AUTH_SECRET` with the new value
3. Apply to **Production**, **Preview**, and **Development** environments

**Local Development:**
1. Update `AUTH_SECRET` in `.env.local`

### 3. Redeploy

```bash
# Trigger a fresh deployment to pick up the new secret
vercel --prod
```

### 4. Verify

1. Confirm the health check is passing: `GET /api/health`
2. Attempt a login at `/api/auth/login` — verify JWT is returned
3. Confirm existing sessions are invalidated (users will need to re-login)

## Impact of Rotation

- **All existing JWTs are invalidated** — users must re-authenticate
- **Auth.js sessions are invalidated** — any stored session cookies become invalid
- **No data loss** — only session state is affected, not user data

## Rollback

If the new secret causes issues:
1. Revert `AUTH_SECRET` to the previous value in Vercel
2. Redeploy

## Monitoring

After rotation, monitor for:
- Spike in 401 responses (expected temporarily)
- Login error rate on Sentry
- User support tickets about unexpected logouts

## Contacts

- **Security Lead:** [TBD]
- **DevOps:** [TBD]
