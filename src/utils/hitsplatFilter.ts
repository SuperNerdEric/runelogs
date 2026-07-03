import { LogLine, LogTypes } from "../models/LogLine";

export interface HitsplatFilter {
  amount: number;
}

export const serializeHitsplatFilter = (filter: HitsplatFilter): string => {
  return String(filter.amount);
};

export const deserializeHitsplatFilter = (
  value: string | null,
): HitsplatFilter | null => {
  if (!value) {
    return null;
  }

  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return null;
  }

  return { amount };
};

export const matchesHitsplatFilter = (
  log: LogLine,
  filter: HitsplatFilter | null,
): boolean => {
  if (!filter) {
    return true;
  }

  if (log.type === LogTypes.DAMAGE) {
    return log.damageAmount === filter.amount;
  }

  if (log.type === LogTypes.HEAL) {
    return log.healAmount === filter.amount;
  }

  return false;
};

export const formatHitsplatFilterLabel = (filter: HitsplatFilter): string => {
  return `Hitsplat amount: ${filter.amount}`;
};

export const getDistinctHitsplatAmounts = (logs: LogLine[]): number[] => {
  const amounts = new Set<number>();

  for (const log of logs) {
    if (log.type === LogTypes.DAMAGE) {
      amounts.add(log.damageAmount);
    } else if (log.type === LogTypes.HEAL) {
      amounts.add(log.healAmount);
    }
  }

  return Array.from(amounts).sort((a, b) => a - b);
};
