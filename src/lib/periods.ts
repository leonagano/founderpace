import { addDays, startOfMonth, startOfWeek, startOfYear } from "date-fns";
import { LeaderboardPeriod } from "@/lib/types";

export const getPeriodStart = (period: LeaderboardPeriod) => {
  const now = new Date();
  switch (period) {
    case "year":
      return startOfYear(now);
    case "month":
      return startOfMonth(now);
    case "week":
      return startOfWeek(now, { weekStartsOn: 1 });
    case "all_time":
    default:
      return new Date(0);
  }
};

export const getRollingWindowStart = (days: number) => {
  return addDays(new Date(), -days);
};

