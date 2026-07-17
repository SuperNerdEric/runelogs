import { Fight } from "../models/Fight";
import { Actor } from "../models/Actor";
import { LogLine } from "../models/LogLine";
import { TICK_DURATION_SECONDS } from "../lib/replayTiming";

/**
 * All Nylocas Matomenos NPC ids across ToB modes (regular / entry / hard).
 * These "crabs" only spawn during The Maiden of Sugadinti fight, in a burst at
 * each HP threshold, so their appearance is a reliable phase signal even for
 * old logs recorded before boss-HP tracking existed.
 */
export const NYLOCAS_MATOMENOS_IDS: ReadonlySet<number> = new Set([
  8366,
  8385, // regular
  10820,
  10828, // entry mode
  10845,
  10862, // hard mode
  15993,
]);

/**
 * Ordered HP thresholds where Maiden spawns a Nylocas Matomenos wave. Labels
 * are HP-based but detection is spawn-based (see module docstring above).
 */
export const MAIDEN_PHASE_LABELS = ["70%", "50%", "30%"] as const;

const TICK_DURATION_MS = TICK_DURATION_SECONDS * 1000;

/**
 * Matomenos from a single threshold all spawn on the same tick. First sightings
 * within this window are merged into one wave; it stays far below the many-tick
 * pause between thresholds so distinct waves never merge.
 */
export const MAIDEN_PHASE_WAVE_MERGE_TICKS = 2;

/** Minimum Matomenos in a spawn wave, guarding against a stray mis-parse. */
export const MAIDEN_PHASE_MIN_WAVE_SIZE = 2;

export interface MaidenPhaseMarker {
  /** HP-threshold label: "70%", "50%", or "30%". */
  label: string;
  /** 1-based order of this spawn wave within the fight. */
  waveNumber: number;
  /** Fight-time ms of the first Matomenos sighting in the wave. */
  fightTimeMs: number;
  /** Absolute log tick of the first Matomenos sighting in the wave. */
  tick: number;
  /** Distinct Matomenos instances that spawned in this wave. */
  spawnCount: number;
}

interface FirstSighting {
  fightTimeMs: number;
  tick: number;
}

/** Actors referenced by a log line that could be a Matomenos. */
function actorsInLog(log: LogLine): Actor[] {
  const actors: Actor[] = [];
  const record = log as unknown as {
    source?: Actor;
    target?: Actor;
    oldNpc?: Actor;
    newNpc?: Actor;
  };
  if (record.source) {
    actors.push(record.source);
  }
  if (record.target) {
    actors.push(record.target);
  }
  if (record.oldNpc) {
    actors.push(record.oldNpc);
  }
  if (record.newNpc) {
    actors.push(record.newNpc);
  }
  return actors;
}

/**
 * Phase dividers for Maiden of Sugadinti damage charts, derived from Nylocas
 * Matomenos spawn bursts. Each threshold spawns a batch of crabs on one tick;
 * the batches are labeled "70%", "50%", "30%" in the order they appear.
 */
export function getMaidenPhaseMarkers(fight: Fight): MaidenPhaseMarker[] {
  // Earliest sighting per distinct crab instance (id + scene index).
  const firstSeenByInstance = new Map<string, FirstSighting>();

  for (const log of fight.data) {
    const fightTimeMs = log.fightTimeMs;
    if (fightTimeMs == null || log.tick == null) {
      continue;
    }
    for (const actor of actorsInLog(log)) {
      if (
        actor?.id == null ||
        actor.index == null ||
        !NYLOCAS_MATOMENOS_IDS.has(actor.id)
      ) {
        continue;
      }
      const key = `${actor.id}:${actor.index}`;
      const existing = firstSeenByInstance.get(key);
      if (existing == null || fightTimeMs < existing.fightTimeMs) {
        firstSeenByInstance.set(key, { fightTimeMs, tick: log.tick });
      }
    }
  }

  if (firstSeenByInstance.size === 0) {
    return [];
  }

  const sightings = Array.from(firstSeenByInstance.values()).sort(
    (a, b) => a.fightTimeMs - b.fightTimeMs,
  );

  // Group first sightings that land within the merge window into one wave.
  const mergeWindowMs = MAIDEN_PHASE_WAVE_MERGE_TICKS * TICK_DURATION_MS;
  const waves: { startMs: number; startTick: number; count: number }[] = [];
  for (const sighting of sightings) {
    const current = waves[waves.length - 1];
    if (current && sighting.fightTimeMs - current.startMs <= mergeWindowMs) {
      current.count += 1;
    } else {
      waves.push({
        startMs: sighting.fightTimeMs,
        startTick: sighting.tick,
        count: 1,
      });
    }
  }

  return waves
    .filter((wave) => wave.count >= MAIDEN_PHASE_MIN_WAVE_SIZE)
    .slice(0, MAIDEN_PHASE_LABELS.length)
    .map((wave, index) => ({
      label: MAIDEN_PHASE_LABELS[index],
      waveNumber: index + 1,
      fightTimeMs: wave.startMs,
      tick: wave.startTick,
      spawnCount: wave.count,
    }));
}

/** Row-key prefix for Maiden's tracked tick-chart row(s). */
export const MAIDEN_ROW_PREFIX = "maiden:";

/**
 * Place a Nylocas Matomenos spawn icon on each Maiden tick-chart row at every
 * phase-spawn tick. Mirrors the Xarpus exhume injection: never overwrites an
 * existing cell (a real Maiden attack on that tick takes precedence).
 */
export function injectMaidenPhaseSpawnAttacks<T>(
  npcAttackAnimationsByTick: Record<number, Record<string, T>>,
  maidenNpcKeys: readonly string[],
  markers: readonly MaidenPhaseMarker[],
  createSpawn: (marker: MaidenPhaseMarker, npcKey: string) => T,
): void {
  if (maidenNpcKeys.length === 0 || markers.length === 0) {
    return;
  }

  for (const marker of markers) {
    for (const npcKey of maidenNpcKeys) {
      if (npcAttackAnimationsByTick[marker.tick]?.[npcKey]) {
        continue;
      }
      if (!npcAttackAnimationsByTick[marker.tick]) {
        npcAttackAnimationsByTick[marker.tick] = {};
      }
      npcAttackAnimationsByTick[marker.tick][npcKey] = createSpawn(
        marker,
        npcKey,
      );
    }
  }
}
