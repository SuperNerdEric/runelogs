/**
 * Injects Xarpus P1 Exhume spawn cells onto the Xarpus tick-chart row from
 * {@link LogTypes.GROUND_OBJECT_SPAWNED} lines (object id 32743).
 */

import { groundObjectIdMap } from "../lib/groundObjectIdMap";

/** Ground object id for a Xarpus exhume pool. */
export const XARPUS_EXHUMED_GROUND_OBJECT_ID = 32743;

export const XARPUS_EXHUMED_IMAGE_URL =
  groundObjectIdMap[XARPUS_EXHUMED_GROUND_OBJECT_ID]?.imageUrl ?? "";

export type XarpusExhumeHighlightInput = {
  attackName: string;
  animationId: number;
};

export type XarpusExhumeSpawn = {
  tick: number;
  fightTimeMs?: number;
};

/**
 * Place an Exhume icon on each Xarpus row for every spawn tick. Does not
 * overwrite an existing cell (spit/turn should not share a tick with P1).
 */
export function injectXarpusExhumeAttacks<T extends XarpusExhumeHighlightInput>(
  npcAttackAnimationsByTick: Record<number, Record<string, T>>,
  xarpusNpcKeys: readonly string[],
  spawns: readonly XarpusExhumeSpawn[],
  createExhume: (spawn: XarpusExhumeSpawn, npcKey: string) => T,
): void {
  if (xarpusNpcKeys.length === 0 || spawns.length === 0) {
    return;
  }

  for (const spawn of spawns) {
    for (const npcKey of xarpusNpcKeys) {
      if (npcAttackAnimationsByTick[spawn.tick]?.[npcKey]) {
        continue;
      }
      if (!npcAttackAnimationsByTick[spawn.tick]) {
        npcAttackAnimationsByTick[spawn.tick] = {};
      }
      npcAttackAnimationsByTick[spawn.tick][npcKey] = createExhume(
        spawn,
        npcKey,
      );
    }
  }
}

export function isXarpusExhumedGroundObjectId(id: number): boolean {
  return id === XARPUS_EXHUMED_GROUND_OBJECT_ID;
}
