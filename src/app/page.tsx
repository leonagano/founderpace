import Link from "next/link";
import Image from "next/image";
import { LeaderboardShell } from "@/components/leaderboard-shell";
import { SidebarCta } from "@/components/sidebar-cta";
import { getLeaderboard } from "@/lib/leaderboard-service";
import { buildStravaAuthorizeUrl } from "@/lib/urls";
import { env } from "@/lib/env";

export default async function Home() {
  const initialLeaderboard = await getLeaderboard("all_time");
  const authorizeUrl = buildStravaAuthorizeUrl();
  const advertiseUrl = env.ADVERTISE_URL;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-10 lg:px-0">
      <header className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
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
            href="/challenges"
            className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            Challenges
          </Link>
        </div>
        <h1 className="text-4xl font-semibold leading-tight text-neutral-900 sm:text-5xl">
          The public leaderboard for founders who run
        </h1>
      </header>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(260px,1fr)]">
        <LeaderboardShell initialEntries={initialLeaderboard} />
        <SidebarCta authorizeUrl={authorizeUrl} advertiseUrl={advertiseUrl ?? undefined} />
      </section>
    </div>
  );
}
