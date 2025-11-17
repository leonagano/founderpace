"use client";

import useSWR from "swr";
import { useState } from "react";
import { LeaderboardEntry, LeaderboardPeriod, leaderboardPeriods } from "@/lib/types";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { PeriodFilter } from "@/components/period-filter";

type LeaderboardShellProps = {
  initialEntries: LeaderboardEntry[];
};

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    })
    .then((json) => json.entries as LeaderboardEntry[]);

export const LeaderboardShell = ({ initialEntries }: LeaderboardShellProps) => {
  const [period, setPeriod] = useState<LeaderboardPeriod>("all_time");
  const { data, isLoading } = useSWR<LeaderboardEntry[]>(
    `/api/leaderboard?period=${period}`,
    fetcher,
    {
      fallbackData: initialEntries,
      keepPreviousData: true,
    }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-neutral-900">Leaderboard</h2>
        <PeriodFilter
          periods={leaderboardPeriods}
          active={period}
          onChange={setPeriod}
        />
      </div>
      {isLoading && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-neutral-400">
          Refreshing leaderboard...
        </div>
      )}
      <LeaderboardTable entries={data ?? []} />
    </div>
  );
};

