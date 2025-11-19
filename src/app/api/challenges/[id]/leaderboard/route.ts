import { NextResponse } from "next/server";
import { getChallengeLeaderboard } from "@/lib/repositories";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const leaderboard = await getChallengeLeaderboard(id);
    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to fetch leaderboard" }, { status: 500 });
  }
}

