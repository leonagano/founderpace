import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getChallengeById, getChallengeLeaderboard, getChallengeParticipant } from "@/lib/repositories";
import { ChallengeLeaderboard } from "@/components/challenge-leaderboard";
import { ChallengeJoinButton } from "@/components/challenge-join-button";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ChallengeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const challenge = await getChallengeById(id);

  if (!challenge) {
    notFound();
  }

  const [leaderboard] = await Promise.all([getChallengeLeaderboard(id)]);

  const getRulesSummary = () => {
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

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10 lg:px-0">
      <Link href="/" className="flex items-center gap-3">
        <Image
          src="/icon_transparent.png"
          alt="FounderPace icon"
          width={56}
          height={56}
          priority
          className="h-14 w-14"
        />
        <span className="text-sm font-semibold uppercase tracking-[0.4em] text-neutral-500">
          FounderPace
        </span>
      </Link>

      <Link href="/challenges" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Back to challenges
      </Link>

      <div className="rounded-3xl border border-neutral-200 bg-white p-8">
        <div className="mb-6">
          <h1 className="text-4xl font-semibold text-neutral-900">{challenge.title}</h1>
          <p className="mt-2 text-neutral-600">{challenge.description}</p>
        </div>

        {challenge.sponsor && (
          <div className="mb-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Sponsored by {challenge.sponsor.name || "Sponsor"}
            </h3>
            {challenge.sponsor.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={challenge.sponsor.logo_url}
                alt={challenge.sponsor.name || "Sponsor"}
                className="mb-4 h-auto max-h-16 w-auto max-w-[120px]"
              />
            )}
            {challenge.sponsor.prize_description && (
              <p className="text-sm text-neutral-700">{challenge.sponsor.prize_description}</p>
            )}
            {challenge.sponsor.link && (
              <a
                href={challenge.sponsor.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-neutral-600 hover:text-neutral-900"
              >
                Learn more →
              </a>
            )}
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-neutral-500">Start Date:</span>
            <span className="ml-2 font-semibold text-neutral-900">
              {format(new Date(challenge.start_date), "MMM d, yyyy")}
            </span>
          </div>
          <div>
            <span className="text-neutral-500">End Date:</span>
            <span className="ml-2 font-semibold text-neutral-900">
              {format(new Date(challenge.end_date), "MMM d, yyyy")}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-neutral-500">Rules:</span>
            <span className="ml-2 font-semibold text-neutral-900">{getRulesSummary()}</span>
          </div>
        </div>

        <ChallengeJoinButton challengeId={id} />
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-semibold text-neutral-900">Leaderboard</h2>
        <ChallengeLeaderboard entries={leaderboard} challenge={challenge} />
      </div>
    </div>
  );
}

