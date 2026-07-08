import { LogLine } from "../models/LogLine";

export function deserializeEventTimeFilter(
  value: string | null,
): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function serializeEventTimeFilter(fightTimeMs: number): string {
  return String(fightTimeMs);
}

export function matchesEventTimeFilter(
  log: LogLine,
  filter: number | null,
): boolean {
  if (filter === null) {
    return true;
  }

  return log.fightTimeMs === filter;
}
