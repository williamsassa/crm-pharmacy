# CRM Intelligent Pharmacie

## Description

A full-stack CRM application designed for independent pharmacies. It provides patient management, AI-powered patient segmentation, automated follow-up (relance) generation, real-time analytics, and an AI chat assistant for pharmacy administrators.

Built as **CRM Pharmacie FATIMA**, this system enables pharmacy counter staff to register patients in seconds, while administrators gain access to intelligent dashboards, AI-driven insights, and automated communication tools.

## Tech Stack

| Layer          | Technology                                                     |
|----------------|----------------------------------------------------------------|
| Frontend       | Next.js 14 (App Router, TypeScript)                            |
| Authentication | Firebase Auth (Google OAuth + Phone OTP)                       |
| Database       | Supabase (PostgreSQL)                                          |
| AI             | Ollama (local) / Nvidia (cloud) -- Llama, Mistral             |
| UI             | Tailwind CSS, Framer Motion, Recharts                          |
| 3D Background  | Three.js (animated pharmacy-themed scene)                      |
| Deployment     | Vercel (frontend + API) + Supabase (database)                  |

## Features

- Patient registration at the counter with AI auto-classification (chronique, occasionnel, nouveau, a_risque)
- Role-based access control: Superadmin, Admin, Assistant (Comptoir)
- Admin dashboard with KPIs, charts, and full patient database view
- AI chat assistant for administrators with streaming responses
- Automated WhatsApp follow-up message generation
- Patient segmentation and fidelity scoring computed by AI
- Proactive AI agent (hourly cron) that detects patients needing follow-up
- 3D animated pharmacy-themed UI background
- Responsive design across desktop and mobile

## Project Structure

```
crm-pharmacie/
|-- app/                          # Pages and API routes (Next.js App Router)
|   |-- (auth)/login/             # Login page (Firebase Auth)
|   |-- pending/                  # Pending admin validation page
|   |-- dashboard/
|   |   |-- comptoir/             # Counter assistant interface
|   |   |-- admin/                # Admin interface (multiple sub-pages)
|   |   +-- superadmin/           # Super admin management interface
|   +-- api/
|       |-- auth/session/         # Firebase token verification + profile lookup
|       |-- auth/callback/        # Auth callback handler
|       |-- patients/register/    # Patient registration endpoint
|       |-- patients/list/        # Patient listing endpoint
|       |-- ai/chat/              # AI chat (streaming)
|       |-- ai/classify/          # AI patient classification
|       |-- ai/agent-tick/        # Proactive AI agent (cron)
|       |-- admin/pending/        # List pending admin requests
|       |-- admin/request/        # Submit admin access request
|       +-- admin/validate/       # Validate/reject admin requests
|-- components/                   # React components
|   |-- admin/                    # Admin dashboard components
|   |-- chat/                     # AI chat components
|   |-- comptoir/                 # Counter interface components
|   |-- layout/                   # Layout components
|   |-- superadmin/               # Super admin components
|   +-- ui/                       # Shared UI primitives
|-- hooks/
|   +-- useAuth.tsx               # Firebase Auth context + Supabase profile
|-- lib/
|   |-- firebase/                 # Firebase Client SDK + Admin SDK config
|   |-- supabase/                 # Supabase client (service role)
|   |-- ai/                       # AI provider abstraction (Ollama / Nvidia)
|   |-- auth.ts                   # API-side token verification helper
|   |-- whatsapp.ts               # WhatsApp deep-link URL builder
|   +-- utils.ts                  # General utilities
|-- types/
|   +-- index.ts                  # TypeScript type definitions
|-- supabase/
|   |-- migrations/001_init.sql   # Database schema migration
|   +-- seed.sql                  # Seed data
|-- middleware.ts                 # Next.js middleware (route protection)
|-- tailwind.config.ts            # Tailwind CSS configuration
|-- vercel.json                   # Vercel deployment config (includes cron)
+-- package.json
```

## Getting Started

### Prerequisites

- Node.js 18 or later
- A Firebase project with Authentication enabled (Google and Phone providers)
- A Supabase project with PostgreSQL
- Ollama installed locally (for local AI) or a Nvidia API key (for cloud AI)

### Installation

```bash
git clone <repository-url>
cd crm-pharmacie
npm install
```

### Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

Create a `.env.local` file with the following variables:

