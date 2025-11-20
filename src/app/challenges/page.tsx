import Link from "next/link";
import Image from "next/image";
import { getActiveChallenges, getUpcomingChallenges, getCompletedChallenges } from "@/lib/repositories";
import { format } from "date-fns";

export default async function ChallengesPage() {
  const [activeChallenges, upcomingChallenges, completedChallenges] = await Promise.all([
    getActiveChallenges(),
    getUpcomingChallenges(),
    getCompletedChallenges(),
  ]);

  // Sort challenges: sponsored first, then by creation date
  const sortChallenges = (challenges: typeof activeChallenges) => {
    return [...challenges].sort((a, b) => {
      const aHasSponsor = a.sponsor ? 1 : 0;
      const bHasSponsor = b.sponsor ? 1 : 0;
      if (aHasSponsor !== bHasSponsor) {
        return bHasSponsor - aHasSponsor; // Sponsored first
      }
      // If both have same sponsor status, maintain original order (by created_at)
      return 0;
    });
  };

  const sortedActiveChallenges = sortChallenges(activeChallenges);
  const sortedUpcomingChallenges = sortChallenges(upcomingChallenges);
  const sortedCompletedChallenges = sortChallenges(completedChallenges);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6 sm:gap-12 sm:px-6 sm:py-10 lg:px-0">
      <div className="flex items-center pr-20 sm:pr-0">
        <Link href="/" className="flex items-center gap-2 sm:gap-3">
          <Image
            src="/icon_transparent.png"
            alt="FounderPace icon"
            width={56}
            height={56}
            priority
            className="h-10 w-10 sm:h-14 sm:w-14"
          />
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-neutral-500 sm:text-sm">
            FounderPace
          </span>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-semibold text-neutral-900 sm:text-4xl">Challenges</h1>
        <p className="mt-2 text-sm text-neutral-600 sm:text-base">Join challenges and compete with other founders</p>
      </div>

      {sortedActiveChallenges.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-neutral-900">Active Challenges</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedActiveChallenges.map((challenge) => (
              <Link
                key={challenge._id?.toString()}
                href={`/challenges/${challenge._id}`}
                className="rounded-2xl border border-neutral-200 bg-white p-6 transition hover:border-neutral-300 hover:shadow-sm"
              >
                <h3 className="text-lg font-semibold text-neutral-900">{challenge.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{challenge.description}</p>
                {challenge.sponsor?.prize_description && (
                  <div className="mt-3 rounded-lg bg-neutral-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">🏆 Prize</p>
                    <p className="mt-1 text-sm font-medium text-neutral-900">{challenge.sponsor.prize_description}</p>
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
                  <span>
                    {format(new Date(challenge.start_date), "MMM d")} -{" "}
                    {format(new Date(challenge.end_date), "MMM d, yyyy")}
                  </span>
                  {challenge.sponsor && (
                    <div className="flex items-center gap-2">
                      {challenge.sponsor.logo_url && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={challenge.sponsor.logo_url}
                          alt={challenge.sponsor.name || "Sponsor"}
                          className="h-auto max-h-6 w-auto max-w-[60px] object-contain"
                          style={{ maxHeight: '24px', maxWidth: '60px', height: 'auto', width: 'auto' }}
                        />
                      )}
                      <span className="rounded-full bg-neutral-100 px-2 py-1">Sponsored</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {sortedUpcomingChallenges.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-neutral-900">Upcoming Challenges</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedUpcomingChallenges.map((challenge) => (
              <Link
                key={challenge._id?.toString()}
                href={`/challenges/${challenge._id}`}
                className="rounded-2xl border border-neutral-200 bg-white p-6 transition hover:border-neutral-300 hover:shadow-sm"
              >
                <h3 className="text-lg font-semibold text-neutral-900">{challenge.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{challenge.description}</p>
                {challenge.sponsor?.prize_description && (
                  <div className="mt-3 rounded-lg bg-neutral-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">🏆 Prize</p>
                    <p className="mt-1 text-sm font-medium text-neutral-900">{challenge.sponsor.prize_description}</p>
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
                  <span>Starts {format(new Date(challenge.start_date), "MMM d, yyyy")}</span>
                  {challenge.sponsor && (
                    <div className="flex items-center gap-2">
                      {challenge.sponsor.logo_url && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={challenge.sponsor.logo_url}
                          alt={challenge.sponsor.name || "Sponsor"}
                          className="h-auto max-h-6 w-auto max-w-[60px] object-contain"
                          style={{ maxHeight: '24px', maxWidth: '60px', height: 'auto', width: 'auto' }}
                        />
                      )}
                      <span className="rounded-full bg-neutral-100 px-2 py-1">Sponsored</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {sortedCompletedChallenges.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-neutral-900">Completed Challenges</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedCompletedChallenges.map((challenge) => (
              <Link
                key={challenge._id?.toString()}
                href={`/challenges/${challenge._id}`}
                className="rounded-2xl border border-neutral-200 bg-white p-6 transition hover:border-neutral-300 hover:shadow-sm"
              >
                <h3 className="text-lg font-semibold text-neutral-900">{challenge.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{challenge.description}</p>
                {challenge.sponsor?.prize_description && (
                  <div className="mt-3 rounded-lg bg-neutral-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">🏆 Prize</p>
                    <p className="mt-1 text-sm font-medium text-neutral-900">{challenge.sponsor.prize_description}</p>
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
                  <span>
                    {format(new Date(challenge.start_date), "MMM d")} -{" "}
                    {format(new Date(challenge.end_date), "MMM d, yyyy")}
                  </span>
                  {challenge.sponsor && (
                    <div className="flex items-center gap-2">
                      {challenge.sponsor.logo_url && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={challenge.sponsor.logo_url}
                          alt={challenge.sponsor.name || "Sponsor"}
                          className="h-auto max-h-6 w-auto max-w-[60px] object-contain"
                          style={{ maxHeight: '24px', maxWidth: '60px', height: 'auto', width: 'auto' }}
                        />
                      )}
                      <span className="rounded-full bg-neutral-100 px-2 py-1">Sponsored</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {sortedActiveChallenges.length === 0 && sortedUpcomingChallenges.length === 0 && sortedCompletedChallenges.length === 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
          <p className="text-lg font-semibold text-neutral-600">No challenges yet</p>
          <p className="mt-2 text-sm text-neutral-500">Be the first to create a challenge!</p>
        </div>
      )}
    </div>
  );
}

