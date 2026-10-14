# Helpdesk

An AI-powered omnichannel ticket management system that automatically classifies, responds to, and routes support tickets across **Email** and **Instagram Direct**.

**Live demo:** https://helpdesk-u64v.onrender.com

> The demo runs on Render's free tier, so the first request after a period of inactivity can take 30–60 seconds while the service wakes up. See [Known Limitations](#known-limitations) for what does and doesn't work on the live demo.

---
Demo Login

When you open the site you will be asked to log in. Use these credentials to access the dashboard:

Field	Value
Email	admin@example.com
Password	password123

These are demo-only credentials for the live deployment. Please don't change the password or delete users.

## Features

### 📧 Email Ticketing
- **Inbound Processing**: Ingest incoming support emails via SendGrid Inbound Parse or IMAP email listener (`imapflow` / `mailparser`).
- **Thread Management**: Full email conversation threads with bidirectional agent and customer replies.
- **Outbound Notifications**: Automated and agent-composed replies dispatched via SMTP (`nodemailer`) and SendGrid.

### 📸 Instagram Direct "I-Tickets" (Omnichannel Support)
- **Instagram Graph API Integration**: Ingest Direct Messages (DMs) from customers in real time.
- **Customer Social Insights**: View Instagram handles, profile avatars, follower counts, bio, and verification badges right in the conversation sidebar.
- **Bi-Directional Messaging**: Agents can draft and dispatch replies directly to the customer's Instagram inbox from the helpdesk.
- **In-Browser DM Simulator**: Test incoming Instagram conversations with custom scenarios using **Simulate Inbound DM**, without needing an active Meta webhook setup.
- **Built-in Setup Guide**: Interactive modal providing step-by-step Meta Developer App configuration instructions.

### 🤖 AI Capabilities (Google Gemini via Vercel AI SDK)
- **Automatic Classification**: Classify incoming tickets into categories (*General Question*, *Technical Question*, *Refund Request*, *Admission*, *Complaint*, etc.).
- **Smart Summaries & Suggested Replies**: AI drafts context-aware responses incorporating knowledge base articles.
- **Confidence Scoring & Sentiment Analysis**: Track ticket sentiment (*positive*, *neutral*, *frustrated*) and model confidence (0–100%).
- **Autonomous Resolution & Escalation**:
  - Auto-resolves routine queries when confidence meets threshold.
  - Automatically flags and escalates complex queries (e.g., high refund requests, system bugs) with documented escalation reasons.
- **AI Status Tracking**: Real-time lifecycle badges (`ai_suggested`, `ai_resolved`, `escalated`, `human_replied`, `awaiting_reply`).

### ⚡ Real-Time Live Sync (SSE)
- **Server-Sent Events (SSE)**: Instant browser updates for new tickets, incoming customer replies, and status transitions without page refreshes.

### 👥 User & Ticket Management
- **Role-Based Access Control**:
  - **Admin**: Full access, user management, omnichannel I-Tickets, role assignment.
  - **Agent**: Ticket queue, reply drafting, assignment, and status updates.
- **Filtering & Search**: Filter by status, priority, channel, sentiment, category, and assigned agent.
- **Analytics Dashboard**: Aggregated overview of open tickets, AI resolution rates, sentiment breakdown, and ticket volume.

---

## Known Limitations

The live demo at https://helpdesk-u64v.onrender.com is hosted on Render's free tier, which causes the following:

- **Outbound email replies are not delivered.** Since September 2025, Render's free web services block outbound traffic on SMTP ports 25, 465 and 587. Tickets are still created from incoming emails (IMAP uses port 993, which is not blocked) and AI replies are generated and saved to the ticket, but the reply email itself is never sent to the customer's inbox. Fixes: upgrade the web service to a paid instance (ports 465 and 587 become available), or send through an HTTPS email API (Brevo, SendGrid, Resend) instead of SMTP.
- **Instagram Direct is not live-connected.** The Meta app is in development mode, so real customer DMs are not delivered to the webhook. The Instagram flow can be tested with **Simulate Inbound DM** inside the I-Tickets page, which creates a conversation exactly as an incoming DM would.
- **The service sleeps when idle.** The IMAP listener, Instagram poller and job queue pause while the free instance is asleep, so emails can be picked up late.
- **The free Render Postgres database expires 30 days after creation.**

