import { Fight } from "../models/Fight";
import { DamageLog, LogLine, LogTypes } from "../models/LogLine";
import { BOAT_IDS } from "./constants";

export interface PlayerDpsResult {
  playerName: string;
  damageDealt: number;
  dps: number;
}

const SECONDS_PER_TICK = 0.6;

export function getFightDurationSeconds(fight: Fight): number {
  if (fight.metaData.fightDurationTicks > 0) {
    return fight.metaData.fightDurationTicks * SECONDS_PER_TICK;
  }

  return (
    Math.max(
      (fight.lastLine.fightTimeMs ?? 0) - (fight.firstLine.fightTimeMs ?? 0),
      0,
    ) / 1000
  );
}

/** Damage to NPC targets that count toward DPS leaderboards (excludes players and sailing player boats). */
export function isLeaderboardEligibleDamage(damageLog: DamageLog): boolean {
  return (
    Boolean(damageLog.target?.index) &&
    (damageLog.target?.id === undefined ||
      !BOAT_IDS.includes(damageLog.target.id))
  );
}

/**
 * Per-player DPS using the same rules as the backend leaderboard.
 * Pass `logs` when the UI has additional filters applied on top of the fight.
 */
export function calculatePlayerDps(
  fight: Fight,
  logs?: Iterable<LogLine>,
): PlayerDpsResult[] {
  const damageByPlayer = new Map<string, number>();
  const sourceLogs = logs ?? fight.data;

  for (const logLine of sourceLogs) {
    if (logLine.type !== LogTypes.DAMAGE) {
      continue;
    }
    const damageLog = logLine as DamageLog;
    if (!isLeaderboardEligibleDamage(damageLog)) {
      continue;
    }
    const sourceName = damageLog.source?.name;
    if (!sourceName || !fight.players.includes(sourceName)) {
      continue;
    }
    damageByPlayer.set(
      sourceName,
      (damageByPlayer.get(sourceName) ?? 0) + damageLog.damageAmount,
    );
  }

  const durationSeconds = getFightDurationSeconds(fight);
  if (durationSeconds <= 0) {
    return [];
  }

  return fight.players
    .map((playerName) => {
      const damageDealt = damageByPlayer.get(playerName) ?? 0;
      return {
        playerName,
        damageDealt,
        dps: damageDealt / durationSeconds,
      };
    })
    .filter((result) => result.damageDealt > 0);
}

/** Total fight DPS from the logs currently in view (already filtered by the caller). */
export function calculateFightDps(fight: Fight): number {
  const durationSeconds = getFightDurationSeconds(fight);
  if (durationSeconds <= 0) {
    return NaN;
  }

  let totalDamage = 0;
  for (const logLine of fight.data) {
    if (logLine.type !== LogTypes.DAMAGE) {
      continue;
    }
    totalDamage += (logLine as DamageLog).damageAmount;
  }

  return totalDamage / durationSeconds;
}
