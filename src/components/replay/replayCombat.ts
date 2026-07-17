/**
 * Derives the per-tick combat overlay (hitsplats + health bars) for the replay map from a
 * GameState snapshot.
 *
 * Health bar visibility rules:
 *   - Regular NPCs and players: shown only for a few ticks after taking a hit (like the client).
 *   - Bosses (constants.BOSS_IDS / ToB bosses): shown permanently while present.
 *   - ToB bosses with varbit tracking: a single authoritative bar from the wave-progress varbit,
 *     replacing the coarse health-bar ratio so multi-form bosses never stack bars.
 */
import { CombatHitsplat, GameState } from "./GameState";
import { BOSS_IDS } from "../../utils/constants";
import { computeTobBossHp, isTobBoss } from "../../utils/tobBossHealth";

/** How many ticks a health bar lingers on a non-boss after its last hitsplat. */
export const HEALTH_BAR_FADE_TICKS = 5;

export interface HealthBarData {
  fraction: number;
  /** True for boss NPCs, which render a wider health bar than regular entities. */
  isBoss?: boolean;
  /**
   * Reconstructed current/total hitpoints, shown as a numeric label. Only present for ToB bosses,
   * where the party-size-scaled max HP table lets us convert the wave-progress varbit into points.
   */
  hp?: { current: number; max: number };
}

export interface ReplayCombat {
  hitsplats: CombatHitsplat[];
  npcHealthBars: { [npcKey: string]: HealthBarData };
  playerHealthBars: { [playerName: string]: HealthBarData };
}

const BOSS_ID_SET = new Set<number>(BOSS_IDS);

function isBossNpc(npcId: number): boolean {
  return BOSS_ID_SET.has(npcId) || isTobBoss(npcId);
}

function npcIdFromKey(npcKey: string): number {
  const parts = npcKey.split("|");
  return Number(parts[1]);
}

function ratioFraction(ratio?: number, scale?: number): number | null {
  if (
    typeof ratio === "number" &&
    ratio >= 0 &&
    typeof scale === "number" &&
    scale > 0
  ) {
    return Math.max(0, Math.min(1, ratio / scale));
  }
  return null;
}

export function buildReplayCombat(
  gameState: GameState | undefined,
  currentTargetTick: number,
): ReplayCombat {
  const result: ReplayCombat = {
    hitsplats: [],
    npcHealthBars: {},
    playerHealthBars: {},
  };

  if (!gameState) {
    return result;
  }

  // Hitsplats are only rendered on the exact tick they occurred.
  if (gameState.tick === currentTargetTick) {
    result.hitsplats = gameState.hitsplats;
  }

  // Older logs (version < 1.7.0) don't carry health-bar data. Show their hitsplats but no bars.
  if (!gameState.hasHealthData) {
    return result;
  }

  for (const [npcKey, state] of Object.entries(gameState.npcs)) {
    if (!state.position) {
      continue;
    }
    const npcId = npcIdFromKey(npcKey);

    // ToB boss: single authoritative bar from the wave-progress varbit when available.
    if (
      isTobBoss(npcId) &&
      gameState.tobScale != null &&
      gameState.tobBossHpValue != null
    ) {
      const hp = computeTobBossHp(
        npcId,
        gameState.tobScale,
        gameState.tobBossHpValue,
      );
      if (hp && hp.max > 0) {
        result.npcHealthBars[npcKey] = {
          fraction: hp.current / hp.max,
          isBoss: true,
          hp,
        };
        continue;
      }
    }

    const fraction = ratioFraction(state.healthRatio, state.healthScale);

    if (isBossNpc(npcId)) {
      // Bosses keep a bar for the whole fight; default to full until we have a reading.
      result.npcHealthBars[npcKey] = { fraction: fraction ?? 1, isBoss: true };
      continue;
    }

    const recentlyHit =
      state.lastHitTick != null &&
      currentTargetTick >= state.lastHitTick &&
      currentTargetTick - state.lastHitTick <= HEALTH_BAR_FADE_TICKS;
    if (recentlyHit && fraction != null) {
      result.npcHealthBars[npcKey] = { fraction };
    }
  }

  for (const [playerName, state] of Object.entries(gameState.players)) {
    if (!state.position) {
      continue;
    }
    const fraction = ratioFraction(state.healthRatio, state.healthScale);
    const recentlyHit =
      state.lastHitTick != null &&
      currentTargetTick >= state.lastHitTick &&
      currentTargetTick - state.lastHitTick <= HEALTH_BAR_FADE_TICKS;
    if (recentlyHit && fraction != null) {
      result.playerHealthBars[playerName] = { fraction };
    }
  }

  return result;
}
