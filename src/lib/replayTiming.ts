import { GraphicsObjectSpawned, LogLine, LogTypes } from "../models/LogLine";

/** Seconds per OSRS game tick. */
export const TICK_DURATION_SECONDS = 0.6;

/**
 * Absorbs IEEE-754 undershoot from `n * 0.6` round-trips so
 * `Math.floor(time / 0.6)` does not snap back a tick (e.g. display tick 63).
 * Far smaller than a tick, so playback boundaries stay correct.
 */
const TICK_INDEX_EPSILON = 1e-9;

/** Client cycles per game tick (~600ms / 20ms). */
export const CLIENT_CYCLES_PER_TICK = 30;

/** Seconds per client cycle. */
export const CLIENT_CYCLE_DURATION_SECONDS =
  TICK_DURATION_SECONDS / CLIENT_CYCLES_PER_TICK;

/** Replay time (seconds) for a tick offset from the fight's initial tick. */
export function getTimeFromTickOffset(tickOffset: number): number {
  return tickOffset * TICK_DURATION_SECONDS;
}

/** Whole tick offset from fight start for a replay timestamp. */
export function getTickOffsetFromTime(currentTimeSeconds: number): number {
  return Math.floor(
    currentTimeSeconds / TICK_DURATION_SECONDS + TICK_INDEX_EPSILON,
  );
}

export function getAbsoluteTick(
  currentTimeSeconds: number,
  initialTick: number,
): number {
  return currentTimeSeconds / TICK_DURATION_SECONDS + initialTick;
}

/** Absolute log tick for a replay timestamp (discrete, float-safe). */
export function getTargetTickFromTime(
  currentTimeSeconds: number,
  initialTick: number,
): number {
  return getTickOffsetFromTime(currentTimeSeconds) + initialTick;
}

/** Estimate the client game cycle at replay time zero (initial tick). */
export function computeFightEpochCycle(
  logs: LogLine[],
  initialTick: number,
): number | undefined {
  let epoch: number | undefined;

  for (const log of logs) {
    if (log.type !== LogTypes.GRAPHICS_OBJECT_SPAWNED) {
      continue;
    }

    const spawnLog = log as GraphicsObjectSpawned;
    if (spawnLog.startCycle == null) {
      continue;
    }

    const tick = log.tick ?? initialTick;
    const candidate =
      spawnLog.startCycle - (tick - initialTick) * CLIENT_CYCLES_PER_TICK;
    epoch = epoch === undefined ? candidate : Math.min(epoch, candidate);
  }

  return epoch;
}

export function getCurrentGameCycle(
  currentTimeSeconds: number,
  fightEpochCycle: number,
): number {
  return (
    fightEpochCycle +
    Math.round(currentTimeSeconds / CLIENT_CYCLE_DURATION_SECONDS)
  );
}

export interface GraphicObjectCycleTiming {
  startCycle?: number;
  endCycle?: number;
  spawnTick: number;
}

export function getGraphicObjectAnimationCyclesElapsed(
  currentTimeSeconds: number,
  timing: GraphicObjectCycleTiming,
  initialTick: number,
  fightEpochCycle?: number,
): number {
  if (timing.startCycle != null && fightEpochCycle != null) {
    return (
      getCurrentGameCycle(currentTimeSeconds, fightEpochCycle) -
      timing.startCycle
    );
  }

  const ticksSinceSpawn =
    getAbsoluteTick(currentTimeSeconds, initialTick) - timing.spawnTick;
  return ticksSinceSpawn * CLIENT_CYCLES_PER_TICK;
}

export function isGraphicObjectVisible(
  currentTimeSeconds: number,
  timing: GraphicObjectCycleTiming,
  initialTick: number,
  fightEpochCycle: number | undefined,
  totalAnimationCycles: number | null,
): boolean {
  const cyclesElapsed = getGraphicObjectAnimationCyclesElapsed(
    currentTimeSeconds,
    timing,
    initialTick,
    fightEpochCycle,
  );

  if (cyclesElapsed < 0) {
    return false;
  }

  if (timing.endCycle != null && fightEpochCycle != null) {
    return (
      getCurrentGameCycle(currentTimeSeconds, fightEpochCycle) < timing.endCycle
    );
  }

  if (totalAnimationCycles != null && cyclesElapsed >= totalAnimationCycles) {
    return false;
  }

  return true;
}
