import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8 lg:px-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 text-sm text-neutral-600">
            <p className="font-semibold text-neutral-900">FounderPace</p>
            <p className="text-xs text-neutral-500">
              Privacy: We only store date/time, distance, and duration. No location data is
              collected or stored.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-neutral-500">
          </div>
        </div>
      </div>
    </footer>
  );
};

