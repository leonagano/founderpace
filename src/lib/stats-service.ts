import { differenceInDays, parseISO } from "date-fns";
import { StravaActivity } from "@/lib/strava";
import { DailyActivity, StatsDoc } from "@/lib/types";

const metersToKm = (meters: number) => meters / 1000;

const buildHeatmapMatrix = () => Array.from({ length: 7 }, () => Array(24).fill(0));

export const buildStatsFromActivities = (
  userId: string,
  activities: StravaActivity[]
): StatsDoc => {
  // Filter to only Run and VirtualRun (though strava.ts already filters these)
  // Also deduplicate by activity ID as a safety measure
  const seenIds = new Set<number>();
  const runs = activities.filter((a) => {
    if (seenIds.has(a.id)) return false;
    seenIds.add(a.id);
    return a.type === "Run" || a.type === "VirtualRun";
  });
  const heatmap = buildHeatmapMatrix();

  const daily_activity: DailyActivity[] = runs
    .map((activity) => {
      const km = metersToKm(activity.distance);
      // Use start_date_local which Strava provides in the user's timezone at time of activity
      // Format: "YYYY-MM-DDTHH:mm:ss" (local time, no timezone)
      const startLocal = activity.start_date_local;
      const date = startLocal.split("T")[0];

      // Parse the local time string directly - don't use Date() as it converts to server timezone
      // Extract hour and day directly from the ISO string
      const timePart = startLocal.split("T")[1]; // "HH:mm:ss"
      const hour = parseInt(timePart.split(":")[0], 10);
      
      // For day of week, we need to parse the date, but use UTC methods to avoid timezone conversion
      // Parse date as YYYY-MM-DD and get day of week
      const [year, month, dayOfMonth] = date.split("-").map(Number);
      const dt = new Date(Date.UTC(year, month - 1, dayOfMonth));
      const day = dt.getUTCDay();
      
      heatmap[day][hour] = Number((heatmap[day][hour] + km).toFixed(2));

      return {
        date,
        start_time_local: startLocal,
        km: Number(km.toFixed(2)),
        duration_seconds: Math.round(activity.moving_time),
      };
    })
    .sort((a, b) => (a.start_time_local ?? "").localeCompare(b.start_time_local ?? ""));

  const totals = daily_activity.reduce(
    (acc, entry) => {
      acc.km += entry.km;
      acc.duration += entry.duration_seconds;
      if (differenceInDays(new Date(), parseISO(entry.date)) <= 30) {
        acc.last30Km += entry.km;
        acc.last30Duration += entry.duration_seconds;
      }
      return acc;
    },
    { km: 0, duration: 0, last30Km: 0, last30Duration: 0 }
  );

  const avgPace = totals.km > 0 ? totals.duration / totals.km : 0;
  const last30Avg = totals.last30Km > 0 ? totals.last30Duration / totals.last30Km : 0;

  return {
    user_id: userId,
    total_km: Number(totals.km.toFixed(2)),
    avg_pace: Number(avgPace.toFixed(2)),
    last_30d_km: Number(totals.last30Km.toFixed(2)),
    last_30d_avg_pace: Number(last30Avg.toFixed(2)),
    daily_activity,
    activity_heatmap: heatmap,
    computed_at: new Date().toISOString(),
  };
};

