import { env, clientEnv } from "./env";

const STRAVA_BASE = "https://www.strava.com/api/v3";
const tokensEndpoint = "https://www.strava.com/oauth/token";

export type StravaActivity = {
  id: number;
  type: string;
  start_date_local: string; // Local timezone timestamp
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: {
    id: number;
    firstname: string;
    lastname: string;
  };
};

// Can be called from client or server
export const buildStravaAuthorizeUrl = () => {
  const params = new URLSearchParams({
    client_id: clientEnv.STRAVA_CLIENT_ID,
    redirect_uri: clientEnv.STRAVA_REDIRECT_URI,
    response_type: "code",
    scope: "activity:read_all", // Read all activities (including private)
    approval_prompt: "force",
  });
  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
};

export const exchangeStravaCode = async (code: string): Promise<TokenResponse> => {
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

export const fetchStravaActivities2025 = async (accessToken: string): Promise<StravaActivity[]> => {
  const allActivities: StravaActivity[] = [];
  const startDate = "2025-01-01T00:00:00Z";
  const endDate = "2025-12-31T23:59:59Z";
  let page = 1;
  const perPage = 200;

  while (true) {
    const url = new URL(`${STRAVA_BASE}/athlete/activities`);
    url.searchParams.set("per_page", perPage.toString());
    url.searchParams.set("page", page.toString());
    url.searchParams.set("after", Math.floor(new Date(startDate).getTime() / 1000).toString());
    url.searchParams.set("before", Math.floor(new Date(endDate).getTime() / 1000).toString());

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch activities (${res.status})`);
    }

    const pageActivities = (await res.json()) as StravaActivity[];

    if (pageActivities.length === 0) {
      break;
    }

    allActivities.push(...pageActivities);

    if (pageActivities.length < perPage) {
      break;
    }

    page++;
  }

  // Filter to only activities within 2025 and group by local date
  return allActivities.filter((activity) => {
    const localDate = new Date(activity.start_date_local);
    return localDate >= new Date("2025-01-01") && localDate < new Date("2026-01-01");
  });
};

