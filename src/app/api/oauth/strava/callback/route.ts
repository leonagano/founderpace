import { NextResponse } from "next/server";
import { exchangeStravaCode } from "@/lib/strava";
import { syncUserFromStrava } from "@/lib/sync-service";
import { upsertUser } from "@/lib/repositories";

export async function POST(request: Request) {
  try {
    const { code, startupName } = await request.json();
    if (!code) {
      return NextResponse.json({ error: "Missing OAuth code" }, { status: 400 });
    }
    const tokenResponse = await exchangeStravaCode(code);
    const athlete = tokenResponse.athlete;
    const fullName = `${athlete.firstname ?? ""} ${athlete.lastname ?? ""}`.trim();

    const userDoc = await upsertUser({
      strava_id: String(athlete.id),
      name: fullName || "Founding Runner",
      startup_name: startupName,
      profile_image: athlete.profile,
      country: athlete.country,
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      token_expires_at: tokenResponse.expires_at,
      created_at: new Date().toISOString(),
    });

    if (!userDoc) {
      throw new Error("Unable to persist user: userDoc is null");
    }

    const userId = userDoc._id?.toString();
    if (!userId) {
      console.error("User document missing _id:", JSON.stringify(userDoc, null, 2));
      throw new Error("Unable to persist user: missing _id");
    }

    await syncUserFromStrava(userId);

    return NextResponse.json({ userId });
  } catch (error) {
    console.error("OAuth callback error:", error);
    
    // Check if this is a permission error - check code, message, or error string
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = error instanceof Error ? (error as Error & { code?: string }).code : undefined;
    
    const isPermissionError =
      errorCode === "PRIVATE_ACTIVITIES_REQUIRED" ||
      errorMessage === "PRIVATE_ACTIVITIES_REQUIRED" ||
      errorMessage.includes("Failed to fetch activities (401)");
    
    if (isPermissionError) {
      console.log("Detected permission error (401), returning 403");
      return NextResponse.json(
        { error: "PRIVATE_ACTIVITIES_REQUIRED", message: "Please enable 'View data about your private activities' permission in Strava" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to complete Strava onboarding" },
      { status: 500 }
    );
  }
}