All of these are hosting-tier limits, not application bugs. Locally, with SMTP access and a live Meta app, the full email and Instagram flows work.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, Radix UI, TanStack Query, Lucide Icons
- **Backend**: Express 5, TypeScript, Bun runtime
- **Database & ORM**: PostgreSQL, Prisma ORM (with `@prisma/adapter-pg`)
- **AI**: Google Gemini (via Vercel AI SDK)
- **Authentication**: Better Auth (session-based authentication with RBAC)
- **Live Updates**: Server-Sent Events (SSE)
- **Job Queue**: pg-boss
- **Email Services**: SendGrid (Inbound Webhooks), IMAP Listener (`imapflow`), SMTP (`nodemailer`)
- **Social Messaging**: Instagram Graph API
- **Monitoring**: Sentry (Frontend & Backend error tracking)
- **Testing**: Playwright (E2E), Vitest & Testing Library (Unit/Component)
- **Hosting**: Render (web service + managed PostgreSQL)

---

## Project Structure

```text
helpdesk/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── components/         # Shared UI & domain components
│   │   │   ├── iticket/        # Instagram I-Ticket conversation & simulator UI
│   │   │   └── ui/             # shadcn/ui component library
│   │   ├── lib/                # Auth client, SSE hooks, theme, API services
│   │   ├── pages/              # Dashboard, Tickets, I-Tickets, Users, Login
│   │   └── types/              # Frontend TypeScript definitions
│   └── vite.config.ts
├── server/                     # Express backend (Bun)
│   ├── prisma/                 # Prisma schema, migrations, and seed scripts
│   │   ├── schema.prisma       # Database schema (Tickets, ITickets, Users, etc.)
│   │   ├── seed.ts             # Admin & AI agent seed script
│   │   ├── seed-tickets.ts     # Sample email tickets seed
│   │   ├── seed-replies.ts     # Sample email replies seed
│   │   └── seed-itickets.ts    # Realistic Instagram I-Tickets seed
│   ├── src/
│   │   ├── lib/                # Gemini AI, Instagram client, IMAP/SMTP, SSE, Sentry
│   │   ├── middleware/         # Auth, Admin guard, Webhook signature validation
│   │   └── routes/             # REST endpoints (tickets, itickets, users, webhooks, events)
│   └── package.json
├── core/                       # Shared contracts (Zod schemas, constants, types)
├── e2e/                        # Playwright end-to-end test suite
└── package.json                # Workspace root
```

---

## Prerequisites

