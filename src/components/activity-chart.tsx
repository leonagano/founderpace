"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DailyActivity } from "@/lib/types";
import { format } from "date-fns";

type ActivityChartProps = {
  data?: DailyActivity[];
};

export const ActivityChart = ({ data }: ActivityChartProps) => {
  if (!data?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-10 text-center text-neutral-500">
        Start running with Strava to unlock the chart.
      </div>
    );
  }

  const grouped = data.reduce<Map<string, { date: string; km: number }>>((acc, entry) => {
    const key = entry.date;
    const existing = acc.get(key) ?? { date: key, km: 0 };
    existing.km += entry.km;
    acc.set(key, existing);
    return acc;
  }, new Map());

  const chartData = Array.from(grouped.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => {
      const dateObj = new Date(entry.date);
    const currentYear = new Date().getFullYear();
      const entryYear = dateObj.getFullYear();
      const showYear = entryYear !== currentYear || dateObj.getMonth() === 0;
      return {
        date: entry.date,
        prettyDate: showYear ? format(dateObj, "MMM d, yyyy") : format(dateObj, "MMM d"),
        km: Number(entry.km.toFixed(2)),
      };
    });

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        KM over time
      </h4>
      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorKm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="prettyDate"
              stroke="#94a3b8"
              fontSize={12}
              interval="preserveStartEnd"
              tickCount={8}
            />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip
              contentStyle={{
                borderRadius: 16,
                borderColor: "#e2e8f0",
              }}
            />
            <Area
              type="monotone"
              dataKey="km"
              stroke="#4f46e5"
              strokeWidth={2}
              fill="url(#colorKm)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

