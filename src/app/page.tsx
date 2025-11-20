import Link from "next/link";
import Image from "next/image";
import { LeaderboardShell } from "@/components/leaderboard-shell";
import { SidebarCta } from "@/components/sidebar-cta";
import { ActiveChallengesPreview } from "@/components/active-challenges-preview";
import { getLeaderboard } from "@/lib/leaderboard-service";
import { buildStravaAuthorizeUrl } from "@/lib/urls";
import { env } from "@/lib/env";

export default async function Home() {
  const initialLeaderboard = await getLeaderboard("all_time");
  const authorizeUrl = buildStravaAuthorizeUrl();
  const advertiseUrl = env.ADVERTISE_URL;

  return (
    <div className="mx-auto w-full max-w-6xl flex flex-col gap-8 px-4 py-6 sm:gap-12 sm:px-6 sm:py-10 lg:px-0">
      <header className="flex flex-col gap-4 sm:gap-6">
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
        <h1 className="text-3xl font-semibold leading-tight text-neutral-900 sm:text-4xl lg:text-5xl">
          The public leaderboard for founders who run
        </h1>
      </header>

      <section className="grid gap-6 grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(260px,1fr)] lg:gap-8">
        <div className="flex flex-col gap-10 min-w-0">
          <LeaderboardShell initialEntries={initialLeaderboard} />
          <ActiveChallengesPreview />
        </div>
        <div className="lg:col-start-2">
          <SidebarCta authorizeUrl={authorizeUrl} advertiseUrl={advertiseUrl ?? undefined} />
        </div>
      </section>
    </div>
  );
}
