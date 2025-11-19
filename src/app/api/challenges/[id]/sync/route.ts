import { NextResponse } from "next/server";
import { syncChallengeParticipant } from "@/lib/challenge-sync-service";
import { getChallengeById } from "@/lib/repositories";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id: challengeId } = await params;
    const body = await req.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    // Verify challenge exists
    const challenge = await getChallengeById(challengeId);
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Sync the participant
    const result = await syncChallengeParticipant(challengeId, user_id);

    return NextResponse.json({
      ok: true,
      progress: result.progress,
      completed: result.completed,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to sync participant" },
      { status: 500 }
    );
  }
}

