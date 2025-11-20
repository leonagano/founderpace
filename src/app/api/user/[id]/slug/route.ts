import { NextResponse } from "next/server";
import { getUserById } from "@/lib/repositories";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: RouteParams) {
  const { id } = await params;
  const user = await getUserById(id);
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ slug: user.slug || null });
}

