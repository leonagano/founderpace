import { NextResponse } from "next/server";
import { syncChallengeParticipant } from "@/lib/challenge-sync-service";
import { getChallengeById, getChallengeParticipants } from "@/lib/repositories";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id: challengeId } = await params;

    // Verify challenge exists
    const challenge = await getChallengeById(challengeId);
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Get all participants
    const participants = await getChallengeParticipants(challengeId);

    // Sync each participant
    const results = [];
    for (const participant of participants) {
      try {
        const result = await syncChallengeParticipant(challengeId, participant.user_id);
        results.push({
          user_id: participant.user_id,
          success: true,
          progress: result.progress,
          completed: result.completed,
        });
      } catch (error) {
        results.push({
          user_id: participant.user_id,
          success: false,
          error: error instanceof Error ? error.message : "Sync failed",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      synced: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to sync participants" },
      { status: 500 }
    );
  }
}

