import { Fight } from "../models/Fight";
import { LogLine, LogTypes } from "../models/LogLine";

export const TIME_RANGE_PARAM = "timeRange";

const TICK_MS = 600;

/** Inclusive span of fight time, in `fightTimeMs` units. */
export interface TimeRange {
  startMs: number;
  endMs: number;
}

/**
 * Log types that describe ongoing state rather than something that happened.
 * The latest value before a range still applies inside it, so slicing carries
 * them forward instead of dropping them.
 */
const STATE_LOG_TYPES = new Set<LogTypes>([
  LogTypes.BASE_LEVELS,
  LogTypes.BOOSTED_LEVELS,
  LogTypes.PRAYER,
  LogTypes.OVERHEAD,
  LogTypes.PLAYER_EQUIPMENT,
  LogTypes.PLAYER_INVENTORY,
  LogTypes.RUNE_POUCH,
  LogTypes.SPELLBOOK,
  LogTypes.TOB_SCALE,
  LogTypes.COX_RAID_MODE,
]);

export const serializeTimeRange = (range: TimeRange): string =>
  `${range.startMs}-${range.endMs}`;

export const deserializeTimeRange = (
  value: string | null,
): TimeRange | null => {
  const match = value?.match(/^(\d+)-(\d+)$/);
  if (!match) {
    return null;
  }
  const startMs = Number(match[1]);
  const endMs = Number(match[2]);
  return startMs < endMs ? { startMs, endMs } : null;
};

export const getFightTimeBounds = (fight: Fight): TimeRange => {
  const startMs = fight.firstLine?.fightTimeMs ?? 0;
  return { startMs, endMs: fight.lastLine?.fightTimeMs ?? startMs };
};

const snapToTick = (ms: number, originMs: number): number =>
  originMs + Math.round((ms - originMs) / TICK_MS) * TICK_MS;

/**
 * Orders, tick-snaps and clamps a range to the fight. Returns null when less
 * than one tick of it lies inside the fight.
 */
export const clampTimeRange = (
  range: TimeRange,
  bounds: TimeRange,
): TimeRange | null => {
  const clamp = (ms: number) =>
    Math.max(
      bounds.startMs,
      Math.min(bounds.endMs, snapToTick(ms, bounds.startMs)),
    );
  const a = clamp(range.startMs);
  const b = clamp(range.endMs);
  const startMs = Math.min(a, b);
  const endMs = Math.max(a, b);
  return endMs - startMs >= TICK_MS ? { startMs, endMs } : null;
};

export const isWholeFight = (range: TimeRange, bounds: TimeRange): boolean =>
  range.startMs <= bounds.startMs && range.endMs >= bounds.endMs;

/** The range to filter by, or null when it would not narrow the fight at all. */
export const resolveTimeRange = (
  range: TimeRange | null,
  bounds: TimeRange,
): TimeRange | null => {
  const clamped = range && clampTimeRange(range, bounds);
  return clamped && !isWholeFight(clamped, bounds) ? clamped : null;
};

/** Marks a state log carried forward from before the range; never a real event. */
export const isTimeRangeSeed = (log: LogLine): boolean =>
  log.isTimeRangeSeed === true;

const getStateKey = (log: LogLine): string | null => {
  if (!STATE_LOG_TYPES.has(log.type)) {
    return null;
  }
  const source = "source" in log ? log.source?.name : undefined;
  return `${log.type}|${source ?? ""}`;
};

/**
 * Narrows a fight to a range, so duration, DPS and activity all see only that
 * span. Each state log still in effect at the start of the range is repeated
 * there as a seed, which keeps gear, boosts and prayers correct for anything
 * reading them in order.
 */
export const sliceFightToTimeRange = (
  fight: Fight,
  range: TimeRange | null,
): Fight => {
  if (!range) {
    return fight;
  }

  const stateBeforeRange = new Map<string, LogLine>();
  const inRange: LogLine[] = [];
  const stateAtRangeStart = new Set<string>();

  for (const log of fight.data) {
    const timeMs = log.fightTimeMs ?? 0;
    const stateKey = getStateKey(log);
    if (timeMs < range.startMs) {
      if (stateKey) {
        stateBeforeRange.set(stateKey, log);
      }
    } else if (timeMs <= range.endMs) {
      inRange.push(log);
      if (stateKey && timeMs === range.startMs) {
        stateAtRangeStart.add(stateKey);
      }
    }
  }

  const bounds = getFightTimeBounds(fight);
  const firstTick = fight.firstLine?.tick;
  const tickAt = (timeMs: number) =>
    firstTick === undefined
      ? undefined
      : firstTick + Math.round((timeMs - bounds.startMs) / TICK_MS);

  const seeds: LogLine[] = [];
  for (const [stateKey, log] of stateBeforeRange) {
    if (!stateAtRangeStart.has(stateKey)) {
      seeds.push({
        ...log,
        fightTimeMs: range.startMs,
        tick: tickAt(range.startMs),
        isTimeRangeSeed: true,
      });
    }
  }

  return {
    ...fight,
    data: [...seeds, ...inRange],
    firstLine: {
      ...fight.firstLine,
      fightTimeMs: range.startMs,
      tick: tickAt(range.startMs),
    },
    lastLine: {
      ...fight.lastLine,
      fightTimeMs: range.endMs,
      tick: tickAt(range.endMs),
    },
    metaData: {
      ...fight.metaData,
      fightDurationTicks: Math.round((range.endMs - range.startMs) / TICK_MS),
    },
    // Stored setups describe the fight's start; derive them from the seeds instead.
    gearSetups: undefined,
    appliedTimeRange: range,
  };
};

/** Fight time under a pointer at `clientX`, snapped to a tick and kept in the domain. */
export const getFightTimeAtPlotX = (
  clientX: number,
  plot: { left: number; width: number },
  domain: TimeRange,
): number => {
  const fraction =
    plot.width > 0
      ? Math.max(0, Math.min(1, (clientX - plot.left) / plot.width))
      : 0;
  const timeMs = domain.startMs + fraction * (domain.endMs - domain.startMs);
  return Math.max(
    domain.startMs,
    Math.min(domain.endMs, snapToTick(timeMs, domain.startMs)),
  );
};

/** Parses "83", "1:23", "1:23.4" or "1:01:23" into milliseconds. */
export const parseFightTime = (value: string): number | null => {
  const match = value.trim().match(/^(?:(?:(\d+):)?(\d+):)?(\d+(?:\.\d+)?)$/);
  if (!match) {
    return null;
  }
  const [, hours, minutes, seconds] = match;
  return Math.round(
    (Number(hours ?? 0) * 3600 + Number(minutes ?? 0) * 60 + Number(seconds)) *
      1000,
  );
};

/** Tick times land on tenths of a second, so one decimal is always exact. */
export const formatFightTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  const pad = (part: number) => part.toString().padStart(2, "0");
  const clock = `${pad(minutes)}:${pad(seconds)}.${tenths}`;
  return hours > 0 ? `${pad(hours)}:${clock}` : clock;
};

export const formatTimeRangeSpan = (range: TimeRange): string =>
  `${formatFightTime(range.startMs)} – ${formatFightTime(range.endMs)}`;

export const formatTimeRangeFilterLabel = (range: TimeRange): string =>
  `Time range: ${formatTimeRangeSpan(range)}`;
