/**
 * Builds per-tick highlights for Bloat's down window on the tick chart.
 *
 * After a Down, every following tick is highlighted through Stomp and 3 ticks
 * past it (full {@link BLOAT_DOWN_CYCLE_TICKS} cycle). Stomp is synthesized at
 * Down + {@link BLOAT_STOMP_OFFSET_TICKS}. If the fight ends during a Down before
 * the cycle completes, highlighting continues through {@link maxTick}.
 */

import {
  BLOAT_DOWN_CYCLE_TICKS,
  BLOAT_STOMP_COUNTDOWN_TICK,
  BLOAT_STOMP_OFFSET_TICKS,
  getBloatDownEndTick,
  getBloatStompTick,
} from "./bloatDownEvents";

export type NpcAttackHighlightInput = {
  attackName: string;
  animationId: number;
};

type NpcAttacksByTick = Record<number, Record<string, NpcAttackHighlightInput>>;

/** tick -> npcRowKey -> 1-based down cycle number */
export type BloatDownHighlightTicks = Record<number, Record<string, number>>;

const BLOAT_ROW_PREFIX = "bloat:";

function isBloatDownAttack(attack: NpcAttackHighlightInput): boolean {
  return attack.animationId === 8082 || attack.attackName === "Down";
}

function isBloatStompAttack(attack: NpcAttackHighlightInput): boolean {
  return attack.attackName === "Stomp";
}

/** Tooltip label for a highlighted Down tick. */
export function formatBloatDownContextLabel(
  downNumber: number,
  options?: {
    isDownAttack?: boolean;
    isWindowEnd?: boolean;
  },
): string {
  if (options?.isDownAttack) {
    return `Down ${downNumber} Start`;
  }
  if (options?.isWindowEnd) {
    return `Down ${downNumber} End`;
  }
  return `Down ${downNumber}`;
}

function findWindowEndTick(downTick: number, maxTick: number): number {
  const cycleEnd = getBloatDownEndTick(downTick);
  if (cycleEnd <= maxTick) {
    return cycleEnd;
  }
  return maxTick;
}

/**
 * Inject synthesized Stomp attack cells so the tick chart can show the Stomp icon.
 */
export function synthesizeBloatStompAttacks<T extends NpcAttackHighlightInput>(
  npcAttackAnimationsByTick: Record<number, Record<string, T>>,
  maxTick: number,
  createStomp: (downAttack: T, stompTick: number) => T,
): void {
  const downTicksByKey = new Map<string, Array<{ tick: number; attack: T }>>();

  for (const [tickKey, attacksByNpc] of Object.entries(
    npcAttackAnimationsByTick,
  )) {
    const tick = Number(tickKey);
    if (!Number.isFinite(tick)) {
      continue;
    }
    for (const [npcKey, attack] of Object.entries(attacksByNpc)) {
      if (!npcKey.startsWith(BLOAT_ROW_PREFIX) || !isBloatDownAttack(attack)) {
        continue;
      }
      const downs = downTicksByKey.get(npcKey) ?? [];
      downs.push({ tick, attack });
      downTicksByKey.set(npcKey, downs);
    }
  }

  for (const [npcKey, downs] of downTicksByKey) {
    for (const { tick: downTick, attack: downAttack } of downs) {
      const stompTick = getBloatStompTick(downTick);
      if (stompTick > maxTick || stompTick === downTick) {
        continue;
      }
      if (!npcAttackAnimationsByTick[stompTick]) {
        npcAttackAnimationsByTick[stompTick] = {};
      }
      npcAttackAnimationsByTick[stompTick][npcKey] = createStomp(
        downAttack,
        stompTick,
      );
    }
  }
}

/**
 * @returns map of tick -> npcRowKey -> down cycle number (1-based)
 */
export function buildBloatDownHighlightTicks(
  npcAttackAnimationsByTick: NpcAttacksByTick,
  maxTick: number,
): BloatDownHighlightTicks {
  const bloatKeys = new Set<string>();
  let minTick = maxTick;

  for (const [tickKey, attacksByNpc] of Object.entries(
    npcAttackAnimationsByTick,
  )) {
    const tick = Number(tickKey);
    if (!Number.isFinite(tick)) {
      continue;
    }
    for (const [npcKey, attack] of Object.entries(attacksByNpc)) {
      if (!npcKey.startsWith(BLOAT_ROW_PREFIX)) {
        continue;
      }
      if (!isBloatDownAttack(attack) && !isBloatStompAttack(attack)) {
        continue;
      }
      bloatKeys.add(npcKey);
      if (tick < minTick) {
        minTick = tick;
      }
    }
  }

  if (bloatKeys.size === 0 || minTick > maxTick) {
    return {};
  }

  const highlights: BloatDownHighlightTicks = {};
  const endTickByKey = new Map<string, number>();
  const activeCycleByKey = new Map<string, number>();
  const nextCycleByKey = new Map<string, number>();

  for (let tick = minTick; tick <= maxTick; tick++) {
    const attacksAtTick = npcAttackAnimationsByTick[tick];

    for (const npcKey of bloatKeys) {
      const attack = attacksAtTick?.[npcKey];
      if (attack && isBloatDownAttack(attack)) {
        const cycle = (nextCycleByKey.get(npcKey) ?? 0) + 1;
        nextCycleByKey.set(npcKey, cycle);
        activeCycleByKey.set(npcKey, cycle);
        endTickByKey.set(npcKey, findWindowEndTick(tick, maxTick));
      }

      const activeCycle = activeCycleByKey.get(npcKey);
      if (activeCycle == null) {
        continue;
      }

      if (!highlights[tick]) {
        highlights[tick] = {};
      }
      highlights[tick][npcKey] = activeCycle;

      if (endTickByKey.get(npcKey) === tick) {
        activeCycleByKey.delete(npcKey);
        endTickByKey.delete(npcKey);
      }
    }
  }

  return highlights;
}

export {
  BLOAT_DOWN_CYCLE_TICKS,
  BLOAT_STOMP_COUNTDOWN_TICK,
  BLOAT_STOMP_OFFSET_TICKS,
};
