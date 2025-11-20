import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { getStatsForUser, getUserBySlug, getUserChallenges } from "@/lib/repositories";
import { ProfileStatsGrid } from "@/components/profile-stats-grid";
import { SocialLinks } from "@/components/social-links";
import { ActivityChart } from "@/components/activity-chart";
import { PaceChart } from "@/components/pace-chart";
import { HeatmapGrid } from "@/components/heatmap-grid";
import { SocialsForm } from "@/components/socials-form";
import { ProfileEditButton } from "@/components/profile-edit-button";
import { formatKm, formatPace } from "@/lib/format";
import type { ChallengeDoc, ChallengeParticipantDoc } from "@/lib/types";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ edit?: string }>;
};

export default async function FounderPage({ params, searchParams }: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const user = await getUserBySlug(slug);
  
  if (!user || !user._id) {
    notFound();
  }
  
  const userId = user._id.toString();
  const [stats, userChallenges] = await Promise.all([
    getStatsForUser(userId),
    getUserChallenges(userId),
  ]);

  if (!user) {
    notFound();
  }

  const canEdit = query?.edit === "1";

  // Categorize challenges
  const now = new Date().toISOString();
  const activeChallenges = userChallenges.filter(
    (item): item is NonNullable<typeof item> => 
      item !== null && item.challenge.start_date <= now && item.challenge.end_date >= now
  );
  const completedChallenges = userChallenges.filter(
    (item): item is NonNullable<typeof item> => item !== null && item.challenge.end_date < now
  );
  const upcomingChallenges = userChallenges.filter(
    (item): item is NonNullable<typeof item> => item !== null && item.challenge.start_date > now
  );

  // Helper to get progress status
  const getProgressStatus = (item: { challenge: ChallengeDoc; participant: ChallengeParticipantDoc }) => {
    const { challenge, participant } = item;
    const { ruleset_type, ruleset_config } = challenge;

    if (participant.completed) {
      return { status: "Completed", progress: "100%", progressPercent: 100, color: "text-green-600" };
    }

    let progress = 0;
    let target = 0;

    if (ruleset_type === "distance_total") {
      progress = participant.progress.km_completed;
      target = ruleset_config.target_km || 0;
    } else if (ruleset_type === "distance_recurring") {
      const perDay = ruleset_config.per_day_km || 0;
      const intervalDays = ruleset_config.interval_days || 1;
      const startDate = new Date(challenge.start_date);
      const endDate = new Date(challenge.end_date);
      const nowDate = new Date();
      const daysElapsed = Math.floor((nowDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const requiredDays = Math.floor(daysElapsed / intervalDays) + 1;
      target = perDay * requiredDays;
      progress = participant.progress.km_completed;
    } else if (ruleset_type === "duration_total") {
      progress = participant.progress.minutes_completed;
      target = ruleset_config.target_minutes || 0;
    } else if (ruleset_type === "duration_recurring") {
      const perDay = ruleset_config.per_day_minutes || 0;
      const intervalDays = ruleset_config.interval_days || 1;
      const startDate = new Date(challenge.start_date);
      const nowDate = new Date();
      const daysElapsed = Math.floor((nowDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const requiredDays = Math.floor(daysElapsed / intervalDays) + 1;
      target = perDay * requiredDays;
      progress = participant.progress.minutes_completed;
    } else if (ruleset_type === "frequency_based") {
      const weeks = Math.ceil(
        (new Date(challenge.end_date).getTime() - new Date(challenge.start_date).getTime()) /
          (7 * 24 * 60 * 60 * 1000)
      );
      const requiredRuns = (ruleset_config.required_frequency || 0) * weeks;
      const actualRuns = participant.progress.attempts_log.length;
      progress = actualRuns;
      target = requiredRuns;
    }

    const percentage = target > 0 ? Math.min((progress / target) * 100, 100) : 0;
    return {
      status: percentage >= 100 ? "Completed" : "In Progress",
      progress: `${percentage.toFixed(1)}%`,
      progressPercent: percentage,
      color: percentage >= 100 ? "text-green-600" : "text-neutral-600",
    };
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-10 lg:px-0">
      <Link href="/" className="flex items-center gap-2 sm:gap-3 pr-20 sm:pr-0">
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="text-xs text-neutral-500 hover:text-neutral-900 sm:text-sm">
          ← Back to leaderboard
        </Link>
        {user._id && <ProfileEditButton profileUserId={user._id.toString()} />}
      </div>

      {canEdit && user._id && (
        <SocialsForm
          userId={user._id.toString()}
          initialSocials={user.socials}
          initialStartupName={user.startup_name}
        />
      )}

      <header className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 sm:gap-6 sm:rounded-3xl sm:flex-row sm:items-center sm:p-8">
        <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-neutral-100 sm:h-32 sm:w-32 sm:rounded-3xl">
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
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500 sm:text-sm">Founder</p>
          <h1 className="text-3xl font-semibold text-neutral-900 sm:text-4xl">{user.name}</h1>
          {user.startup_name && (
            <p className="mt-2 flex items-center gap-2 text-lg text-neutral-600">
              {user.socials?.website ? (
                <>
                  <Link
                    href={user.socials.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-neutral-900 hover:underline"
                  >
                    {user.startup_name}
                  </Link>
                  <Link
                    href={user.socials.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-neutral-900"
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" />
                  </Link>
                </>
              ) : (
                <>
                  {user.startup_name}
                  <ExternalLink className="h-4 w-4 shrink-0" />
                </>
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
        totalTime={
          stats?.daily_activity?.reduce(
            (total, activity) => total + (activity.duration_seconds || 0),
            0
          )
        }
      />

      {(activeChallenges.length > 0 || completedChallenges.length > 0 || upcomingChallenges.length > 0) && (
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-neutral-900">My Challenges</h2>
          <div className="space-y-4">
            {activeChallenges.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Active</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {activeChallenges.map((item) => {
                    const progressStatus = getProgressStatus(item);
                    return (
                      <Link
                        key={item.challenge._id?.toString()}
                        href={`/challenges/${item.challenge._id}`}
                        className="rounded-2xl border border-neutral-200 bg-white p-6 transition hover:border-neutral-300 hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-neutral-900">{item.challenge.title}</h4>
                            <p className="mt-1 text-sm text-neutral-600">
                              {format(new Date(item.challenge.start_date), "MMM d")} -{" "}
                              {format(new Date(item.challenge.end_date), "MMM d, yyyy")}
                            </p>
                          </div>
                          <span
                            className={`ml-4 rounded-full px-3 py-1 text-xs font-semibold ${
                              progressStatus.status === "Completed"
                                ? "bg-green-100 text-green-700"
                                : "bg-neutral-100 text-neutral-700"
                            }`}
                          >
                            {progressStatus.status}
                          </span>
                        </div>
                        <div className="mt-4">
                          <div className="mb-2 flex items-center justify-between text-xs text-neutral-500">
                            <span>Progress</span>
                            <span className={progressStatus.color}>{progressStatus.progress}</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100" style={{ position: 'relative' }}>
                            <div
                              className="h-full bg-neutral-900 transition-all"
                              style={{ 
                                width: `${progressStatus.progressPercent}%`,
                                minWidth: progressStatus.progressPercent > 0 ? '2px' : '0',
                                maxWidth: '100%',
                                display: 'block',
                                position: 'relative'
                              }}
                            />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {upcomingChallenges.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Upcoming</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {upcomingChallenges.map((item) => (
                    <Link
                      key={item.challenge._id?.toString()}
                      href={`/challenges/${item.challenge._id}`}
                      className="rounded-2xl border border-neutral-200 bg-white p-6 transition hover:border-neutral-300 hover:shadow-sm"
                    >
                      <h4 className="text-lg font-semibold text-neutral-900">{item.challenge.title}</h4>
                      <p className="mt-1 text-sm text-neutral-600">
                        Starts {format(new Date(item.challenge.start_date), "MMM d, yyyy")}
                      </p>
                      <span className="mt-3 inline-block rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                        Upcoming
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {completedChallenges.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Completed</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {completedChallenges.map((item) => {
                    const progressStatus = getProgressStatus(item);
                    return (
                      <Link
                        key={item.challenge._id?.toString()}
                        href={`/challenges/${item.challenge._id}`}
                        className="rounded-2xl border border-neutral-200 bg-white p-6 transition hover:border-neutral-300 hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-neutral-900">{item.challenge.title}</h4>
                            <p className="mt-1 text-sm text-neutral-600">
                              {format(new Date(item.challenge.start_date), "MMM d")} -{" "}
                              {format(new Date(item.challenge.end_date), "MMM d, yyyy")}
                            </p>
                          </div>
                          <span
                            className={`ml-4 rounded-full px-3 py-1 text-xs font-semibold ${
                              item.participant.completed
                                ? "bg-green-100 text-green-700"
                                : "bg-neutral-100 text-neutral-700"
                            }`}
                          >
                            {item.participant.completed ? "Completed" : "Did Not Complete"}
                          </span>
                        </div>
                        {!item.participant.completed && (
                          <div className="mt-4">
                            <div className="mb-2 flex items-center justify-between text-xs text-neutral-500">
                              <span>Final Progress</span>
                              <span className={progressStatus.color}>{progressStatus.progress}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100" style={{ position: 'relative' }}>
                              <div
                                className="h-full bg-neutral-400 transition-all"
                                style={{ 
                                  width: `${progressStatus.progressPercent}%`,
                                  minWidth: progressStatus.progressPercent > 0 ? '2px' : '0',
                                  maxWidth: '100%',
                                  display: 'block',
                                  position: 'relative'
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="flex flex-col gap-8">
        <ActivityChart data={stats?.daily_activity} />
        <PaceChart data={stats?.daily_activity} />
        <HeatmapGrid data={stats?.activity_heatmap} />
      </div>
    </div>
  );
}

