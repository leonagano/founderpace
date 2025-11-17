# FounderPace — PRD

## Core Thesis
Public, identity-driven leaderboard for founders who run. Strava-verified metrics only.

## System Architecture
- Hosting: Vercel  
- Backend: Vercel serverless functions  
- DB: MongoDB  
- Auth: Strava OAuth  
- Charts: Client-side  
- Heatmap: Client-side grid  
- Sync: Scheduled pulls

---

## 1. User Flows

### 1.1 Landing → OAuth  
- User clicks “Add me”  
- Strava OAuth  
- Callback fetches athlete + stats  
- User sets optional socials  
- Redirect to leaderboard

### 1.2 Leaderboard → Profile  
- Click on row → detail page

### 1.3 Strava Sync  
- Automated pull every 6 hours  
- Aggregate metrics  
- Update leaderboard cache

### 1.4 Advertise  
- Sidebar button → Stripe link

---

## 2. Data Model

### 2.1 Collections

**users**  
- _id  
- strava_id  
- name  
- startup_name  
- profile_image  
- socials: x_handle, linkedin, instagram, website  
- created_at

**stats**  
- user_id  
- total_km  
- avg_pace  
- last_30d_km  
- last_30d_avg_pace  
- daily_activity[]: date, km, duration_seconds  
- computed_at

**leaderboard_cache**  
- period  
- entries[]: user_id, startup_name, total_km, avg_pace  
- updated_at

---

## 3. Pages

### 3.1 Homepage (Leaderboard)

**Columns**  
- Rank  
- Founder (name + avatar)  
- Startup Name  
- Kms Run  
- Avg Pace  

**Filters**  
- All time  
- This year  
- This month  
- This week  

**Actions**  
- “Add me” → Strava OAuth  
- Sidebar: Advertise (Stripe)

**Ordering**  
- Default: Total KM desc  
- Tie-break: Avg pace asc

---

### 3.2 Founder Detail Page

**Header**  
- Avatar  
- Founder Name  
- Startup Name  
- Social links

**Stats Grid**  
- Total KM  
- Last 30 Days KM  
- Avg Pace  
- Country (from Strava)

**Charts**  
- Line/area chart: KM over time  
- Heatmap: day × hour grid

---

## 4. Strava Integration

### 4.1 OAuth  
- Exchange code → tokens  
- Fetch athlete profile  
- Upsert user  
- Trigger initial sync

### 4.2 Activity Sync  
- Pull `/athlete/activities`  
- Extract distance, moving_time, start_date_local  
- Compute km and pace  
- Aggregate daily/monthly totals

---

## 5. Backend Endpoints

- `POST /api/oauth/strava/callback`  
- `POST /api/user/socials`  
- `POST /api/sync/user/:id`  
- `GET /api/leaderboard?period=`  
- `GET /api/user/:id`

---

## 6. Background Jobs

- Sync scheduler every 6 hours  
- Update stats  
- Rebuild leaderboard cache

---

## 7. Frontend Components

- LeaderboardTable  
- ProfileStatsGrid  
- HeatmapGrid

---

## 8. Visual Style

- Neutral sans-serif  
- Light background, high-contrast text  
- Single accent color for charts  
- Tight spacing

---

## 9. Security & Privacy

- Only Strava metrics + optional public socials  
- No private activity data stored

---

## 10. MVP Scope

- OAuth  
- Sync engine  
- Leaderboard with 4 periods  
- Detail page  
- Heatmap  
- Advertise button  
- Minimal onboarding