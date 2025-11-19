import { parseISO, isWithinInterval, format, eachDayOfInterval, isBefore, isAfter } from "date-fns";
import {
  getChallengeById,
  getChallengeParticipant,
  updateChallengeParticipantProgress,
  getUserById,
} from "@/lib/repositories";
import { fetchStravaActivities, refreshStravaToken } from "@/lib/strava";
import type { ChallengeAttemptLog, ChallengeParticipantProgress } from "@/lib/types";

const isExpired = (expiresAt?: number) => {
  if (!expiresAt) return true;
  const now = Math.floor(Date.now() / 1000);
  return expiresAt <= now + 60;
};

export const syncChallengeParticipant = async (challengeId: string, userId: string) => {
  const challenge = await getChallengeById(challengeId);
  if (!challenge) {
    throw new Error("Challenge not found");
  }

  const user = await getUserById(userId);
  if (!user || !user.access_token) {
    throw new Error("User not found or missing Strava tokens");
  }

  let accessToken = user.access_token;
  let refreshToken = user.refresh_token;
  let expiresAt = user.token_expires_at;

  if (isExpired(expiresAt)) {
    if (!refreshToken) {
      throw new Error("Missing Strava refresh token");
    }
    const refreshed = await refreshStravaToken(refreshToken);
    accessToken = refreshed.access_token;
    refreshToken = refreshed.refresh_token;
    expiresAt = refreshed.expires_at;
  }

  // Fetch activities
  const activities = await fetchStravaActivities(accessToken!);

  // Filter activities within challenge window
  const startDate = parseISO(challenge.start_date);
  const endDate = parseISO(challenge.end_date);

  const challengeActivities = activities.filter((activity) => {
    const activityDate = parseISO(activity.start_date_local.split("T")[0]);
    return isWithinInterval(activityDate, { start: startDate, end: endDate });
  });

  // Build attempts log grouped by date
  const attemptsByDate = new Map<string, { km: number; minutes: number }>();

  for (const activity of challengeActivities) {
    const date = format(parseISO(activity.start_date_local), "yyyy-MM-dd");
    const existing = attemptsByDate.get(date) || { km: 0, minutes: 0 };
    attemptsByDate.set(date, {
      km: existing.km + activity.distance / 1000, // Convert meters to km
      minutes: existing.minutes + Math.floor(activity.moving_time / 60),
    });
  }

  // Build attempts log array with completion status
  const attempts_log: ChallengeAttemptLog[] = Array.from(attemptsByDate.entries()).map(
    ([date, data]) => ({
      date,
      km: data.km,
      minutes: data.minutes,
    })
  );

  // Calculate totals
  const km_completed = attempts_log.reduce((sum, log) => sum + log.km, 0);
  const minutes_completed = attempts_log.reduce((sum, log) => sum + log.minutes, 0);

  // Build daily status map for recurring challenges
  const daily_status: Record<string, boolean> = {};
  const { ruleset_type, ruleset_config } = challenge;
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");

  // For recurring challenges, check each day
  if (ruleset_type === "distance_recurring" || ruleset_type === "duration_recurring") {
    const intervalDays = ruleset_config.interval_days || 1;
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Only check days up to today (can't check future days)
    const daysToCheck = allDays.filter((day) => !isAfter(day, now));

    for (const day of daysToCheck) {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayAttempt = attemptsByDate.get(dateStr);
      
      if (ruleset_type === "distance_recurring") {
        const requiredKm = ruleset_config.per_day_km || 0;
        // Check if this day is part of the interval pattern
        const daysSinceStart = Math.floor(
          (day.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const isRequiredDay = daysSinceStart % intervalDays === 0;
        
        if (isRequiredDay) {
          daily_status[dateStr] = dayAttempt ? dayAttempt.km >= requiredKm : false;
        }
      } else if (ruleset_type === "duration_recurring") {
        const requiredMinutes = ruleset_config.per_day_minutes || 0;
        const daysSinceStart = Math.floor(
          (day.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const isRequiredDay = daysSinceStart % intervalDays === 0;
        
        if (isRequiredDay) {
          daily_status[dateStr] = dayAttempt ? dayAttempt.minutes >= requiredMinutes : false;
        }
      }
    }

    // Update attempts_log with completion status
    attempts_log.forEach((log) => {
      if (daily_status[log.date] !== undefined) {
        log.completed = daily_status[log.date];
      }
    });
  }

  // Check completion based on ruleset type
  let completed = false;

  if (ruleset_type === "distance_total") {
    completed = km_completed >= (ruleset_config.target_km || 0);
  } else if (ruleset_type === "distance_recurring") {
    // Check if all required days (up to today) are completed
    const requiredDays = Object.keys(daily_status).length;
    const completedDays = Object.values(daily_status).filter(Boolean).length;
    completed = requiredDays > 0 && completedDays === requiredDays;
  } else if (ruleset_type === "duration_total") {
    completed = minutes_completed >= (ruleset_config.target_minutes || 0);
  } else if (ruleset_type === "duration_recurring") {
    const requiredDays = Object.keys(daily_status).length;
    const completedDays = Object.values(daily_status).filter(Boolean).length;
    completed = requiredDays > 0 && completedDays === requiredDays;
  } else if (ruleset_type === "frequency_based") {
    const weeks = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    const requiredRuns = (ruleset_config.required_frequency || 0) * weeks;
    completed = attempts_log.length >= requiredRuns;
  }

  const progress: ChallengeParticipantProgress = {
    km_completed,
    minutes_completed,
    attempts_log,
    daily_status: Object.keys(daily_status).length > 0 ? daily_status : undefined,
  };

  await updateChallengeParticipantProgress(challengeId, userId, progress, completed);
  return { progress, completed };
};

export const syncAllActiveChallenges = async () => {
  const { getActiveChallenges, getChallengeParticipants } = await import("@/lib/repositories");
  const activeChallenges = await getActiveChallenges();

  for (const challenge of activeChallenges) {
    if (!challenge._id) continue;
    const participants = await getChallengeParticipants(challenge._id.toString());
    for (const participant of participants) {
      try {
        await syncChallengeParticipant(challenge._id.toString(), participant.user_id);
      } catch (error) {
        console.error(
          `Failed to sync participant ${participant.user_id} for challenge ${challenge._id}:`,
          error
        );
      }
    }
  }
};

