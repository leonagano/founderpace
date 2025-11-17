import { NextResponse } from "next/server";
import { rebuildAllLeaderboards } from "@/lib/leaderboard-service";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (env.CRON_SECRET && secret !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await rebuildAllLeaderboards();
  return NextResponse.json({ ok: true });
}

