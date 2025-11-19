import { NextResponse } from "next/server";
import { z } from "zod";
import { createChallenge, getAllChallenges } from "@/lib/repositories";
import type { ChallengeDoc, ChallengeRulesetType } from "@/lib/types";

const challengeSchema = z.object({
  creator_user_id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000),
  ruleset_type: z.enum([
    "distance_total",
    "distance_recurring",
    "duration_total",
    "duration_recurring",
    "frequency_based",
  ]),
  ruleset_config: z.object({
    target_km: z.number().optional(),
    target_minutes: z.number().optional(),
    interval_days: z.number().optional(),
    per_day_km: z.number().optional(),
    per_day_minutes: z.number().optional(),
    required_frequency: z.number().optional(),
  }),
  start_date: z.string(),
  end_date: z.string(),
  sponsor: z
    .object({
      name: z.string().optional(),
      logo_url: z.string().url().optional().or(z.literal("")),
      link: z.string().url().optional().or(z.literal("")),
      prize_description: z.string().optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const validated = challengeSchema.parse(json);

    // Validate dates
    const startDate = new Date(validated.start_date);
    const endDate = new Date(validated.end_date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (startDate < now) {
      return NextResponse.json(
        { error: "Start date must be today or later" },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Validate ruleset config based on type
    const { ruleset_type, ruleset_config } = validated;
    if (ruleset_type === "distance_total" && !ruleset_config.target_km) {
      return NextResponse.json(
        { error: "target_km is required for distance_total" },
        { status: 400 }
      );
    }
    if (ruleset_type === "distance_recurring" && (!ruleset_config.per_day_km || !ruleset_config.interval_days)) {
      return NextResponse.json(
        { error: "per_day_km and interval_days are required for distance_recurring" },
        { status: 400 }
      );
    }
    if (ruleset_type === "duration_total" && !ruleset_config.target_minutes) {
      return NextResponse.json(
        { error: "target_minutes is required for duration_total" },
        { status: 400 }
      );
    }
    if (ruleset_type === "duration_recurring" && (!ruleset_config.per_day_minutes || !ruleset_config.interval_days)) {
      return NextResponse.json(
        { error: "per_day_minutes and interval_days are required for duration_recurring" },
        { status: 400 }
      );
    }
    if (ruleset_type === "frequency_based" && !ruleset_config.required_frequency) {
      return NextResponse.json(
        { error: "required_frequency is required for frequency_based" },
        { status: 400 }
      );
    }

    const challenge: ChallengeDoc = {
      creator_user_id: validated.creator_user_id,
      title: validated.title,
      description: validated.description,
      ruleset_type: validated.ruleset_type as ChallengeRulesetType,
      ruleset_config: validated.ruleset_config,
      start_date: validated.start_date,
      end_date: validated.end_date,
      sponsor: validated.sponsor,
      created_at: new Date().toISOString(),
    };

    const created = await createChallenge(challenge);
    return NextResponse.json({ challenge: created });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Unable to create challenge" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const challenges = await getAllChallenges();
    return NextResponse.json({ challenges });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to fetch challenges" }, { status: 500 });
  }
}

