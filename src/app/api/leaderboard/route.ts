import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/leaderboard-service";
import { LeaderboardPeriod, leaderboardPeriods } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") ?? "all_time") as LeaderboardPeriod;

  if (!leaderboardPeriods.includes(period)) {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }

  try {
    const entries = await getLeaderboard(period);
    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard", entries: [] },
      { status: 500 }
    );
  }
}

