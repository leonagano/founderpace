import { getStatsForUser, getUserById, upsertStats, upsertUser } from "@/lib/repositories";
import { buildStatsFromActivities } from "@/lib/stats-service";
import { fetchStravaActivities, refreshStravaToken } from "@/lib/strava";

const isExpired = (expiresAt?: number) => {
  if (!expiresAt) return true;
  const now = Math.floor(Date.now() / 1000);
  return expiresAt <= now + 60;
};

export const syncUserFromStrava = async (userId: string) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  let accessToken = user.access_token;
  let refreshToken = user.refresh_token;
  let expiresAt = user.token_expires_at;

  if (!accessToken || isExpired(expiresAt)) {
    if (!refreshToken) {
      throw new Error("Missing Strava tokens");
    }
    const refreshed = await refreshStravaToken(refreshToken);
    accessToken = refreshed.access_token;
    refreshToken = refreshed.refresh_token;
    expiresAt = refreshed.expires_at;
    await upsertUser({
      ...user,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_expires_at: expiresAt,
    });
  }

  const activities = await fetchStravaActivities(accessToken!);
  const stats = buildStatsFromActivities(userId, activities);
  await upsertStats(stats);
  return stats;
};

export const ensureUserStats = async (userId: string) => {
  const stats = await getStatsForUser(userId);
  if (stats) return stats;
  return syncUserFromStrava(userId);
};

