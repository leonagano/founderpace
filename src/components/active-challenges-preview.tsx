import Link from "next/link";
import { getActiveChallengesWithParticipantCounts } from "@/lib/repositories";
import type { ChallengeDoc } from "@/lib/types";

const getRulesSummary = (challenge: ChallengeDoc) => {
  const { ruleset_type, ruleset_config } = challenge;
  if (ruleset_type === "distance_total") {
    return `Run ${ruleset_config.target_km} km total`;
  } else if (ruleset_type === "distance_recurring") {
    return `Run ${ruleset_config.per_day_km} km every ${ruleset_config.interval_days} day(s)`;
  } else if (ruleset_type === "duration_total") {
    return `Run ${ruleset_config.target_minutes} minutes total`;
  } else if (ruleset_type === "duration_recurring") {
    return `Run ${ruleset_config.per_day_minutes} minutes every ${ruleset_config.interval_days} day(s)`;
  } else if (ruleset_type === "frequency_based") {
    return `Run at least ${ruleset_config.required_frequency} time(s) per week`;
  }
  return "";
};

export const ActiveChallengesPreview = async () => {
  const challengesWithCounts = await getActiveChallengesWithParticipantCounts(5);

  if (challengesWithCounts.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-neutral-700">Active Challenges</h3>
        <Link
          href="/challenges"
          className="text-xs font-medium text-neutral-500 hover:text-neutral-900"
        >
          See all →
        </Link>
      </div>
      <div className="space-y-2">
        {challengesWithCounts.map(({ challenge, participantCount }) => (
          <Link
            key={challenge._id?.toString()}
            href={`/challenges/${challenge._id}`}
            className="block rounded-lg border border-neutral-100 bg-neutral-50 p-3 transition hover:border-neutral-200 hover:bg-neutral-100"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-neutral-900 line-clamp-1">
                    {challenge.title}
                  </h4>
                  {challenge.sponsor && (
                    <>
                      {challenge.sponsor.logo_url && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={challenge.sponsor.logo_url}
                          alt={challenge.sponsor.name || "Sponsor"}
                          className="h-4 w-auto max-w-[40px] object-contain"
                          style={{ maxHeight: '16px', maxWidth: '40px', height: 'auto', width: 'auto' }}
                        />
                      )}
                      <span className="shrink-0 text-xs font-medium text-neutral-500">Sponsored</span>
                    </>
                  )}
                </div>
                <p className="mt-1 text-xs text-neutral-600 line-clamp-1">
                  {getRulesSummary(challenge)}
                </p>
                {challenge.sponsor?.prize_description && (
                  <p className="mt-1 text-xs font-medium text-neutral-700 line-clamp-1">
                    🏆 {challenge.sponsor.prize_description}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs text-neutral-500">
                {participantCount} {participantCount === 1 ? "participant" : "participants"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

