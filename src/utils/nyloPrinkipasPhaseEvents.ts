import { Fight } from "../models/Fight";
import { Actor } from "../models/Actor";
import { LogLine } from "../models/LogLine";
import { TICK_DURATION_SECONDS } from "../lib/replayTiming";

/**
 * All Nylocas Prinkipas ("Nylo miniboss") NPC ids. Hard Mode Theatre of Blood
 * only. The miniboss morphs between combat styles (each style is its own id,
 * and each morph is allocated a fresh scene index), so instance identity is not
 * stable — spawns are detected by clustering sightings in time instead.
 *
 * Three Prinkipas spawn during the Nylocas room (waves 10, 20, 30), so their
 * appearances are a reliable phase signal even for logs recorded before
 * boss-HP tracking existed.
 */
export const NYLOCAS_PRINKIPAS_IDS: ReadonlySet<number> = new Set([
  10803, 10804, 10805, 10806,
]);

/** Divider caption / tooltip name for a Prinkipas spawn marker. */
export const NYLO_PRINKIPAS_PHASE_LABEL = "Prinkipas Spawn";

const TICK_DURATION_MS = TICK_DURATION_SECONDS * 1000;

/**
 * A Prinkipas is continuously on-screen for its short life (~16 ticks) and the
 * gap between the three spawns is much larger (~75+ ticks). Sightings more than
 * this many ticks apart therefore belong to different spawns; the window stays
 * comfortably above intra-life sighting gaps and below the inter-spawn gap.
 */
export const NYLO_PRINKIPAS_SESSION_GAP_TICKS = 20;

/** Minimum sightings in a spawn session, guarding against a stray mis-parse. */
export const NYLO_PRINKIPAS_MIN_SESSION_SIZE = 2;

export interface NyloPrinkipasPhaseMarker {
  /** Divider caption, always "Prinkipas Spawn". */
  label: string;
  /** 1-based order of this spawn within the fight. */
  waveNumber: number;
  /** Fight-time ms of the first sighting in the spawn session. */
  fightTimeMs: number;
  /** Absolute log tick of the first sighting in the spawn session. */
  tick: number;
  /** Sightings observed for this spawn session. */
  spawnCount: number;
}

/** Actors referenced by a log line that could be a Prinkipas. */
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
 * Phase dividers for Nylocas Vasilias (Hard Mode) damage charts, one per
 * Nylocas Prinkipas miniboss spawn. Sightings of any Prinkipas form are sorted
 * by time and split into sessions whenever the gap exceeds
 * {@link NYLO_PRINKIPAS_SESSION_GAP_TICKS}; each session yields one marker at
 * its earliest sighting.
 */
export function getNyloPrinkipasPhaseMarkers(
  fight: Fight,
): NyloPrinkipasPhaseMarker[] {
  const sightings: { fightTimeMs: number; tick: number }[] = [];

  for (const log of fight.data) {
    const fightTimeMs = log.fightTimeMs;
    if (fightTimeMs == null || log.tick == null) {
      continue;
    }
    for (const actor of actorsInLog(log)) {
      if (actor?.id == null || !NYLOCAS_PRINKIPAS_IDS.has(actor.id)) {
        continue;
      }
      sightings.push({ fightTimeMs, tick: log.tick });
    }
  }

  if (sightings.length === 0) {
    return [];
  }

  sightings.sort((a, b) => a.fightTimeMs - b.fightTimeMs);

  const gapMs = NYLO_PRINKIPAS_SESSION_GAP_TICKS * TICK_DURATION_MS;
  const sessions: {
    startMs: number;
    startTick: number;
    lastMs: number;
    count: number;
  }[] = [];
  for (const sighting of sightings) {
    const current = sessions[sessions.length - 1];
    if (current && sighting.fightTimeMs - current.lastMs <= gapMs) {
      current.lastMs = sighting.fightTimeMs;
      current.count += 1;
    } else {
      sessions.push({
        startMs: sighting.fightTimeMs,
        startTick: sighting.tick,
        lastMs: sighting.fightTimeMs,
        count: 1,
      });
    }
  }

  return sessions
    .filter((session) => session.count >= NYLO_PRINKIPAS_MIN_SESSION_SIZE)
    .map((session, index) => ({
      label: NYLO_PRINKIPAS_PHASE_LABEL,
      waveNumber: index + 1,
      fightTimeMs: session.startMs,
      tick: session.startTick,
      spawnCount: session.count,
    }));
}
