export const formatKm = (km: number) => `${km.toFixed(1)} km`;

export const formatPace = (secondsPerKm: number) => {
  if (!secondsPerKm || !Number.isFinite(secondsPerKm)) return "—";
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}/km`;
};

export const formatDuration = (totalSeconds: number) => {
  if (!totalSeconds || !Number.isFinite(totalSeconds) || totalSeconds === 0) return "0h";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
};

