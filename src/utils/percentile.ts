import {colors} from '../theme';
import {getDpsPercentileColor} from './TickActivity';

/** Maps an absolute leaderboard rank to a 0–100 percentile (100 = best). */
export function rankToPercentile(rank: number, leaderboardSize: number): number {
    if (leaderboardSize <= 1) {
        return 100;
    }
    return Math.round(((leaderboardSize - rank) / (leaderboardSize - 1)) * 100);
}

export function getPercentileAccentColor(percentile: number | undefined): string {
    return percentile !== undefined
        ? getDpsPercentileColor(percentile)
        : colors.percentile.default;
}
