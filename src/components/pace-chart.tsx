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

type PaceChartProps = {
  data?: DailyActivity[];
};

const formatPace = (secondsPerKm: number): string => {
  if (!secondsPerKm || secondsPerKm === 0) return "0:00";
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.floor(secondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const PaceChart = ({ data }: PaceChartProps) => {
  if (!data?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-10 text-center text-neutral-500">
        Start running with Strava to unlock the chart.
      </div>
    );
  }

  // Group by date and calculate average pace per day
  const grouped = data.reduce<
    Map<
      string,
      { date: string; totalKm: number; totalDuration: number; count: number }
    >
  >((acc, entry) => {
    const key = entry.date;
    const existing = acc.get(key) ?? {
      date: key,
      totalKm: 0,
      totalDuration: 0,
      count: 0,
    };
    existing.totalKm += entry.km;
    existing.totalDuration += entry.duration_seconds;
    existing.count += 1;
    acc.set(key, existing);
    return acc;
  }, new Map());

  const chartData = Array.from(grouped.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => {
      // Parse date as local date (YYYY-MM-DD) to avoid timezone shifts
      const [year, month, day] = entry.date.split("-").map(Number);
      const dateObj = new Date(year, month - 1, day);
      const currentYear = new Date().getFullYear();
      const entryYear = dateObj.getFullYear();
      const showYear = entryYear !== currentYear || dateObj.getMonth() === 0;
      
      // Calculate pace: seconds per km
      const pace = entry.totalKm > 0 ? entry.totalDuration / entry.totalKm : 0;
      
      return {
        date: entry.date,
        prettyDate: showYear
          ? format(dateObj, "MMM d, yyyy")
          : format(dateObj, "MMM d"),
        pace: Number(pace.toFixed(2)),
        paceFormatted: formatPace(pace),
      };
    })
    .filter((entry) => entry.pace > 0); // Filter out entries with no valid pace

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-10 text-center text-neutral-500">
        No pace data available.
      </div>
    );
  }

  // Calculate min and max for Y-axis domain
  const paceValues = chartData.map((d) => d.pace);
  const minPace = Math.min(...paceValues);
  const maxPace = Math.max(...paceValues);
  const range = maxPace - minPace;
  // Set domain to start slightly below minimum (5% padding)
  const yAxisMin = Math.max(0, minPace - range * 0.05);
  const yAxisMax = maxPace + range * 0.05;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Pace over time
      </h4>
      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPace" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="prettyDate"
              stroke="#94a3b8"
              fontSize={12}
              interval="preserveStartEnd"
              tickCount={8}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              domain={[yAxisMin, yAxisMax]}
              tickFormatter={(value) => formatPace(value)}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 16,
                borderColor: "#e2e8f0",
              }}
              formatter={(value: number) => formatPace(value)}
            />
            <Area
              type="monotone"
              dataKey="pace"
              stroke="#059669"
              strokeWidth={2}
              fill="url(#colorPace)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

