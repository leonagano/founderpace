import { differenceInDays, parseISO } from "date-fns";
import { StravaActivity } from "@/lib/strava";
import { DailyActivity, StatsDoc } from "@/lib/types";

const metersToKm = (meters: number) => meters / 1000;

const buildHeatmapMatrix = () => Array.from({ length: 7 }, () => Array(24).fill(0));

export const buildStatsFromActivities = (
  userId: string,
  activities: StravaActivity[],
  existingStats?: StatsDoc
): StatsDoc => {
  // Filter to only Run and VirtualRun (though strava.ts already filters these)
  // Also deduplicate by activity ID as a safety measure
  const seenIds = new Set<number>();
  const existingActivityIds = new Set(existingStats?.synced_activity_ids || []);
  
  // If we have existing stats, only process new activities
  const activitiesToProcess = existingStats
    ? activities.filter((a) => !existingActivityIds.has(a.id))
    : activities;
  
  const runs = activitiesToProcess.filter((a) => {
    if (seenIds.has(a.id)) return false;
    seenIds.add(a.id);
    return a.type === "Run" || a.type === "VirtualRun";
  });
  
  // Get existing daily_activity to merge with
  const existingDailyActivity = existingStats?.daily_activity || [];

  // Process new runs (these are guaranteed to be new since we filtered by activity ID)
  const newDailyActivities: DailyActivity[] = runs.map((activity) => {
    const km = metersToKm(activity.distance);
    const startLocal = activity.start_date_local;
    const date = startLocal.split("T")[0];
    
    return {
      date,
      start_time_local: startLocal,
      km: Number(km.toFixed(2)),
      duration_seconds: Math.round(activity.moving_time),
    };
  });

  // Merge new activities with existing ones (new activities are appended)
  const daily_activity = [...existingDailyActivity, ...newDailyActivities].sort((a, b) =>
    (a.start_time_local ?? "").localeCompare(b.start_time_local ?? "")
  );
  
  // Rebuild heatmap from merged daily_activity
  const heatmap = buildHeatmapMatrix();
  for (const entry of daily_activity) {
    const startLocal = entry.start_time_local || "";
    const date = entry.date;
    const timePart = startLocal.split("T")[1];
    const hour = timePart ? parseInt(timePart.split(":")[0], 10) : 0;
    const [year, month, dayOfMonth] = date.split("-").map(Number);
    const dt = new Date(Date.UTC(year, month - 1, dayOfMonth));
    const day = dt.getUTCDay();
    heatmap[day][hour] = Number((heatmap[day][hour] + entry.km).toFixed(2));
  }
  
  // Update synced activity IDs
  const newActivityIds = runs.map((a) => a.id);
  const synced_activity_ids = existingStats?.synced_activity_ids
    ? [...existingStats.synced_activity_ids, ...newActivityIds]
    : newActivityIds;

  // Calculate totals from merged daily_activity
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
    synced_activity_ids,
  };
};

