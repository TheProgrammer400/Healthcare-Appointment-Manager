# Healthcare Appointment & Follow-up Manager (CareSync)

An end-to-end Healthcare Appointment Management system built with Next.js 14+ (App Router), Neon PostgreSQL, Prisma ORM, and Groq LLM API.

---

## Technical Stack & Architecture

- **Frontend & Backend API**: Next.js 14+ (App Router, TypeScript, Tailwind CSS)
- **Database**: Neon PostgreSQL via Prisma ORM using `@prisma/adapter-neon` and `@neondatabase/serverless`
- **LLM Engine**: Groq API (`groq-sdk`, model `llama-3.3-70b-versatile`)
- **Authentication**: Password hashing with bcrypt (cost factor 12) + HTTP-only session cookies stored in PostgreSQL
- **Notifications**: Resend Email API + Google Calendar API v3 (OAuth 2.0)
- **Cron Jobs**: Vercel Cron background worker triggers (`/api/cron/reminders`, `/api/cron/notification-retry`)

---

## Getting Started & Setup Guide

### 1. Prerequisites
- Node.js >= 20.x and npm >= 10.x
- PostgreSQL database instance (Neon PostgreSQL or local instance)

### 2. Environment Configuration
Copy `.env.example` to `.env.local` and populate environment variables:

```bash
cp .env.example .env.local
```

Required keys:
- `DATABASE_URL`: Neon PostgreSQL pooled connection string
- `DIRECT_DATABASE_URL`: Neon direct connection string (for migrations)
- `GROQ_API_KEY`: Groq API key for AI summaries
- `SESSION_SECRET`: Minimum 32-character secret key
- `RESEND_API_KEY`: Resend API key for notification emails
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Google OAuth credentials

### 3. Database Migration & Seed
Run database migrations and seed default Admin, Doctor profiles, and Patient accounts:

```bash
npm run db:push
npm run db:seed
```

Default Seed Accounts:
- **Admin**: `admin@clinic.com` / `AdminPassword123!`
- **Doctor (Cardiology)**: `dr.smith@clinic.com` / `DoctorPassword123!`
- **Doctor (Dermatology)**: `dr.johnson@clinic.com` / `DoctorPassword123!`
- **Patient**: `patient@clinic.com` / `PatientPassword123!`

### 4. Running Locally
Start local dev server:

```bash
npm run dev
```

App will be available at `http://localhost:3000`.

### 5. Running Tests
Execute unit and concurrency integration tests:

```bash
npm test
```

---

## Database Schema Summary

1. `users`: Stores user credentials, hashed passwords, email, and roles (`PATIENT`, `DOCTOR`, `ADMIN`).
2. `sessions`: Manages server-side revocable session tokens.
3. `doctor_profiles`: Linked 1:1 to doctor users; stores specialisation, slot duration, and bio.
4. `doctor_working_hours`: Weekly schedule windows per doctor (`dayOfWeek`, `startTime`, `endTime`).
5. `doctor_leave_days`: Registered leave dates for doctors.
6. `patient_profiles`: Linked 1:1 to patient users.
7. `appointments`: Central booking table. Enforces atomic double-booking prevention via partial unique index `uq_doctor_slot_active` on `(doctor_id, start_at)` WHERE `status IN ('HOLD', 'PENDING', 'CONFIRMED')`.
8. `symptom_forms`: Pre-visit intake symptoms, LLM triage results (`llmUrgency`, `llmChiefComplaint`, `llmQuestions`).
9. `visit_summaries`: Doctor clinical notes, prescription details, and LLM patient-friendly summary.
10. `reminder_jobs`: Asynchronous medication reminder queue derived from prescription frequency.
11. `notification_jobs`: Asynchronous email notification queue with retry backoff.
12. `calendar_events`: Google Calendar event sync state.
13. `google_oauth_tokens`: Stored OAuth 2.0 refresh and access tokens.
14. `audit_logs`: Audit trail for healthcare data access and appointment status transitions.

---

## LLM Prompts Architecture

### Pre-Visit Triage Prompt
- **Role**: Triage assistant
- **Input**: Patient raw symptoms string (truncated to 2,000 chars)
- **Output Schema**: `{ "urgency": "Low" | "Medium" | "High", "chiefComplaint": string, "suggestedQuestions": [string, string, string] }`
- **Safeguards**: Patient text is sanitized and passed strictly in the user role; system prompt explicitly instructs model to ignore embedded commands.

### Post-Visit Summary Prompt
- **Role**: Patient communication assistant
- **Input**: Doctor clinical notes + prescription JSON
- **Output Schema**: `{ "summary": string, "medicationSchedule": string, "followUpSteps": string }`
- **Safeguards**: Model output validated via Zod. On Groq API timeout or failure, `llmStatus` defaults to `'FAILED'` while the consultation completes normally.

---

## Google Calendar Setup

1. Configure Google Cloud Console OAuth 2.0 Client Credentials.
2. Add Authorized Redirect URI: `http://localhost:3000/api/calendar/callback`.
3. Users connect Calendar via `/api/calendar/connect`. If unconnected, system gracefully skips calendar sync while completing booking and email notifications.
