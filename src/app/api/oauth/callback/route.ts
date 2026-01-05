import { NextResponse } from "next/server";
import { exchangeStravaCode } from "@/lib/strava";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", request.url));
  }

  try {
    const tokenResponse = await exchangeStravaCode(code);
    
    // Return token data to frontend via query params (will be stored in sessionStorage)
    const params = new URLSearchParams({
      access_token: tokenResponse.access_token,
      expires_at: tokenResponse.expires_at.toString(),
    });

    return NextResponse.redirect(new URL(`/?${params.toString()}`, request.url));
  } catch (error) {
    console.error("Strava OAuth error:", error);
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent("Failed to authenticate with Strava")}`, request.url)
    );
  }
}

