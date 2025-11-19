import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { syncAllActiveChallenges } from "@/lib/challenge-sync-service";

export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("x-cron-secret");
    if (authHeader !== env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await syncAllActiveChallenges();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

