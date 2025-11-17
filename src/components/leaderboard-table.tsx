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
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <table className="min-w-full divide-y divide-neutral-100 text-left text-sm sm:text-base">
        <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wider text-neutral-500 sm:text-sm">
          <tr>
            <th className="px-4 py-3 sm:px-6">Rank</th>
            <th className="px-4 py-3 sm:px-6">Founder</th>
            <th className="px-4 py-3 sm:px-6">Startup</th>
            <th className="px-4 py-3 sm:px-6 text-right">Kms Run</th>
            <th className="px-4 py-3 sm:px-6 text-right">Avg Pace</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 bg-white text-neutral-800">
          {entries.map((entry, idx) => (
            <tr
              key={entry.user_id}
              className="transition hover:bg-neutral-50/80"
            >
              <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-neutral-500 sm:px-6">
                #{idx + 1}
              </td>
              <td className="px-4 py-4 sm:px-6">
                <Link
                  href={`/founder/${entry.user_id}`}
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
                {formatKm(entry.total_km)}
              </td>
              <td className="px-4 py-4 text-right font-mono text-sm text-neutral-600 sm:px-6">
                {formatPace(entry.avg_pace)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

