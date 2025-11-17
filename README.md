## FounderPace

Public, Strava-verified leaderboard for founders who run. Built on Next.js App Router with MongoDB, serverless APIs, and Tailwind UI.

### Tech Stack

- Next.js 16 (App Router, Server Components)
- Tailwind CSS v4
- MongoDB (users, stats, leaderboard cache)
- Strava OAuth + Activities API
- Recharts for charts, SWR for client fetching

### Local Setup

1. Install dependencies

```bash
npm install
```

2. Create `.env.local` with the following keys:

```
MONGODB_URI=<connection string>
MONGODB_DB_NAME=founderpace
STRAVA_CLIENT_ID=<from Strava>
STRAVA_CLIENT_SECRET=<from Strava>
STRAVA_REDIRECT_URI=http://localhost:3000/oauth/callback
STRAVA_WEBHOOK_SECRET=<optional>
CRON_SECRET=<shared secret for scheduler endpoint>
ADVERTISE_URL=<stripe or other CTA url>
```

> In Strava’s app settings, set the authorization callback domain to match `STRAVA_REDIRECT_URI`.

3. Run the dev server

```bash
npm run dev
```

Visit `http://localhost:3000` for the leaderboard and `http://localhost:3000/founder/:id` for profile pages.

### Key API Routes

| Route | Method | Description |
| --- | --- | --- |
| `/api/oauth/strava/callback` | POST | Exchanges OAuth code, upserts user, triggers initial sync |
| `/api/user/socials` | POST | Stores public social links |
| `/api/sync/user/:id` | POST | Manual re-sync for a single user |
| `/api/leaderboard?period=` | GET | Returns cached leaderboard (all\_time, year, month, week) |
| `/api/user/:id` | GET | Fetches user and stats bundle |
| `/api/sync/scheduler` | POST | Cron endpoint that rebuilds leaderboard caches (requires `x-cron-secret`) |

### Background Sync

- Strava sync runs per user (triggered on OAuth and via `/api/sync/user/:id`).
- Leaderboard caches rebuild every six hours through Vercel Cron hitting `/api/sync/scheduler`.

### Linting

```bash
npm run lint
```

CI/CD should run `npm run build` and execute the lint step before deploying to Vercel.
