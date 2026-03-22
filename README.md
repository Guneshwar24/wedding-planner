# Shaadi Brain

A private, invite-only wedding planning app for managing tasks, expenses, and family coordination across wedding functions.

---

## Features

- **Magic-link login** — no passwords, no OTPs; whitelisted emails get instant access
- **Wedding functions** — create and customise events (Sangeet, Mehendi, Haldi, etc.) with names and colours
- **Tasks with sub-tasks** — assign tasks to a function and person, add a checklist of sub-tasks, track status (Pending → In Progress → Done)
- **Expenses** — log expenses per function, track budgets with charts
- **People** — add family members; optionally whitelist their email so they can log in
- **Admin panel** — manage the login whitelist

---

## Architecture

```
wedding-planner/
├── frontend/          # React SPA (Vite)
└── supabase/
    ├── schema.sql     # Full database schema (idempotent, safe to re-run)
    └── functions/
        └── instant-login/   # Deno edge function — magic-link generator
```

### Frontend (`frontend/`)

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite |
| Routing | React Router v7 |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Icons | Lucide React |
| Charts | Recharts |
| Toasts | Sonner |
| DB client | `@supabase/supabase-js` |

**Pages**

| Route | Page | Description |
|---|---|---|
| `/login` | `LoginPage` | Email entry, triggers magic-link login |
| `/` | `DashboardPage` | Task progress rings, upcoming tasks, budget pie charts |
| `/tasks` | `TasksPage` | Create/edit/delete tasks, sub-tasks, filter by event or person |
| `/expenses` | `ExpensesPage` | Log expenses, set budgets per function |
| `/settings` | `SettingsPage` | Edit profile, manage people and wedding functions |
| `/admin` | `AdminPage` | Manage login whitelist (admin only) |

**Auth flow**

1. User enters email on `/login`
2. Frontend calls the `instant-login` edge function
3. Edge function checks the whitelist, generates a Supabase magic link (no email sent)
4. Frontend navigates to the `action_link` URL
5. Supabase verifies the token server-side, redirects back to the app
6. Supabase JS SDK picks up the session; `onAuthStateChange` fires
7. A DB trigger (`handle_new_user`) auto-creates the user's profile on first login

### Backend (Supabase)

**Tables**

| Table | Purpose |
|---|---|
| `profiles` | One row per logged-in user — name, email, `is_admin` |
| `whitelisted_emails` | Access control — only listed emails can log in |
| `events` | Wedding functions (Sangeet, Mehendi, etc.) with colour and budget |
| `family_members` | People who can be assigned tasks; optional email for login |
| `tasks` | Planning tasks — linked to an event and person, with sub-tasks (JSONB) |
| `expenses` | Expense entries per function |

**Row Level Security**

All tables have RLS enabled. Authenticated users can read/write shared tables (`events`, `family_members`, `tasks`, `expenses`). Only admins can access `whitelisted_emails`. Users can only edit their own `profiles` row.

**Edge function** (`supabase/functions/instant-login/`)

Deno function deployed on Supabase. Accepts `{ email, redirect_to }`, checks the whitelist, calls `auth.admin.generateLink()`, and returns the `action_link`. No email is ever sent — the link is used directly.

---

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A [Supabase](https://supabase.com/) project (free tier works)
- A [Vercel](https://vercel.com/) account (or any static host)

### 1 — Supabase project

1. Create a new project at [supabase.com](https://supabase.com/)
2. Go to **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql)
   This creates all tables, RLS policies, the auth trigger, and seeds the default events
3. In the schema file, update the admin email before running:
   ```sql
   insert into whitelisted_emails (email, name, is_admin) values
     ('your@email.com', 'Your Name', true)
   on conflict (email) do nothing;
   ```

### 2 — Deploy the edge function

1. Open your Supabase project → **Edge Functions** → **New Function**
2. Name it `instant-login`
3. Paste the contents of [`supabase/functions/instant-login/index.ts`](supabase/functions/instant-login/index.ts)
4. Deploy

### 3 — Configure Supabase Auth

In your Supabase project → **Authentication** → **URL Configuration**:

- **Site URL**: your app's URL (e.g. `https://your-app.vercel.app`)
- **Redirect URLs**: add both your production URL and `http://localhost:5173` for local dev

### 4 — Frontend environment variables

Create `frontend/.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Find these in Supabase → **Project Settings** → **API**.

### 5 — Run locally

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

### 6 — Deploy to Vercel

1. Push the repo to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Vercel auto-detects the config from `vercel.json` — no extra build settings needed
4. Add environment variables in Vercel → **Settings** → **Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy

---

## Adding people

In the app → **Settings** → **People** → tap `+`:

- **Name** (required)
- **Email** (optional) — if provided, automatically added to the login whitelist so they can access the app

---

## Database schema changes

`schema.sql` uses `IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS` throughout, so it is safe to re-run against an existing database. To apply a new column or table, run the relevant statement directly in the Supabase SQL editor.
