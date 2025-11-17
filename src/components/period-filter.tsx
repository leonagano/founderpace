"use client";

import { LeaderboardPeriod } from "@/lib/types";
import clsx from "clsx";

const labelMap: Record<LeaderboardPeriod, string> = {
  all_time: "All time",
  year: "This year",
  month: "This month",
  week: "This week",
};

type PeriodFilterProps = {
  periods: LeaderboardPeriod[];
  active: LeaderboardPeriod;
  onChange: (period: LeaderboardPeriod) => void;
};

export const PeriodFilter = ({ periods, active, onChange }: PeriodFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {periods.map((period) => (
        <button
          key={period}
          type="button"
          onClick={() => onChange(period)}
          className={clsx(
            "rounded-full border px-4 py-2 text-sm font-semibold transition",
            active === period
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-900/50"
          )}
        >
          {labelMap[period]}
        </button>
      ))}
    </div>
  );
};

