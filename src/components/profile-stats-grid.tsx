import { formatKm, formatPace } from "@/lib/format";

type StatCard = {
  label: string;
  value: string;
  subLabel?: string;
};

type ProfileStatsGridProps = {
  totalKm?: number;
  last30Km?: number;
  avgPace?: number;
};

export const ProfileStatsGrid = ({
  totalKm,
  last30Km,
  avgPace,
}: ProfileStatsGridProps) => {
  const cards: StatCard[] = [
    { label: "Total KM", value: totalKm ? formatKm(totalKm) : "0 km" },
    {
      label: "Last 30 days",
      value: last30Km ? formatKm(last30Km) : "0 km",
    },
    {
      label: "Avg pace",
      value: avgPace ? formatPace(avgPace) : "—",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-neutral-200 bg-white p-6"
        >
          <p className="text-sm uppercase tracking-wide text-neutral-500">
            {card.label}
          </p>
          <p className="mt-2 text-3xl font-semibold text-neutral-900">
            {card.value}
          </p>
          {card.subLabel && (
            <p className="text-sm text-neutral-500">{card.subLabel}</p>
          )}
        </div>
      ))}
    </div>
  );
};

