import { Fight } from "../models/Fight";
import { NpcChangedLog, filterByType, LogTypes } from "../models/LogLine";
import { TICK_DURATION_SECONDS } from "../lib/replayTiming";

/** Divider caption / tooltip name for the Xarpus Phase 2 marker. */
export const XARPUS_PHASE2_PHASE_LABEL = "Phase 2";

/** Phase 2 begins this many ticks after the NPC-changed transition. */
export const XARPUS_PHASE2_DELAY_TICKS = 2;

const TICK_DURATION_MS = TICK_DURATION_SECONDS * 1000;

/**
 * Old-id -> new-id NPC transitions that mark Xarpus entering Phase 2, per game
 * mode. Xarpus logs an "NPC Changed" from its P1 form to its P2 form; the phase
 * itself begins {@link XARPUS_PHASE2_DELAY_TICKS} ticks later.
 */
const XARPUS_PHASE2_TRANSITIONS: ReadonlyArray<{ from: number; to: number }> = [
  { from: 8339, to: 8340 }, // regular
  { from: 10767, to: 10768 }, // entry
  { from: 10771, to: 10772 }, // hard
];

export interface XarpusPhase2PhaseMarker {
  /** Divider caption, always "Phase 2". */
  label: string;
  /** Fight-time ms of the phase start (transition + delay). */
  fightTimeMs: number;
  /** Absolute log tick of the phase start (transition + delay). */
  tick: number;
}

function isPhase2Transition(oldId?: number, newId?: number): boolean {
  return XARPUS_PHASE2_TRANSITIONS.some(
    (transition) => transition.from === oldId && transition.to === newId,
  );
}

/**
 * Phase divider for Xarpus damage charts at the start of Phase 2. Detected from
 * the P1->P2 "NPC Changed" transition (offset by {@link XARPUS_PHASE2_DELAY_TICKS}
 * ticks). Older logs that don't record the transition simply yield no marker.
 */
export function getXarpusPhase2Markers(
  fight: Fight,
): XarpusPhase2PhaseMarker[] {
  const markers: XarpusPhase2PhaseMarker[] = [];
  const seenTicks = new Set<number>();

  for (const log of filterByType(fight.data, LogTypes.NPC_CHANGED)) {
    const changed = log as NpcChangedLog;
    if (
      changed.fightTimeMs == null ||
      changed.tick == null ||
      !isPhase2Transition(changed.oldNpc?.id, changed.newNpc?.id)
    ) {
      continue;
    }
    const tick = changed.tick + XARPUS_PHASE2_DELAY_TICKS;
    if (seenTicks.has(tick)) {
      continue;
    }
    seenTicks.add(tick);
    markers.push({
      label: XARPUS_PHASE2_PHASE_LABEL,
      fightTimeMs:
        changed.fightTimeMs + XARPUS_PHASE2_DELAY_TICKS * TICK_DURATION_MS,
      tick,
    });
  }

  markers.sort((a, b) => a.fightTimeMs - b.fightTimeMs);
  return markers;
}
