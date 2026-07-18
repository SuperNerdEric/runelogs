import { Fight } from "../models/Fight";
import { AttackAnimationLog, filterByType, LogTypes } from "../models/LogLine";

/** Tooltip / hover-context name for the Xarpus Screech marker. */
export const XARPUS_SCREECH_PHASE_TITLE = "Phase 3: Screech";

/** Short divider caption rendered under the icon. */
export const XARPUS_SCREECH_PHASE_CAPTION = "Phase 3";

export interface XarpusScreechPhaseMarker {
  /** Short divider caption ("Phase 3"). */
  label: string;
  /** Fight-time ms of the Screech. */
  fightTimeMs: number;
  /** Absolute log tick of the Screech. */
  tick: number;
}

/**
 * Phase divider for Xarpus damage charts, at the P3 Screech. Xarpus logs a
 * SCREECH attack special when it enters its final "staring" phase, so it is a
 * reliable phase signal even for logs recorded before boss-HP tracking existed.
 * Returns a marker per Screech (normally one) in chronological order.
 */
export function getXarpusScreechMarkers(
  fight: Fight,
): XarpusScreechPhaseMarker[] {
  const markers: XarpusScreechPhaseMarker[] = [];
  const seenTicks = new Set<number>();

  for (const log of filterByType(
    fight.data,
    LogTypes.PLAYER_ATTACK_ANIMATION,
  )) {
    const attackLog = log as AttackAnimationLog;
    if (
      attackLog.attackSpecial !== "SCREECH" ||
      attackLog.fightTimeMs == null ||
      attackLog.tick == null ||
      seenTicks.has(attackLog.tick)
    ) {
      continue;
    }
    seenTicks.add(attackLog.tick);
    markers.push({
      label: XARPUS_SCREECH_PHASE_CAPTION,
      fightTimeMs: attackLog.fightTimeMs,
      tick: attackLog.tick,
    });
  }

  markers.sort((a, b) => a.fightTimeMs - b.fightTimeMs);
  return markers;
}
