import { NextResponse } from "next/server";
import { z } from "zod";
import { updateUserSocials } from "@/lib/repositories";

const payloadSchema = z.object({
  userId: z.string(),
  socials: z.object({
    x_handle: z.string().optional(),
    linkedin: z.string().optional(),
    instagram: z.string().optional(),
    website: z.string().optional(),
  }),
  startupName: z.string().max(120).optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { userId, socials, startupName } = payloadSchema.parse(json);
    await updateUserSocials(userId, socials, startupName);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to update socials" }, { status: 400 });
  }
}

