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
  synced_activity_ids?: number[]; // Track which Strava activity IDs have been synced
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

// Challenge Types
export const challengeRulesetTypes = [
  "distance_total",
  "distance_recurring",
  "duration_total",
  "duration_recurring",
  "frequency_based",
] as const;
export type ChallengeRulesetType = (typeof challengeRulesetTypes)[number];

export type ChallengeRulesetConfig = {
  target_km?: number;
  target_minutes?: number;
  interval_days?: number;
  per_day_km?: number;
  per_day_minutes?: number;
  required_frequency?: number; // times per week
};

export type ChallengeSponsor = {
  name?: string;
  logo_url?: string;
  link?: string;
  prize_description?: string;
};

export type ChallengeDoc = {
  _id?: ObjectId;
  creator_user_id: string;
  title: string;
  description: string;
  ruleset_type: ChallengeRulesetType;
  ruleset_config: ChallengeRulesetConfig;
  start_date: string; // ISO date
  end_date: string; // ISO date
  sponsor?: ChallengeSponsor;
  created_at: string;
};

export type ChallengeAttemptLog = {
  date: string; // YYYY-MM-DD
  km: number;
  minutes: number;
  completed?: boolean; // Whether this day met the requirement
};

export type ChallengeParticipantProgress = {
  km_completed: number;
  minutes_completed: number;
  attempts_log: ChallengeAttemptLog[];
  daily_status?: Record<string, boolean>; // date -> completed (true/false)
};

export type ChallengeParticipantDoc = {
  _id?: ObjectId;
  challenge_id: string;
  user_id: string;
  joined_at: string;
  progress: ChallengeParticipantProgress;
  completed: boolean;
};

export type ChallengeLeaderboardEntry = {
  user_id: string;
  name: string;
  startup_name?: string;
  profile_image?: string;
  progress_metric: number; // km, minutes, or frequency %
  completed: boolean;
  daily_status?: Record<string, boolean>; // date -> completed (true/false)
};

