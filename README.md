# LancerLink — Freelancer Client Portal

> A full-stack client portal built for freelancers to showcase their services, manage client projects, and deliver a premium client experience — all in one place.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Supabase Setup](#supabase-setup)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [Application Routes](#application-routes)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Role System](#role-system)
- [Deployment](#deployment)
- [Scripts](#scripts)

---

## Overview

**LancerLink** is a private freelancer–client management system with two distinct surfaces:

1. **Public Landing Page** — A polished portfolio/marketing page where prospective clients can learn about services, view selected work, and send enquiries via a contact form.
2. **Client Portal (`/dashboard`)** — A secure, per-client dashboard where active clients can track project progress, view invoices, download deliverables, exchange messages, and access shared files.
3. **Admin Panel (`/dashboard/admin`)** — A protected back-office used by the freelancer to manage all clients, update project statuses, upload resources, and handle invoicing.

---

## Features

### Client-Facing
- 🔐 Magic-link (OTP) email authentication via Supabase Auth
- 📊 Real-time project progress tracker with visual progress bar
- 🧾 Invoice viewer with PDF export (jsPDF)
- 💬 Secure in-portal messaging thread
- 📁 File/deliverable download centre
- 🌙 Dark/light theme toggle (persisted via `localStorage`)

### Admin
- 👥 Multi-client selector sidebar — switch between any client instantly
- ✏️ Inline project status and progress editing
- 📤 File upload & resource management
- 💰 Invoice generation and management
- 🔗 GitHub URL attachment per project
- ➕ Add new clients directly from the portal

### Platform
- ⚡ Next.js 16 App Router with React Server Components
- 🔒 Row-Level Security (RLS) enforced at the database layer
- 🎨 Glassmorphism UI with animated backgrounds and micro-interactions
- 🖱️ Cursor trail visual effect
- 📱 Fully responsive layout

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI Library | [React 19](https://react.dev) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Database | [Supabase](https://supabase.com) (PostgreSQL) |
| Auth | Supabase Auth — Magic Link / OTP |
| PDF Generation | [jsPDF](https://github.com/parallax/jsPDF) |
| HTTP Client | [undici](https://github.com/nodejs/undici) |
| Linting | ESLint 9 |

---

## Project Structure

```
.
├── app/
│   ├── page.js                  # Public landing page
│   ├── layout.js                # Root layout (ThemeProvider, fonts)
│   ├── globals.css              # Global styles & design tokens
│   ├── login/                   # Magic-link login page
│   ├── auth/                    # Supabase Auth callback handler
│   ├── access-denied/           # Shown when auth fails or is unauthorised
│   └── dashboard/
│       ├── page.js              # Client dashboard (Server Component)
│       ├── layout.js            # Dashboard shell layout
│       ├── admin/               # Admin panel (protected)
│       ├── files/               # File download centre
│       └── messages/            # Client–freelancer messaging
│
├── app/api/
│   ├── projects/
│   │   ├── route.js             # GET  /api/projects?email=…
│   │   ├── create/              # POST /api/projects/create
│   │   ├── update/              # POST /api/projects/update
│   │   └── list/                # GET  /api/projects/list
│   ├── auth/                    # Auth helper endpoints
│   ├── contact/                 # Contact form submission
│   ├── files/                   # File upload / listing
│   ├── invoices/                # Invoice CRUD
│   └── messages/                # Message send / fetch
│
├── components/
│   ├── DashboardClient.js       # Main client dashboard UI
│   ├── AdminForm.js             # Admin project editor
│   ├── AddClientForm.js         # New-client creation wizard
│   ├── Sidebar.js               # Navigation sidebar
│   ├── ClientSelectorSidebar.js # Admin client switcher
│   ├── ContactForm.js           # Landing-page enquiry form
│   ├── ProgressBar.js           # Animated progress indicator
│   ├── StatusBadge.js           # Coloured project-status chip
│   ├── ResourceRow.js           # Single downloadable resource row
│   ├── Toast.js                 # Toast notification system
│   ├── NavBar.js                # Public navigation bar
│   ├── ThemeProvider.js         # Dark/light mode context
│   ├── ThemeToggle.js           # Theme switcher button
│   ├── CursorTrail.jsx          # Decorative cursor trail effect
│   └── …                       # Skeleton / error / shell components
│
├── lib/
│   ├── supabase.js              # Browser Supabase client
│   ├── supabase-server.js       # Server-side Supabase client (service role)
│   ├── supabase-fetch.js        # Lightweight server-fetch helper
│   ├── supabase-constants.js    # Shared table/bucket name constants
│   ├── auth.js                  # Auth session utilities
│   ├── api-auth.js              # API route auth guard
│   ├── dashboard-map.js         # Client data normalisation helpers
│   └── format-currency.js      # Currency formatting utility
│
├── supabase/
│   └── schema.sql               # Full database schema + RLS policies
│
├── public/                      # Static assets
├── scripts/                     # Utility/maintenance scripts
├── .env.example                 # Environment variable template
├── next.config.mjs              # Next.js configuration
└── proxy.js                     # Local dev reverse-proxy helper
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10
- A [Supabase](https://supabase.com) project (free tier is sufficient)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd Freelancer-Client-system

# Install dependencies
npm install
```

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste and run the entire contents of [`supabase/schema.sql`](./supabase/schema.sql).
   - This creates all tables, relationships, RLS policies, and seeds required lookup data.
4. In **Authentication → Settings**, enable **Email (Magic Link / OTP)**.
5. Set the **Site URL** to your deployed URL (or `http://localhost:3000` for local dev).
6. Optionally, configure **Redirect URLs** to include `<your-site>/auth/callback`.

### Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env.local
```

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (**server-only, never expose to browser**) | ✅ |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL used for OTP magic-link redirects | ✅ |

> ⚠️ **Never commit `.env.local`** — it is already in `.gitignore`.

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Application Routes

| Route | Access | Description |
|---|---|---|
| `/` | Public | Landing page — services, portfolio, contact form |
| `/login` | Public | Magic-link / OTP email login |
| `/auth/callback` | Public | Supabase Auth PKCE callback handler |
| `/access-denied` | Public | Shown on failed/unauthorised auth |
| `/dashboard` | Authenticated clients | Per-client project portal |
| `/dashboard/messages` | Authenticated clients | In-portal messaging |
| `/dashboard/files` | Authenticated clients | File download centre |
| `/dashboard/admin` | Admin only | Full client & project management |

---

## API Reference

All API routes live under `/api/` and are **server-side only**.

### Projects

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/projects?email=…` | Service role | Fetch a single client's project by email |
| `GET` | `/api/projects/list` | Service role | List all client projects (admin) |
| `POST` | `/api/projects/create` | Service role | Create a new client project record |
| `POST` | `/api/projects/update` | Service role | Update progress, invoice URL, or GitHub URL |

### Other

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/contact` | Submit landing-page enquiry |
| `GET/POST` | `/api/files` | Upload or list shared files |
| `GET/POST` | `/api/invoices` | Manage client invoices |
| `GET/POST` | `/api/messages` | Send or retrieve portal messages |
| `*` | `/api/auth` | Auth session helpers |

---

## Authentication

LancerLink uses **Supabase Magic Link / OTP** — no passwords required.

**Flow:**
1. Client enters their email on `/login`.
2. Supabase sends a one-time login link to that address.
3. Clicking the link redirects to `/auth/callback`, which exchanges the token for a session cookie.
4. The session cookie is validated on every protected route via the server-side Supabase client.

The browser client (`lib/supabase.js`) handles cookie-based session management using `@supabase/ssr`.

---

## Role System

| Role | How it's granted | Access |
|---|---|---|
| **Client** | Email matches a record in the `projects` table | `/dashboard` and sub-routes |
| **Admin** | Supabase user has the `is_admin` flag set to `true` in the DB | `/dashboard/admin` in addition to all client routes |

RLS policies in `supabase/schema.sql` ensure clients can only read their own data, regardless of which API path is called.

---

## Deployment

The recommended deployment platform is **[Vercel](https://vercel.com)**.

1. Push your repository to GitHub / GitLab / Bitbucket.
2. Import the project in Vercel.
3. Add all environment variables from `.env.example` to the Vercel project settings.
4. Vercel auto-detects Next.js — no additional configuration needed.
5. Update `NEXT_PUBLIC_SITE_URL` to your production domain.
6. Update the **Site URL** and **Redirect URLs** in your Supabase project settings to match your production domain.

> The project uses `next start` for production and `next dev --webpack` for local development (Webpack is preferred over Turbopack for compatibility with this version).

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on `http://localhost:3000` |
| `npm run build` | Build production bundle |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint across the codebase |

---

<p align="center">Built with ❤️ using Next.js & Supabase</p>
