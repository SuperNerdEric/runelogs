import { LogLine, LogTypes } from "../models/LogLine";

export interface HitsplatTypeFilter {
  type: string;
}

export const serializeHitsplatTypeFilter = (
  filter: HitsplatTypeFilter,
): string => {
  return filter.type;
};

export const deserializeHitsplatTypeFilter = (
  value: string | null,
): HitsplatTypeFilter | null => {
  if (!value) {
    return null;
  }

  return { type: value };
};

export const matchesHitsplatTypeFilter = (
  log: LogLine,
  filter: HitsplatTypeFilter | null,
): boolean => {
  if (!filter) {
    return true;
  }

  if (log.type === LogTypes.DAMAGE || log.type === LogTypes.HEAL) {
    return log.hitsplatName === filter.type;
  }

  return false;
};

export const formatHitsplatTypeFilterLabel = (
  filter: HitsplatTypeFilter,
): string => {
  return `Hitsplat type: ${filter.type}`;
};

export const getDistinctHitsplatTypes = (logs: LogLine[]): string[] => {
  const types = new Set<string>();

  for (const log of logs) {
    if (log.type === LogTypes.DAMAGE || log.type === LogTypes.HEAL) {
      if (log.hitsplatName) {
        types.add(log.hitsplatName);
      }
    }
  }

  return Array.from(types).sort((a, b) => a.localeCompare(b));
};
