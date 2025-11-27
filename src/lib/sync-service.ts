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

  // Get existing stats to merge with new activities
  const existingStats = await getStatsForUser(userId);
  
  try {
    const activities = await fetchStravaActivities(accessToken!);
    const stats = buildStatsFromActivities(userId, activities, existingStats || undefined);
    await upsertStats(stats);
    return stats;
  } catch (error) {
    // Re-throw permission errors with a specific code
    if (
      error instanceof Error &&
      ((error as Error & { code?: string }).code === "PRIVATE_ACTIVITIES_REQUIRED" ||
        error.message === "PRIVATE_ACTIVITIES_REQUIRED")
    ) {
      const permissionError: Error & { code: string } = Object.assign(
        new Error("PRIVATE_ACTIVITIES_REQUIRED"),
        { code: "PRIVATE_ACTIVITIES_REQUIRED" }
      );
      throw permissionError;
    }
    throw error;
  }
};

export const ensureUserStats = async (userId: string) => {
  const stats = await getStatsForUser(userId);
  if (stats) return stats;
  return syncUserFromStrava(userId);
};

