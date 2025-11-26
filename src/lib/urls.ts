import { env } from "@/lib/env";

export const buildStravaAuthorizeUrl = (state?: string) => {
  const url = new URL("https://www.strava.com/oauth/authorize");
  url.searchParams.set("client_id", env.STRAVA_CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", env.STRAVA_REDIRECT_URI);
  url.searchParams.set("scope", "activity:read_all");
  url.searchParams.set("approval_prompt", "force");
  if (state) {
    url.searchParams.set("state", state);
  }
  return url.toString();
};