```
# ------------------------------------------------------------------
# Supabase (Database)
# ------------------------------------------------------------------
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL (https://<ref>.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anonymous/public API key
SUPABASE_SERVICE_ROLE_KEY=        # Supabase service role key (server-side only)

# ------------------------------------------------------------------
# Firebase Auth -- Client-side
# ------------------------------------------------------------------
NEXT_PUBLIC_FIREBASE_API_KEY=             # Firebase web API key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=         # Firebase auth domain (<project>.firebaseapp.com)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=          # Firebase project ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=      # Firebase storage bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID= # Firebase Cloud Messaging sender ID
NEXT_PUBLIC_FIREBASE_APP_ID=              # Firebase web app ID

# ------------------------------------------------------------------
# Firebase Admin SDK -- Server-side
# ------------------------------------------------------------------
FIREBASE_PROJECT_ID=              # Same as NEXT_PUBLIC_FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL=            # Service account email from Firebase Admin SDK JSON
FIREBASE_PRIVATE_KEY=             # Private key from Firebase Admin SDK JSON (keep quotes and \n)

# ------------------------------------------------------------------
# AI Provider
# ------------------------------------------------------------------
NVIDIA_API_KEY=                   # Nvidia API key (cloud AI)

# ------------------------------------------------------------------
# Application
# ------------------------------------------------------------------
NEXT_PUBLIC_APP_URL=              # App base URL (http://localhost:3000 for local dev)
SUPERADMIN_EMAIL=                 # Email address of the initial super admin account
```

**Security note:** Never commit `.env.local` to version control. The `.env.local.example` file is provided as a template with placeholder values only.

### Database Setup

1. Open the **SQL Editor** in your Supabase project dashboard.
2. Paste the contents of `supabase/migrations/001_init.sql` and run the query.
3. Verify that the required tables (`profiles`, `patients`, `visites`) appear in the Table Editor.
4. Optionally run `supabase/seed.sql` to insert sample data.

### Running Locally

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### AI Model Setup

#### Local (Ollama)

Install Ollama from [ollama.com](https://ollama.com), then pull a supported model:

```bash
ollama pull llama3.2:3b
```

The application automatically detects Ollama running at `localhost:11434` and uses it as the primary AI provider.

#### Cloud (Nvidia)

Set the `NVIDIA_API_KEY` variable in `.env.local`. The application falls back to Nvidia when Ollama is not available. Nvidia supports a wide range of models including Llama and Mistral variants.

## Roles and Access Control

| Role               | Access                                                        | Route                    |
|--------------------|---------------------------------------------------------------|--------------------------|
| Assistant (Comptoir) | Patient registration at counter                              | `/dashboard/comptoir`    |
| Admin              | Dashboard, patients, follow-ups, AI chat, settings            | `/dashboard/admin`       |
| Super Admin        | Full system management, admin validation                      | `/dashboard/superadmin`  |

New users who sign in are placed in a pending state until validated by a Super Admin. The first user whose email matches `SUPERADMIN_EMAIL` is automatically granted the Super Admin role.

## Authentication Architecture

```
Client Login (Firebase Client SDK)
  |-- Google OAuth --> signInWithPopup()
  +-- Phone OTP   --> signInWithPhoneNumber() + confirm()
         |
         v
  Firebase ID Token (JWT)
         |
         v
  API Routes --> verifyIdToken (Firebase Admin SDK)
         |
         v
  profiles table (Supabase) --> role and status check
         |
         v
  Redirect based on role
```

Firebase handles authentication exclusively. Supabase is used only as a PostgreSQL database (RLS is disabled; access control is enforced at the API layer using Firebase tokens and the service role key).

## API Routes

| Method | Route                    | Description                                    |
|--------|--------------------------|------------------------------------------------|
| POST   | `/api/auth/session`      | Verify Firebase token and return user profile  |
| GET    | `/api/auth/callback`     | Handle authentication callback                 |
| POST   | `/api/patients/register` | Register a new patient                         |
| GET    | `/api/patients/list`     | List patients with optional filters            |
| POST   | `/api/ai/chat`           | AI chat assistant (streaming response)         |
| POST   | `/api/ai/classify`       | AI-powered patient classification              |
| POST   | `/api/ai/agent-tick`     | Proactive AI agent (called by Vercel cron)     |
| GET    | `/api/admin/pending`     | List pending admin access requests             |
| POST   | `/api/admin/request`     | Submit a request for admin access              |
| POST   | `/api/admin/validate`    | Approve or reject an admin request             |

All API routes (except auth callback) require a valid Firebase ID token in the `Authorization` header.

## Deployment

### Vercel

1. Push the project to a GitHub repository.
2. Import the project in [Vercel](https://vercel.com).
3. Add all environment variables listed above in the Vercel project settings.
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL (e.g., `https://crm-pharmacie.vercel.app`).
5. Deploy.

### Post-Deployment Configuration

After deploying to Vercel, update your Firebase project:

1. Go to **Authentication > Settings > Authorized domains** in the Firebase Console.
2. Add your Vercel domain (e.g., `crm-pharmacie.vercel.app`).

### Environment Variables for Production

All variables listed in the Environment Variables section above must be set in Vercel. The key differences for production:

- `NEXT_PUBLIC_APP_URL` -- set to your production URL instead of `localhost`
- `FIREBASE_PRIVATE_KEY` -- ensure newlines are preserved (Vercel handles `\n` in env vars correctly)
- `SUPABASE_SERVICE_ROLE_KEY` -- use the production Supabase project key

### Cron Job

The `vercel.json` file configures a scheduled cron job that calls `/api/ai/agent-tick` every hour. This endpoint:

- Analyzes chronic patients who have not visited recently
- Generates proactive follow-up alerts and recommendations

## License

MIT
