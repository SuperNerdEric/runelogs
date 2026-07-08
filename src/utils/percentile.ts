import { colors } from "../theme";
import { isUnknownPlayer } from "./actorUtils";
import { getDpsPercentileColor } from "./TickActivity";

/** Maps an absolute leaderboard rank to a 0–100 percentile (100 = best). */
export function rankToPercentile(
  rank: number,
  leaderboardSize: number,
): number {
  if (leaderboardSize <= 1) {
    return 100;
  }
  return Math.round(((leaderboardSize - rank) / (leaderboardSize - 1)) * 100);
}

export function getPercentileAccentColor(
  percentile: number | undefined,
): string {
  return percentile !== undefined
    ? getDpsPercentileColor(percentile)
    : colors.percentile.default;
}

export interface PlayerDpsDisplayColor {
  color: string;
  useDpsTextClass: boolean;
}

/** DPS cell color for encounter/run tables; Unknown players are not rank-eligible. */
export function getPlayerDpsDisplayColor(
  playerId: string,
  percentile?: number,
): PlayerDpsDisplayColor {
  if (isUnknownPlayer(playerId)) {
    return { color: colors.text.unknown, useDpsTextClass: false };
  }
  if (percentile !== undefined) {
    return { color: getDpsPercentileColor(percentile), useDpsTextClass: false };
  }
  return { color: colors.text.dps, useDpsTextClass: true };
}

/** Display text for parse percentile column; unknown or unranked players show "-". */
export function formatParsePercentileDisplay(
  playerId: string,
  percentile?: number,
): string {
  if (isUnknownPlayer(playerId) || percentile === undefined) {
    return "-";
  }
  return `${percentile}`;
}
