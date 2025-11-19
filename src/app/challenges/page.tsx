import Link from "next/link";
import Image from "next/image";
import { getActiveChallenges, getUpcomingChallenges } from "@/lib/repositories";
import { format } from "date-fns";

export default async function ChallengesPage() {
  const [activeChallenges, upcomingChallenges] = await Promise.all([
    getActiveChallenges(),
    getUpcomingChallenges(),
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-10 lg:px-0">
      <div className="flex items-center justify-between">
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
        <Link
          href="/challenges/create"
          className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
        >
          Create Challenge
        </Link>
      </div>

      <div>
        <h1 className="text-4xl font-semibold text-neutral-900">Challenges</h1>
        <p className="mt-2 text-neutral-600">Join challenges and compete with other founders</p>
      </div>

      {activeChallenges.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-neutral-900">Active Challenges</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeChallenges.map((challenge) => (
              <Link
                key={challenge._id?.toString()}
                href={`/challenges/${challenge._id}`}
                className="rounded-2xl border border-neutral-200 bg-white p-6 transition hover:border-neutral-300 hover:shadow-sm"
              >
                <h3 className="text-lg font-semibold text-neutral-900">{challenge.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{challenge.description}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
                  <span>
                    {format(new Date(challenge.start_date), "MMM d")} -{" "}
                    {format(new Date(challenge.end_date), "MMM d, yyyy")}
                  </span>
                  {challenge.sponsor && (
                    <span className="rounded-full bg-neutral-100 px-2 py-1">Sponsored</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {upcomingChallenges.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-neutral-900">Upcoming Challenges</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingChallenges.map((challenge) => (
              <Link
                key={challenge._id?.toString()}
                href={`/challenges/${challenge._id}`}
                className="rounded-2xl border border-neutral-200 bg-white p-6 transition hover:border-neutral-300 hover:shadow-sm"
              >
                <h3 className="text-lg font-semibold text-neutral-900">{challenge.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{challenge.description}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
                  <span>Starts {format(new Date(challenge.start_date), "MMM d, yyyy")}</span>
                  {challenge.sponsor && (
                    <span className="rounded-full bg-neutral-100 px-2 py-1">Sponsored</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {activeChallenges.length === 0 && upcomingChallenges.length === 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
          <p className="text-lg font-semibold text-neutral-600">No challenges yet</p>
          <p className="mt-2 text-sm text-neutral-500">Be the first to create a challenge!</p>
        </div>
      )}
    </div>
  );
}

