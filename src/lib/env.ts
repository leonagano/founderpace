import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().min(1),
  MONGODB_DB_NAME: z.string().default("founderpace"),
  STRAVA_CLIENT_ID: z.string().min(1),
  STRAVA_CLIENT_SECRET: z.string().min(1),
  STRAVA_REDIRECT_URI: z.string().url(),
  STRAVA_WEBHOOK_SECRET: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  ADVERTISE_URL: z.string().url().optional(),
});

declare global {
  var __env__: z.infer<typeof envSchema> | undefined;
}

const rawEnv = {
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
  STRAVA_CLIENT_ID: process.env.STRAVA_CLIENT_ID,
  STRAVA_CLIENT_SECRET: process.env.STRAVA_CLIENT_SECRET,
  STRAVA_REDIRECT_URI: process.env.STRAVA_REDIRECT_URI,
  STRAVA_WEBHOOK_SECRET: process.env.STRAVA_WEBHOOK_SECRET,
  CRON_SECRET: process.env.CRON_SECRET,
  ADVERTISE_URL: process.env.ADVERTISE_URL,
};

export const env =
  global.__env__ ??
  (() => {
    const parsed = envSchema.safeParse(rawEnv);
    if (!parsed.success) {
      console.error(parsed.error.flatten().fieldErrors);
      throw new Error("Invalid environment variables");
    }
    global.__env__ = parsed.data;
    return parsed.data;
  })();

export type AppEnv = typeof env;

