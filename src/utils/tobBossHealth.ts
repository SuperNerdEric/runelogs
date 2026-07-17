/**
 * Theatre of Blood boss health math.
 *
 * The combat-logger plugin logs two raw signals so the frontend can derive precise boss hitpoints:
 *   - `TOB_SCALE`    : the raid party size (1-5), once per raid.
 *   - `TOB_BOSS_HP`  : the `TOB_CLIENT_WAVEPROGRESS_VAL` varbit (0-1000, permille of the active
 *                      boss's health remaining) whenever it changes.
 *
 * Combined with a scale-aware max-hitpoints table (below), the current hitpoints of the active
 * per-room boss can be reconstructed as `maxHp * value / 1000`.
 */

type BossMode = "entry" | "normal";

interface TobBossHp {
  /** Base hitpoints indexed as [scale 1-3, scale 4, scale 5]. */
  hitpointsByScale: [number, number, number];
  mode: BossMode;
  /** Nylo bosses do not scale their entry-mode hitpoints with party size. */
  nyloBoss?: boolean;
}

interface TobBossEntry extends TobBossHp {
  /** First NPC id of the (inclusive) range this entry covers. */
  id: number;
  /** Number of consecutive NPC ids this entry covers (for multi-form bosses like Maiden). */
  idRange: number;
}

/**
 * Per-room main bosses whose health is reflected by the wave-progress varbit. Ported from the
 * canonical Theatre of Blood hitpoints table (minions/crabs are intentionally excluded).
 */
const TOB_BOSSES: TobBossEntry[] = [
  // Maiden.
  { id: 10814, idRange: 6, mode: "entry", hitpointsByScale: [500, 500, 500] },
  {
    id: 8360,
    idRange: 6,
    mode: "normal",
    hitpointsByScale: [2625, 3062, 3500],
  },
  {
    id: 10822,
    idRange: 6,
    mode: "normal",
    hitpointsByScale: [2625, 3062, 3500],
  },

  // Bloat.
  { id: 10812, idRange: 1, mode: "entry", hitpointsByScale: [320, 320, 320] },
  {
    id: 8359,
    idRange: 1,
    mode: "normal",
    hitpointsByScale: [1500, 1750, 2000],
  },
  {
    id: 10813,
    idRange: 1,
    mode: "normal",
    hitpointsByScale: [1800, 2100, 2400],
  },

  // Nylocas Prinkipas (HMT only).
  {
    id: 10803,
    idRange: 4,
    mode: "normal",
    nyloBoss: true,
    hitpointsByScale: [300, 350, 400],
  },

  // Nylocas Vasilias (Nylo king).
  {
    id: 10787,
    idRange: 4,
    mode: "entry",
    nyloBoss: true,
    hitpointsByScale: [360, 360, 360],
  },
  {
    id: 8354,
    idRange: 4,
    mode: "normal",
    nyloBoss: true,
    hitpointsByScale: [1875, 2187, 2500],
  },
  {
    id: 10807,
    idRange: 4,
    mode: "normal",
    nyloBoss: true,
    hitpointsByScale: [1875, 2187, 2500],
  },

  // Sotetseg (idle + combat forms share hitpoints).
  { id: 10864, idRange: 1, mode: "entry", hitpointsByScale: [560, 560, 560] },
  {
    id: 8387,
    idRange: 1,
    mode: "normal",
    hitpointsByScale: [3000, 3500, 4000],
  },
  {
    id: 10867,
    idRange: 1,
    mode: "normal",
    hitpointsByScale: [3000, 3500, 4000],
  },
  { id: 10865, idRange: 1, mode: "entry", hitpointsByScale: [560, 560, 560] },
  {
    id: 8388,
    idRange: 1,
    mode: "normal",
    hitpointsByScale: [3000, 3500, 4000],
  },
  {
    id: 10868,
    idRange: 1,
    mode: "normal",
    hitpointsByScale: [3000, 3500, 4000],
  },

  // Xarpus (idle / P1 exhume / main share hitpoints).
  { id: 10766, idRange: 1, mode: "entry", hitpointsByScale: [680, 680, 680] },
  {
    id: 8338,
    idRange: 1,
    mode: "normal",
    hitpointsByScale: [3810, 4445, 5080],
  },
  {
    id: 10770,
    idRange: 1,
    mode: "normal",
    hitpointsByScale: [4500, 5250, 6000],
  },
  { id: 10767, idRange: 1, mode: "entry", hitpointsByScale: [680, 680, 680] },
  {
    id: 8339,
    idRange: 1,
    mode: "normal",
    hitpointsByScale: [3810, 4445, 5080],
  },
  {
    id: 10771,
    idRange: 1,
    mode: "normal",
    hitpointsByScale: [4500, 5250, 6000],
  },
  { id: 10768, idRange: 1, mode: "entry", hitpointsByScale: [680, 680, 680] },
  {
    id: 8340,
    idRange: 1,
    mode: "normal",
    hitpointsByScale: [3810, 4445, 5080],
  },
  {
    id: 10772,
    idRange: 1,
    mode: "normal",
    hitpointsByScale: [4500, 5250, 6000],
  },

  // Verzik P1 (story / normal / hard).
  { id: 10831, idRange: 1, mode: "entry", hitpointsByScale: [240, 240, 240] },
  {
    id: 8370,
    idRange: 1,
    mode: "normal",
    hitpointsByScale: [1500, 1750, 2000],
  },
  {
    id: 10848,
    idRange: 1,
    mode: "normal",
    hitpointsByScale: [1500, 1750, 2000],
  },

  // Verzik P2.
  { id: 10833, idRange: 1, mode: "entry", hitpointsByScale: [320, 320, 320] },
  {
    id: 8372,
    idRange: 1,
    mode: "normal",
    hitpointsByScale: [2437, 2843, 3250],
  },
  {
    id: 10850,
    idRange: 1,
    mode: "normal",
    hitpointsByScale: [2437, 2843, 3250],
  },

  // Verzik P3.
  { id: 10835, idRange: 1, mode: "entry", hitpointsByScale: [320, 320, 320] },
  {
    id: 8374,
    idRange: 1,
    mode: "normal",
    hitpointsByScale: [2437, 2843, 3250],
  },
  {
    id: 10852,
    idRange: 1,
    mode: "normal",
    hitpointsByScale: [2437, 2843, 3250],
  },
];

