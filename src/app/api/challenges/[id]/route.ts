import { NextResponse } from "next/server";
import { getChallengeById } from "@/lib/repositories";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const challenge = await getChallengeById(id);
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }
    return NextResponse.json({ challenge });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to fetch challenge" }, { status: 500 });
  }
}

