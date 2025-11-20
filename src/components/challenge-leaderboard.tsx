import Link from "next/link";
import Image from "next/image";
import { ChallengeLeaderboardEntry, ChallengeRulesetType, ChallengeDoc } from "@/lib/types";
import { formatKm } from "@/lib/format";
import { format, eachDayOfInterval, parseISO, isAfter } from "date-fns";
import { Check, X } from "lucide-react";

type ChallengeLeaderboardProps = {
  entries: ChallengeLeaderboardEntry[];
  challenge: ChallengeDoc;
};

const formatProgress = (metric: number, type: ChallengeRulesetType) => {
  if (type === "distance_total" || type === "distance_recurring") {
    return formatKm(metric);
  } else if (type === "duration_total" || type === "duration_recurring") {
    const hours = Math.floor(metric / 60);
    const minutes = metric % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  } else if (type === "frequency_based") {
    return `${metric.toFixed(1)}%`;
  }
  return metric.toString();
};

export const ChallengeLeaderboard = ({ entries, challenge }: ChallengeLeaderboardProps) => {
  if (!entries.length) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
        <p className="text-lg font-semibold text-neutral-600">No participants yet</p>
      </div>
    );
  }

  const { ruleset_type, ruleset_config, start_date, end_date } = challenge;
  const isRecurring = ruleset_type === "distance_recurring" || ruleset_type === "duration_recurring";
  
  // Get all required days for recurring challenges
  const getRequiredDays = () => {
    if (!isRecurring) return [];
    const startDate = parseISO(start_date);
    const endDate = parseISO(end_date);
    const now = new Date();
    const intervalDays = ruleset_config.interval_days || 1;
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    const daysToCheck = allDays.filter((day) => !isAfter(day, now));
    
    return daysToCheck.filter((day) => {
      const daysSinceStart = Math.floor(
        (day.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceStart % intervalDays === 0;
    });
  };

  const requiredDays = getRequiredDays();

  const getMetricLabel = () => {
    if (ruleset_type === "distance_total" || ruleset_type === "distance_recurring") {
      return "Distance";
    } else if (ruleset_type === "duration_total" || ruleset_type === "duration_recurring") {
      return "Duration";
    } else {
      return "Progress";
    }
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
      <table className="min-w-full divide-y divide-neutral-100 text-left text-sm sm:text-base">
        <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wider text-neutral-500 sm:text-sm">
          <tr>
            <th className="px-4 py-3 sm:sticky sm:left-0 sm:z-10 sm:bg-neutral-50 sm:px-6" style={{ width: '80px', minWidth: '80px' }}>Rank</th>
            <th className="px-4 py-3 sm:sticky sm:left-[80px] sm:z-10 sm:bg-neutral-50 sm:px-6" style={{ width: '250px', minWidth: '250px' }}>Founder</th>
            <th className="px-4 py-3 sm:px-6">Startup</th>
            <th className="px-4 py-3 sm:px-6 text-right">{getMetricLabel()}</th>
            {isRecurring && requiredDays.length > 0 && (
              <>
                {requiredDays.map((day) => (
                  <th
                    key={format(day, "yyyy-MM-dd")}
                    className="px-2 py-3 text-center text-[10px]"
                    title={format(day, "MMM d, yyyy")}
                  >
                    {format(day, "d")}
                  </th>
                ))}
              </>
            )}
            <th className="px-4 py-3 sm:px-6 text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 bg-white text-neutral-800">
          {entries.map((entry, idx) => (
            <tr key={entry.user_id} className="group transition hover:bg-neutral-50/80">
              <td className="px-4 py-4 text-sm font-semibold text-neutral-500 transition sm:sticky sm:left-0 sm:z-10 sm:bg-white sm:group-hover:bg-neutral-50/80 sm:px-6" style={{ width: '80px', minWidth: '80px' }}>
                #{idx + 1}
              </td>
              <td className="px-4 py-4 transition sm:sticky sm:left-[80px] sm:z-10 sm:bg-white sm:group-hover:bg-neutral-50/80 sm:px-6" style={{ width: '250px', minWidth: '250px' }}>
                <Link
                  href={entry.slug ? `/founder/${entry.slug}` : `/founder/${entry.user_id}`}
                  className="flex items-center gap-3"
                >
                  <div className="relative h-10 w-10 overflow-hidden rounded-full bg-neutral-200">
                    {entry.profile_image ? (
                      <Image
                        src={entry.profile_image}
                        alt={entry.name}
                        fill
                        sizes="40px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                        {entry.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold">{entry.name}</span>
                    <span className="text-sm text-neutral-500">View profile</span>
                  </div>
                </Link>
              </td>
              <td className="px-4 py-4 text-neutral-600 sm:px-6">
                {entry.startup_name ?? "—"}
              </td>
              <td className="px-4 py-4 text-right font-semibold text-neutral-900 sm:px-6">
                {formatProgress(entry.progress_metric, ruleset_type)}
              </td>
              {isRecurring && requiredDays.length > 0 && (
                <>
                  {requiredDays.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const completed = entry.daily_status?.[dateStr];
                    const isFuture = isAfter(day, new Date());
                    
                    return (
                      <td key={dateStr} className="px-2 py-4 text-center">
                        {isFuture ? (
                          <span className="text-neutral-300">—</span>
                        ) : completed === true ? (
                          <Check className="mx-auto h-4 w-4 text-green-600" />
                        ) : completed === false ? (
                          <X className="mx-auto h-4 w-4 text-red-600" />
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </>
              )}
              <td className="px-4 py-4 text-center sm:px-6">
                {entry.completed ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Completed
                  </span>
                ) : (
                  <span className="text-xs text-neutral-500">In Progress</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

