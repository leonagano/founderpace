// Server-side only (for API routes)
export const env = {
  STRAVA_CLIENT_ID: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID || process.env.STRAVA_CLIENT_ID || "",
  STRAVA_CLIENT_SECRET: process.env.STRAVA_CLIENT_SECRET || "",
  STRAVA_REDIRECT_URI: process.env.NEXT_PUBLIC_STRAVA_REDIRECT_URI || process.env.STRAVA_REDIRECT_URI || (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}/api/oauth/strava/callback`
    : "http://localhost:3000/api/oauth/strava/callback"),
};

// Client-side accessible
export const clientEnv = {
  STRAVA_CLIENT_ID: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID || "",
  STRAVA_REDIRECT_URI: process.env.NEXT_PUBLIC_STRAVA_REDIRECT_URI || (typeof window !== "undefined"
    ? `${window.location.origin}/api/oauth/strava/callback`
    : "http://localhost:3000/api/oauth/strava/callback"),
};

