export interface ParsedTimer {
  label: string;
  seconds: number;
}

function toSeconds(value: number, unit: string): number {
  const u = unit.toLowerCase();
  if (u.startsWith("hour") || u.startsWith("hr")) return value * 3600;
  if (u.startsWith("sec")) return value;
  return value * 60; // minutes
}

export function parseTimers(instruction: string): ParsedTimer[] {
  const timers: ParsedTimer[] = [];
  const seen = new Set<string>();

  // Match patterns like "for 25 minutes", "25 mins", "about 20 minutes", "1 hour"
  const patterns = [
    // Range: "25-30 minutes" — use the higher value
    /(\d+)\s*[-–]\s*(\d+)\s*(minutes?|mins?|hours?|hrs?|seconds?|secs?)/gi,
    // Simple: "for 25 minutes", "25 mins", "about 20 minutes"
    /(?:for\s+|about\s+|approximately\s+|around\s+|roughly\s+)?(\d+)\s*(minutes?|mins?|hours?|hrs?|seconds?|secs?)/gi,
  ];

  // Range pattern first
  const rangeRegex = patterns[0];
  let match;
  while ((match = rangeRegex.exec(instruction)) !== null) {
    const higher = parseInt(match[2], 10);
    const unit = match[3];
    const seconds = toSeconds(higher, unit);
    const label = `${higher} ${unit}`;
    if (!seen.has(label)) {
      seen.add(label);
      timers.push({ label, seconds });
    }
  }

  // Simple pattern
  const simpleRegex = patterns[1];
  while ((match = simpleRegex.exec(instruction)) !== null) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const seconds = toSeconds(value, unit);
    const label = `${value} ${unit}`;
    // Skip if already captured by range pattern
    if (!seen.has(label) && seconds > 0) {
      seen.add(label);
      timers.push({ label, seconds });
    }
  }

  return timers;
}
