export const formatKm = (km: number) => `${km.toFixed(1)} km`;

export const formatPace = (secondsPerKm: number) => {
  if (!secondsPerKm || !Number.isFinite(secondsPerKm)) return "—";
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}/km`;
};

