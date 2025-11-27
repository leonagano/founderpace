import { NextResponse } from "next/server";
import { buildStravaAuthorizeUrl } from "@/lib/urls";

export async function GET() {
  const authorizeUrl = buildStravaAuthorizeUrl();
  return NextResponse.json({ authorizeUrl });
}

