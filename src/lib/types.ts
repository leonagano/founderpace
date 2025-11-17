export type Socials = {
  x_handle?: string;
  linkedin?: string;
  instagram?: string;
  website?: string;
};

import type { ObjectId } from "mongodb";

export type UserDoc = {
  _id?: ObjectId;
  strava_id: string;
  name: string;
  startup_name?: string;
  profile_image?: string;
  socials?: Socials;
  country?: string;
  created_at: string;
  updated_at?: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: number;
};

export type DailyActivity = {
  date: string; // YYYY-MM-DD
  start_time_local?: string;
  km: number;
  duration_seconds: number;
};

export type StatsDoc = {
  user_id: string;
  total_km: number;
  avg_pace: number;
  last_30d_km: number;
  last_30d_avg_pace: number;
  daily_activity: DailyActivity[];
  activity_heatmap?: number[][];
  computed_at: string;
};

export type LeaderboardEntry = {
  user_id: string;
  startup_name?: string;
  total_km: number;
  avg_pace: number;
  name: string;
  profile_image?: string;
};

export type LeaderboardCacheDoc = {
  period: LeaderboardPeriod;
  entries: LeaderboardEntry[];
  updated_at: string;
};

export const leaderboardPeriods = ["all_time", "year", "month", "week"] as const;
export type LeaderboardPeriod = (typeof leaderboardPeriods)[number];

