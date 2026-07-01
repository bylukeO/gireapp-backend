# GIREAPP — Backend Services & API

This repository houses the core API services and shared libraries for the GIREAPP platform. The project has been decoupled into a standalone Express.js backend and a separate Next.js frontend (housed in its own repository).

## Repository Structure

This repository acts as an NPM Workspace containing:

- `/backend` - The primary Express.js API, handling all business logic, database queries (Prisma), and JWT authentication.
- `/shared` - A unified TypeScript package containing types, Zod validation schemas, and constants shared across both the frontend and backend to ensure strict typing and single-source-of-truth validation.

## Features (Backend API)

- **Decoupled Architecture:** Fully stateless API design allowing seamless integration with both the Web Frontend and future Mobile Apps.
- **Secure Authentication:** JWT-based authentication via secure, HTTP-only cookies, with SSRF and strict CORS protections.
- **Robust Validation:** All incoming requests are validated against strict Zod schemas provided by the `@gireapp/shared` package.
- **Data Persistence:** PostgreSQL database connected via Prisma ORM.

## Tech Stack

- **Framework:** Express.js (TypeScript)
- **Database:** PostgreSQL (Neon) via Prisma ORM
- **Validation:** Zod
- **Auth:** JWT (JSON Web Tokens)
- **Security:** Helmet, Express Rate Limit, strict CORS.

## Setup Instructions

### 1. Install Node.js
Ensure you have **Node.js 20.x** or higher installed.

### 2. Install Dependencies
Run from the root of the repository to install dependencies for both workspaces:
```bash
npm install
```

### 3. Build Shared Library
The backend depends on the `@gireapp/shared` package. You must build it before running the backend:
```bash
cd shared
npm run build
cd ..
```

### 4. Environment Variables
Navigate into the `backend/` directory and configure the environment variables:
```bash
cd backend
cp .env.example .env
```
Ensure you provide a strong `AUTH_SECRET` and your `DATABASE_URL`.

### 5. Database Setup
From the `backend/` directory, push the schema to your database:
```bash
npm run db:push
npm run db:generate
```

### 6. Run Development Server
You can start the backend development server from the root of the repository:
```bash
npm run dev
```
The API will be available at `http://localhost:8000`.

## Architecture & Security Notes

- **Zero Direct DB Access:** The frontend *never* communicates directly with the database. All operations must pass through this Express API.
- **Validation:** All schemas are centrally defined in `shared/src/validations`. If a model changes, update the schema there and rebuild the shared package.
- **Security:** The API requires `AUTH_SECRET` to be defined in production. Fallback developer secrets will intentionally cause the server to crash in production environments to prevent accidental vulnerabilities.
