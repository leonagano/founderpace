# FounderPace — Challenges PRD

## Purpose
Introduce structured, Strava-verified challenges to increase repeat engagement, create sponsor inventory, and strengthen founder-to-founder identity loops.

## Core Rule
Participation requires an existing FounderPace profile. No profile → no challenge creation → no joining.

---

## 1. Challenge Model

**challenge**  
- _id  
- creator_user_id  
- title  
- description  
- ruleset_type (`distance_total`, `distance_recurring`, `duration_total`, `duration_recurring`, `frequency_based`)  
- ruleset_config:  
  - target_km  
  - target_minutes  
  - interval_days  
  - per_day_km  
  - per_day_minutes  
  - required_frequency  
- start_date  
- end_date  
- visibility (`public`, `invite_only`)  
- sponsor:  
  - name  
  - logo_url  
  - link  
  - prize_description  
- created_at

**challenge_participants**  
- challenge_id  
- user_id  
- joined_at  
- progress:  
  - km_completed  
  - minutes_completed  
  - attempts_log[]: daily km + minutes  
- completed (bool)

---

## 2. Allowed Challenge Types

**Distance total**  
Example: “Run 120 km in 30 days.”

**Distance recurring**  
Example: “5 km every day for 30 days.”

**Duration total**  
Example: “Run 600 minutes this month.”

**Duration recurring**  
Example: “30 minutes every 2 days.”

**Frequency-based**  
Example: “Run at least 3 times per week.”

These patterns cover ≥95% use cases while keeping validation deterministic.

No custom logic injection. No arbitrary rule builders. No multi-branch rules.

---

## 3. Challenge Creation Flow

1. User clicks **Create Challenge** (only if authenticated).  
2. Form fields:  
   - Title  
   - Description  
   - Challenge type selector  
   - Ruleset parameters (validated client-side and server-side)  
   - Start and end dates  
   - Visibility setting  
   - Optional sponsor block: name, link, prize description  
3. Save challenge  
4. Redirect to challenge page

---

## 4. Joining Flow

1. User clicks **Join**  
2. Check profile existence  
3. Insert into `challenge_participants`  
4. Backfill progress from Strava for all activities within challenge window  
5. Show dashboard view

---

## 5. Challenge Dashboard

**Leaderboard (per challenge)**  
- Rank  
- Participant name  
- Startup  
- Progress metric (km, minutes, or frequency %)  
- Completion indicator

**Progress Graph**  
- Line graph comparing expected trajectory vs actual

**Daily Log (readonly)**  
- Auto-generated from Strava  
- No manual edits

---

## 6. Sync Logic

Scheduled job every 6 hours:  
- Scan active challenges  
- For each participant:  
  - Pull Strava activities in window  
  - Recompute progress  
  - Mark completion if threshold hit  
- Update cached challenge leaderboard

---

## 7. API Endpoints

`POST /api/challenges`  
`GET /api/challenges/:id`  
`POST /api/challenges/:id/join`  
`GET /api/challenges/:id/leaderboard`  
`GET /api/challenges/:id/progress/:user_id`

All require auth except public challenge listing.

---

## 8. Frontend Pages

### 8.1 Explore Challenges  
- Active challenges  
- Upcoming challenges  
- Sponsored challenges

### 8.2 Challenge Detail  
- Title  
- Description  
- Sponsor block  
- Rules summary  
- Leaderboard  
- Participant progress  
- Join button or “Already joined”

### 8.3 Create Challenge  
- Simple structured form  
- No conditional builder UI  
- No nested rule complexity

---

## 9. Constraints

- Rules must map directly to Strava metrics (distance, moving_time, activity count).  
- No mixed-metric challenges.  
- No manual submissions.  
- No backdating creation; challenges start today or later.

---

## 10. MVP Scope

- Create challenge  
- Join challenge  
- Five rule patterns only  
- Progress sync  
- Challenge leaderboard  
- Sponsored block (text only)  
- No prize distribution system in MVP