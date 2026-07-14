/**
 * Synthesizes Xarpus P3 Turn attack cells from a logged Screech marker.
 *
 * First turn is Screech + {@link XARPUS_TICKS_PER_TURN_P3}, then every 8 ticks
 * through {@link maxTick}. Hard-mode Xarpus is skipped.
 */

import {
  getXarpusTurnFightTimeMs,
  getXarpusTurnTick,
  isXarpusHardModeNpcId,
  XARPUS_TICKS_PER_TURN_P3,
} from "./xarpusTurnEvents";

export type XarpusScreechMarker = {
  npcKey: string;
  tick: number;
  npcId: number;
  npcName: string;
  fightTimeMs?: number;
  targetName?: string;
};

export type XarpusTurnHighlightInput = {
  attackName: string;
  animationId: number;
};

/**
 * Inject synthesized Turn cells from Screech markers so the tick chart can
 * show the Turn icon. Does not overwrite an existing cell on that tick/row.
 */
export function synthesizeXarpusTurnAttacks<T extends XarpusTurnHighlightInput>(
  npcAttackAnimationsByTick: Record<number, Record<string, T>>,
  screeches: readonly XarpusScreechMarker[],
  maxTick: number,
  createTurn: (
    screech: XarpusScreechMarker,
    turnTick: number,
    turnIndex: number,
  ) => T,
): void {
  for (const screech of screeches) {
    if (isXarpusHardModeNpcId(screech.npcId)) {
      continue;
    }

    for (let turnIndex = 0; ; turnIndex++) {
      const turnTick = getXarpusTurnTick(screech.tick, turnIndex);
      if (turnTick > maxTick) {
        break;
      }
      if (npcAttackAnimationsByTick[turnTick]?.[screech.npcKey]) {
        continue;
      }
      if (!npcAttackAnimationsByTick[turnTick]) {
        npcAttackAnimationsByTick[turnTick] = {};
      }
      npcAttackAnimationsByTick[turnTick][screech.npcKey] = createTurn(
        screech,
        turnTick,
        turnIndex,
      );
    }
  }
}

export { XARPUS_TICKS_PER_TURN_P3, getXarpusTurnFightTimeMs };
