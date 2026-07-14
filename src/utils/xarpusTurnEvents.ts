import { TICK_DURATION_SECONDS } from "../lib/replayTiming";

/** Ticks from Screech until the first Turn, and between subsequent Turns. */
export const XARPUS_TICKS_PER_TURN_P3 = 8;

const TICK_DURATION_MS = TICK_DURATION_SECONDS * 1000;

/** Hard-mode Xarpus ids — P3 turns are not charted. */
const XARPUS_HARD_NPC_IDS = new Set([10770, 10771, 10772, 10773]);

export function isXarpusHardModeNpcId(npcId: number): boolean {
  return XARPUS_HARD_NPC_IDS.has(npcId);
}

/** Absolute tick of turn {@link turnIndex} (0-based) after a Screech at {@link screechTick}. */
export function getXarpusTurnTick(
  screechTick: number,
  turnIndex: number,
): number {
  return screechTick + (turnIndex + 1) * XARPUS_TICKS_PER_TURN_P3;
}

/** Fight-time ms of turn {@link turnIndex} (0-based) after Screech. */
export function getXarpusTurnFightTimeMs(
  screechFightTimeMs: number,
  turnIndex: number,
): number {
  return (
    screechFightTimeMs +
    (turnIndex + 1) * XARPUS_TICKS_PER_TURN_P3 * TICK_DURATION_MS
  );
}