const TOB_BOSS_BY_ID: Map<number, TobBossHp> = (() => {
  const map = new Map<number, TobBossHp>();
  for (const boss of TOB_BOSSES) {
    for (let i = 0; i < boss.idRange; i++) {
      map.set(boss.id + i, boss);
    }
  }
  return map;
})();

/** @returns true if the NPC id is a per-room ToB main boss tracked by the wave-progress varbit. */
export function isTobBoss(npcId: number): boolean {
  return TOB_BOSS_BY_ID.has(npcId);
}

/**
 * @param npcId the boss NPC id
 * @param scale the raid party size (1-5), from a `TOB_SCALE` log line
 * @returns the boss's max hitpoints for the given scale, or null if unknown
 */
export function getTobBossMaxHp(npcId: number, scale: number): number | null {
  const boss = TOB_BOSS_BY_ID.get(npcId);
  if (!boss || scale < 1 || scale > 5) {
    return null;
  }

  if (boss.mode === "entry") {
    // Entry mode scales linearly with party size, except for nylo bosses which are fixed.
    return boss.nyloBoss
      ? boss.hitpointsByScale[0]
      : boss.hitpointsByScale[0] * scale;
  }

  if (scale === 5) return boss.hitpointsByScale[2];
  if (scale === 4) return boss.hitpointsByScale[1];
  return boss.hitpointsByScale[0];
}

/**
 * Reconstructs a ToB boss's current/max hitpoints from the logged scale and wave-progress varbit.
 *
 * @param npcId              the active boss NPC id
 * @param scale              the raid party size (1-5), from a `TOB_SCALE` log line
 * @param waveProgressValue  the `TOB_BOSS_HP` value (0-1000)
 * @returns `{ current, max }`, or null if the boss/scale is unknown
 */
export function computeTobBossHp(
  npcId: number,
  scale: number,
  waveProgressValue: number,
): { current: number; max: number } | null {
  const max = getTobBossMaxHp(npcId, scale);
  if (max === null) {
    return null;
  }

  const clamped = Math.max(0, Math.min(1000, waveProgressValue));
  const current = Math.min(Math.round((max * clamped) / 1000), max);
  return { current, max };
}
