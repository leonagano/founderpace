import { differenceInMinutes, parseISO } from "date-fns";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongo";
import type { StatsDoc, UserDoc } from "@/lib/types";
import {
  LeaderboardEntry,
  LeaderboardPeriod,
  leaderboardPeriods,
} from "@/lib/types";
import {
  getLeaderboardCache,
  updateLeaderboardCache,
} from "@/lib/repositories";
import { getPeriodStart } from "@/lib/periods";

const CACHE_TTL_MINUTES = 30;

const isCacheFresh = (updatedAt?: string) => {
  if (!updatedAt) return false;
  return differenceInMinutes(new Date(), parseISO(updatedAt)) < CACHE_TTL_MINUTES;
};

const hydrateEntries = async (period: LeaderboardPeriod) => {
  const db = await getDb();
  const stats = await db.collection<StatsDoc>("stats").find().toArray();
  
  if (stats.length === 0) {
    return [];
  }

  // Convert user_id strings to ObjectIds, filtering out invalid ones
  const userIds = stats
    .map((stat) => {
      try {
        return new ObjectId(stat.user_id);
      } catch {
        return null;
      }
    })
    .filter((id): id is ObjectId => id !== null);

  if (userIds.length === 0) {
    return [];
  }

  const users = await db
    .collection<UserDoc>("users")
    .find({ _id: { $in: userIds } })
    .toArray();

  const userMap = new Map(users.map((user) => [user._id?.toString() ?? "", user]));
  const periodStart = getPeriodStart(period);

  const entries: LeaderboardEntry[] = stats
    .map((stat) => {
      const user = userMap.get(stat.user_id);
      if (!user) {
        console.warn(`User not found for stat.user_id: ${stat.user_id}`);
        return undefined;
      }
      const daily = stat.daily_activity ?? [];
      const periodAgg = daily.reduce(
        (acc, day) => {
          const date = parseISO(day.date);
          if (date >= periodStart) {
            acc.km += day.km;
            acc.duration += day.duration_seconds;
          }
          return acc;
        },
        { km: 0, duration: 0 }
      );
      const total_km = period === "all_time" ? stat.total_km : periodAgg.km;
      const avg_pace =
        period === "all_time"
          ? stat.avg_pace
          : periodAgg.km > 0
            ? Number((periodAgg.duration / periodAgg.km).toFixed(2))
            : 0;
      return {
        user_id: stat.user_id,
        slug: user.slug,
        name: user.name,
        startup_name: user.startup_name,
        profile_image: user.profile_image,
        total_km: Number(total_km.toFixed(2)),
        avg_pace,
      } satisfies LeaderboardEntry;
    })
    .filter(Boolean) as LeaderboardEntry[];

  return entries
    .sort((a, b) => {
      if (b.total_km !== a.total_km) return b.total_km - a.total_km;
      return a.avg_pace - b.avg_pace;
    })
    .slice(0, 200);
};

export const getLeaderboard = async (period: LeaderboardPeriod) => {
  const cache = await getLeaderboardCache(period);
  if (cache && isCacheFresh(cache.updated_at) && cache.entries.length > 0) {
    return cache.entries;
  }
  const entries = await hydrateEntries(period);
  await updateLeaderboardCache(period, entries);
  return entries;
};

export const rebuildAllLeaderboards = async () => {
  for (const period of leaderboardPeriods) {
    const entries = await hydrateEntries(period);
    await updateLeaderboardCache(period, entries);
  }
};

