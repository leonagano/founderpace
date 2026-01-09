import { NextRequest, NextResponse } from "next/server";
import { fetchStravaActivitiesForYear } from "@/lib/strava";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
  }

  const accessToken = authHeader.substring(7);
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  // Validate year (reasonable range: 2010 to current year + 1)
  const currentYear = new Date().getFullYear();
  if (isNaN(year) || year < 2010 || year > currentYear + 1) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  try {
    const activities = await fetchStravaActivitiesForYear(accessToken, year);
    return NextResponse.json({ activities, year });
  } catch (error) {
    console.error("Failed to fetch activities:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

