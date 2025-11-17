import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStatsForUser, getUserById } from "@/lib/repositories";
import { ProfileStatsGrid } from "@/components/profile-stats-grid";
import { SocialLinks } from "@/components/social-links";
import { ActivityChart } from "@/components/activity-chart";
import { HeatmapGrid } from "@/components/heatmap-grid";
import { SocialsForm } from "@/components/socials-form";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
};

export default async function FounderPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [user, stats] = await Promise.all([
    getUserById(id),
    getStatsForUser(id),
  ]);

  if (!user) {
    notFound();
  }

  const canEdit = query?.edit === "1";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10 lg:px-0">
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Back to leaderboard
      </Link>
      <header className="flex flex-col gap-6 rounded-3xl border border-neutral-200 bg-white p-8 sm:flex-row sm:items-center">
        <div className="relative h-32 w-32 overflow-hidden rounded-3xl bg-neutral-100">
          {user.profile_image ? (
            <Image
              src={user.profile_image}
              alt={user.name}
              fill
              sizes="128px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-neutral-500">
              {user.name[0]}
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">Founder</p>
          <h1 className="text-4xl font-semibold text-neutral-900">{user.name}</h1>
          {user.startup_name && (
            <p className="mt-2 text-lg text-neutral-600">
              {user.socials?.website ? (
                <Link
                  href={user.socials.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-neutral-900 hover:underline"
                >
                  {user.startup_name}
                </Link>
              ) : (
                user.startup_name
              )}
            </p>
          )}
          <div className="mt-4">
            <SocialLinks socials={user.socials} />
          </div>
        </div>
      </header>

      <ProfileStatsGrid
        totalKm={stats?.total_km}
        last30Km={stats?.last_30d_km}
        avgPace={stats?.avg_pace}
      />

      <div className="flex flex-col gap-8">
        <ActivityChart data={stats?.daily_activity} />
        <HeatmapGrid data={stats?.activity_heatmap} />
      </div>

      {canEdit && user._id && (
        <SocialsForm
          userId={user._id.toString()}
          initialSocials={user.socials}
          initialStartupName={user.startup_name}
        />
      )}
    </div>
  );
}

