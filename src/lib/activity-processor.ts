import { StravaActivity } from "./strava";

export type ActivityType = "Run" | "Walk" | "Ride" | "Swim" | "Hike" | "Workout" | "Other";

export type DayActivities = {
  date: Date;
  activities: ActivityType[];
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  Run: "#ff6b35", // orange
  Walk: "#4caf50", // green
  Ride: "#4a90e2", // blue
  Swim: "#00d4ff", // cyan
  Hike: "#8b4513", // brown
  Workout: "#9b59b6", // purple
  Other: "#9b59b6", // purple
};

export const getActivityColor = (type: ActivityType): string => {
  return ACTIVITY_COLORS[type];
};

const normalizeActivityType = (type: string): ActivityType => {
  const normalized = type.toLowerCase();
  if (normalized.includes("run")) return "Run";
  if (normalized.includes("walk")) return "Walk";
  if (normalized.includes("ride") || normalized.includes("bike")) return "Ride";
  if (normalized.includes("swim")) return "Swim";
  if (normalized.includes("hike")) return "Hike";
  if (normalized.includes("workout")) return "Workout";
  return "Other";
};

export const processActivities = (activities: StravaActivity[]): DayActivities[] => {
  // Create a map of date -> activities
  const dayMap = new Map<string, ActivityType[]>();

  activities.forEach((activity) => {
    const localDate = new Date(activity.start_date_local);
    const dateKey = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")}`;
    
    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, []);
    }
    
    const activityType = normalizeActivityType(activity.type);
    dayMap.get(dateKey)!.push(activityType);
  });

  // Generate all 365 days of 2025
  const startDate = new Date("2025-01-01");
  const endDate = new Date("2025-12-31");
  const allDays: DayActivities[] = [];

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    allDays.push({
      date: new Date(d),
      activities: dayMap.get(dateKey) || [],
    });
  }

  return allDays;
};

