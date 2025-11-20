import Link from "next/link";
import Image from "next/image";
import { formatKm, formatPace } from "@/lib/format";
import { LeaderboardEntry } from "@/lib/types";

type LeaderboardTableProps = {
  entries: LeaderboardEntry[];
};

export const LeaderboardTable = ({ entries }: LeaderboardTableProps) => {
  if (!entries.length) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
        <p className="text-lg font-semibold text-neutral-600">
          No founders yet. Be the first one to sync Strava!
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
      <table className="min-w-full divide-y divide-neutral-100 text-left text-xs sm:text-sm lg:text-base">
        <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          <tr>
            <th className="px-3 py-3 sm:px-4 lg:px-6">Rank</th>
            <th className="px-3 py-3 sm:px-4 lg:px-6">Founder</th>
            <th className="hidden px-3 py-3 sm:table-cell sm:px-4 lg:px-6">Startup</th>
            <th className="px-3 py-3 text-right sm:px-4 lg:px-6">Kms Run</th>
            <th className="px-3 py-3 text-right sm:px-4 lg:px-6">Avg Pace</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 bg-white text-neutral-800">
          {entries.map((entry, idx) => (
            <tr
              key={entry.user_id}
              className="transition hover:bg-neutral-50/80"
            >
              <td className="whitespace-nowrap px-3 py-4 text-xs font-semibold text-neutral-500 sm:px-4 sm:text-sm lg:px-6">
                #{idx + 1}
              </td>
              <td className="px-3 py-4 sm:px-4 lg:px-6">
                <Link
                  href={entry.slug ? `/founder/${entry.slug}` : `/founder/${entry.user_id}`}
                  className="flex items-center gap-2 sm:gap-3"
                >
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-neutral-200 sm:h-10 sm:w-10">
                    {entry.profile_image ? (
                      <Image
                        src={entry.profile_image}
                        alt={entry.name}
                        fill
                        sizes="(max-width: 640px) 32px, 40px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                        {entry.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-xs font-semibold sm:text-sm">{entry.name}</span>
                    <span className="hidden text-xs text-neutral-500 sm:inline">View profile</span>
                    <span className="text-xs text-neutral-500 sm:hidden">{entry.startup_name ?? "—"}</span>
                  </div>
                </Link>
              </td>
              <td className="hidden px-3 py-4 text-neutral-600 sm:table-cell sm:px-4 sm:text-sm lg:px-6">
                {entry.startup_name ?? "—"}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-right text-xs font-semibold text-neutral-900 sm:px-4 sm:text-sm lg:px-6">
                {formatKm(entry.total_km)}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-right font-mono text-xs text-neutral-600 sm:px-4 sm:text-sm lg:px-6">
                {formatPace(entry.avg_pace)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