- [Bun](https://bun.sh) (v1.0+ recommended runtime & package manager)
- PostgreSQL (v14+)
- Google Gemini API key (for AI features)
- *(Optional)* Meta / Instagram App credentials (for live Instagram DMs)
- *(Optional)* SMTP / IMAP credentials (for live email processing)

---

## Getting Started

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment Variables

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your local settings. Minimum required for local development:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/helpdesk?sslmode=disable"
BETTER_AUTH_SECRET="your-32-character-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"
TRUSTED_ORIGINS="http://localhost:5173"
GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-api-key"
SEED_ADMIN_EMAIL="admin@helpdesk.com"
SEED_ADMIN_PASSWORD="YourSecurePassword123!"
```

### 3. Initialize & Seed Database

```bash
cd server

# Run migrations
bunx prisma migrate dev

# Seed Admin & AI agent accounts
bunx prisma db seed

# (Optional) Seed demo email tickets and Instagram I-Tickets
bun run prisma/seed-tickets.ts
bun run prisma/seed-replies.ts
bun run prisma/seed-itickets.ts
```

### 4. Run Development Servers

Run the backend and frontend in separate terminals:

```bash
# Terminal 1 — Backend (Port 3000)
cd server && bun run dev

# Terminal 2 — Frontend (Port 5173)
cd client && bun run dev
```

Navigate to `http://localhost:5173` and log in with the admin credentials you set in `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.

---

## Testing

```bash
# Run client unit & component tests (Vitest)
cd client && bun run test

# Run end-to-end tests (Playwright - requires dev servers running)
bun run test:e2e

# Run E2E tests with UI mode
bun run test:e2e:ui
```

---

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|:--------:|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `BETTER_AUTH_SECRET` | 32+ character secret for session signing | Yes |
| `BETTER_AUTH_URL` | Public base URL of the app (e.g. `https://helpdesk-u64v.onrender.com`) | Yes |
| `TRUSTED_ORIGINS` | App origin allowed for CORS / auth (same as `BETTER_AUTH_URL` in production) | Yes |
| `NODE_ENV` | Set to `production` to serve the built React client from the Express server | Production |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key for ticket classification & replies | Yes |
| `SEED_ADMIN_EMAIL` | Default admin email generated during seeding | Yes |
| `SEED_ADMIN_PASSWORD` | Default admin password generated during seeding | Yes |
| `WEBHOOK_SECRET` | Secret token to authenticate incoming email webhooks | Optional |
| `INSTAGRAM_VERIFY_TOKEN` | Webhook verification token for Meta app | Optional |
| `INSTAGRAM_PAGE_ACCESS_TOKEN`| Meta Page access token with DM permissions | Optional |
| `INSTAGRAM_PAGE_ID` | Meta Page / Instagram Business account ID | Optional |
| `INSTAGRAM_APP_SECRET` | Meta App Secret for signature verification | Optional |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | SMTP configuration for outbound replies | Optional |
| `IMAP_HOST` / `IMAP_PORT` / `IMAP_USER` / `IMAP_PASS` | IMAP configuration for incoming email listener | Optional |
| `SENTRY_DSN` / `SENTRY_ENVIRONMENT` | Sentry error tracking credentials | Optional |

---

## Deployment (Render)

The app deploys as a single Render web service plus a Render PostgreSQL database. In production, the Express backend serves the pre-built React client from `client/dist`, so no separate frontend deployment is needed.

### 1. Create the database

In Render, create a **PostgreSQL** instance in the same region as your web service and copy its **Internal Database URL**.

### 2. Create the web service

Create a **Web Service** from the GitHub repo and set:

| Setting | Value |
|---------|-------|
| Language / Runtime | `Node` (Bun is available on Render's native runtime) |
| Root Directory | *(empty — repository root)* |
| Build Command | `bun install && bun run build` |
| Start Command | `cd server && bunx prisma migrate deploy && bun run start` |
| Health Check Path | `/api/health` |

The build command builds the React client and generates the Prisma client. The start command applies pending migrations on every boot.

### 3. Set environment variables

Add the variables from the reference table above, with these production values:

- `DATABASE_URL` — the Internal Database URL from step 1
- `NODE_ENV` — `production`
- `BETTER_AUTH_URL` and `TRUSTED_ORIGINS` — your service URL, with no trailing slash

### 4. Seed the admin user

Render's free plan has no shell, so run the seed locally against the **External Database URL** (PowerShell shown):

```powershell
cd server
$env:DATABASE_URL="<External Database URL>?sslmode=require"
bunx prisma db seed
Remove-Item Env:DATABASE_URL
```

On macOS/Linux: `DATABASE_URL="<External Database URL>?sslmode=require" bunx prisma db seed`

### 5. Instagram webhook (optional)

In the Meta Developer dashboard, set the webhook callback URL to `https://<your-app>.onrender.com/api/webhooks/instagram` and the verify token to the value of `INSTAGRAM_VERIFY_TOKEN`. Real DMs from ordinary users only arrive once the Meta app is published; until then, use **Simulate Inbound DM**.

### Outbound email on Render

Outbound SMTP is blocked on Render's free web services (see [Known Limitations](#known-limitations)). To send reply emails in production, use a paid Render instance or an HTTPS email provider.
