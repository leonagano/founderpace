import { NextResponse } from "next/server";
import { getChallengeParticipant } from "@/lib/repositories";

type RouteParams = {
  params: Promise<{ id: string; userId: string }>;
};

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const { id: challengeId, userId } = await params;
    const participant = await getChallengeParticipant(challengeId, userId);
    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }
    return NextResponse.json({ progress: participant.progress, completed: participant.completed });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to fetch progress" }, { status: 500 });
  }
}

