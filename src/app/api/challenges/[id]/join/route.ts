import { NextResponse } from "next/server";
import { z } from "zod";
import { joinChallenge, getChallengeById, getUserById } from "@/lib/repositories";
import { syncChallengeParticipant } from "@/lib/challenge-sync-service";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const joinSchema = z.object({
  user_id: z.string(),
});

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id: challengeId } = await params;
    const json = await req.json();
    const { user_id } = joinSchema.parse(json);

    // Verify challenge exists
    const challenge = await getChallengeById(challengeId);
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Verify user exists (has profile)
    const user = await getUserById(user_id);
    if (!user) {
      return NextResponse.json(
        { error: "User profile not found. Please create a profile first." },
        { status: 400 }
      );
    }

    // Join challenge
    const participant = await joinChallenge(challengeId, user_id);

    // Backfill progress from Strava
    await syncChallengeParticipant(challengeId, user_id);

    return NextResponse.json({ participant });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Unable to join challenge" }, { status: 500 });
  }
}

