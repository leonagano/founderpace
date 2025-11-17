import { NextResponse } from "next/server";
import { syncUserFromStrava } from "@/lib/sync-service";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(_: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    await syncUserFromStrava(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

