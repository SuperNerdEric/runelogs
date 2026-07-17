import { Fight } from "../models/Fight";
import { Actor } from "../models/Actor";
import { LogLine } from "../models/LogLine";

/**
 * All Nylocas Vasilias ("Nylo Boss") NPC ids across ToB modes and combat
 * styles (melee / range / mage forms). The boss only appears once the wave
 * phase of the Nylocas room ends, so its first sighting is a reliable "boss
 * spawn" signal even for old logs recorded before boss-HP tracking existed.
 */
export const NYLOCAS_VASILIAS_IDS: ReadonlySet<number> = new Set([
  8354,
  8355,
  8356,
  8357, // regular
  10786,
  10787,
  10788,
  10789, // entry
  10807,
  10808,
  10809,
  10810, // hard
]);

/** Divider caption for the boss-spawn marker. */
export const NYLO_BOSS_PHASE_LABEL = "Boss Spawn";

/** Tooltip / tick-event title for the boss-spawn marker. */
export const NYLO_BOSS_PHASE_TITLE = "Nylocas Vasilias Spawn";

export interface NyloBossPhaseMarker {
  /** Divider caption, e.g. "Boss". */
  label: string;
  /** Fight-time ms of the first Nylocas Vasilias sighting. */
  fightTimeMs: number;
  /** Absolute log tick of the first Nylocas Vasilias sighting. */
  tick: number;
}

/** Actors referenced by a log line that could be the Nylo boss. */
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
 * Phase divider for Nylocas Vasilias damage charts: a single marker at the
 * moment the boss spawns (its earliest sighting in the fight). Returns an empty
 * array when the boss never appears (e.g. a wave-only partial log).
 */
export function getNyloBossPhaseMarkers(fight: Fight): NyloBossPhaseMarker[] {
  let earliest: { fightTimeMs: number; tick: number } | null = null;

  for (const log of fight.data) {
    const fightTimeMs = log.fightTimeMs;
    if (fightTimeMs == null || log.tick == null) {
      continue;
    }
    for (const actor of actorsInLog(log)) {
      if (actor?.id == null || !NYLOCAS_VASILIAS_IDS.has(actor.id)) {
        continue;
      }
      if (earliest == null || fightTimeMs < earliest.fightTimeMs) {
        earliest = { fightTimeMs, tick: log.tick };
      }
    }
  }

  if (earliest == null) {
    return [];
  }

  return [
    {
      label: NYLO_BOSS_PHASE_LABEL,
      fightTimeMs: earliest.fightTimeMs,
      tick: earliest.tick,
    },
  ];
}

/** Row-key prefix for the Nylo boss's tracked tick-chart row(s). */
export const NYLO_BOSS_ROW_PREFIX = "nylocas-vasilias:";

/**
 * Place a Nylocas Vasilias spawn icon on each Nylo-boss tick-chart row at the
 * boss-spawn tick. Mirrors the Maiden/Xarpus injection: never overwrites an
 * existing cell (a real boss attack on that tick takes precedence).
 */
export function injectNyloBossPhaseSpawnAttacks<T>(
  npcAttackAnimationsByTick: Record<number, Record<string, T>>,
  nyloBossNpcKeys: readonly string[],
  markers: readonly NyloBossPhaseMarker[],
  createSpawn: (marker: NyloBossPhaseMarker, npcKey: string) => T,
): void {
  if (nyloBossNpcKeys.length === 0 || markers.length === 0) {
    return;
  }

  for (const marker of markers) {
    for (const npcKey of nyloBossNpcKeys) {
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
