import { NextRequest, NextResponse } from "next/server";
import { fetchStravaActivities2025 } from "@/lib/strava";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
  }

  const accessToken = authHeader.substring(7);

  try {
    const activities = await fetchStravaActivities2025(accessToken);
    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Failed to fetch activities:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

