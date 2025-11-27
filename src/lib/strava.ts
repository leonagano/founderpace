import { env } from "@/lib/env";

const STRAVA_BASE = "https://www.strava.com/api/v3";

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: {
    id: number;
    firstname: string;
    lastname: string;
    profile: string;
    city?: string;
    state?: string;
    country?: string;
  };
};

type Activity = {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  start_date: string; // UTC timestamp
  start_date_local: string; // Local timezone
  type: string;
};

const tokensEndpoint = "https://www.strava.com/oauth/token";

export const exchangeStravaCode = async (code: string) => {
  const res = await fetch(tokensEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to exchange Strava code (${res.status})`);
  }
  return (await res.json()) as TokenResponse;
};

export const refreshStravaToken = async (refreshToken: string) => {
  const res = await fetch(tokensEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to refresh Strava token (${res.status})`);
  }
  return (await res.json()) as TokenResponse;
};

export const fetchStravaActivities = async (accessToken: string) => {
  const allActivities: Activity[] = [];
  const seenIds = new Set<number>(); // Track seen activity IDs to prevent duplicates
  let page = 1;
  const perPage = 200;

  while (true) {
    const url = new URL(`${STRAVA_BASE}/athlete/activities`);
    url.searchParams.set("per_page", perPage.toString());
    url.searchParams.set("page", page.toString());

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Only throw error if we have no activities
        // If we already have some activities (public ones), return them instead
        if (allActivities.length === 0) {
          const error: Error & { code: string; statusCode: number } = Object.assign(
            new Error("PRIVATE_ACTIVITIES_REQUIRED"),
            { code: "PRIVATE_ACTIVITIES_REQUIRED", statusCode: 401 }
          );
          throw error;
        }
        // We have some activities, so return what we have
        break;
      }
      throw new Error(`Failed to fetch activities (${res.status})`);
    }

    const pageActivities = (await res.json()) as Activity[];
    
    // If we got no results, we've reached the end
    if (pageActivities.length === 0) {
      break;
    }
    
    // Filter to only Run and VirtualRun activities, and deduplicate by ID
    const runs = pageActivities.filter(
      (activity) =>
        (activity.type === "Run" || activity.type === "VirtualRun") &&
        !seenIds.has(activity.id)
    );
    
    // Mark IDs as seen
    runs.forEach((activity) => seenIds.add(activity.id));
    
    allActivities.push(...runs);

    // If we got fewer than per_page results, we've reached the end
    if (pageActivities.length < perPage) {
      break;
    }

    // Move to next page
    page++;
  }

  return allActivities;
};

export type StravaActivity = Activity;

