const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type HeatmapGridProps = {
  data?: number[][];
};

const getIntensity = (value: number, max: number) => {
  if (max === 0) return 0;
  return value / max;
};

export const HeatmapGrid = ({ data }: HeatmapGridProps) => {
  if (!data?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-10 text-center text-neutral-500">
        Run sync to unlock your activity heatmap.
      </div>
    );
  }

  const flattened = data.flat();
  const max = Math.max(...flattened);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Training Heatmap
        </p>
        <p className="text-xs text-neutral-400">Day × hour (local)</p>
      </div>
      <div className="flex gap-4">
        <div className="flex flex-col gap-3 text-xs font-semibold text-neutral-500">
          {dayLabels.map((label) => (
            <span key={label} className="h-5 flex items-center">
              {label}
            </span>
          ))}
        </div>
        <div className="grid flex-1 grid-cols-24 gap-1.5">
          {data.map((row, rowIdx) =>
            row.map((value, colIdx) => {
              const intensity = getIntensity(value, max);
              const bg =
                intensity === 0
                  ? "bg-neutral-100"
                  : intensity < 0.33
                    ? "bg-indigo-100"
                    : intensity < 0.66
                      ? "bg-indigo-300"
                      : "bg-indigo-500";
              return (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className={`h-5 w-5 rounded-sm ${bg}`}
                  title={`${dayLabels[rowIdx]} at ${colIdx}:00 — ${value.toFixed(1)} km`}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

