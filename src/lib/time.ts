/**
 * Formats a duration in seconds into a human-readable string (e.g. "01:23" or "01:15:30").
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '00:00';
  }

  const rounded = Math.floor(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const remainingSeconds = rounded % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
  }

  return `${pad(minutes)}:${pad(remainingSeconds)}`;
}

/**
 * Parses timestamp string formatted as "MM:SS" or "HH:MM:SS" into seconds.
 */
export function parseTimestamp(timeString: string): number {
  if (!timeString || typeof timeString !== 'string') return 0;
  const segments = timeString.split(':');
  if (segments.length < 2 || segments.length > 3) return 0;
  if (segments.some((p) => !/^\d+$/.test(p))) return 0;
  const parts = segments.map((p) => Number(p));

  if (parts.length === 3) {
    return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
  }
  if (parts.length === 2) {
    return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
  }
  return 0;
}
