export interface PlayerRankEntry {
    playerId: string;
    category: string;
    rank: number;
    percentile?: number;
}

export interface OverallDpsEntry {
    playerId: string;
    percentile?: number;
}

export interface FightPlayerDpsEntry {
    playerId: string;
    percentile?: number;
    rank?: number;
}

export interface FightDpsSource {
    dpsLeaderboardKey?: string | null;
    name: string;
    playerDps: FightPlayerDpsEntry[];
}

export interface PlayerRankPercentileContext {
    overallDps: OverallDpsEntry[];
    fights?: FightDpsSource[];
    durationPercentile?: number | null;
}

function fightKey(fight: FightDpsSource): string {
    return fight.dpsLeaderboardKey ?? fight.name;
}

function lookupFightPlayerPercentile(
    fight: FightDpsSource,
    entry: PlayerRankEntry,
): number | undefined {
    const byPlayer = fight.playerDps.find((row) => row.playerId === entry.playerId);
    if (byPlayer?.percentile !== undefined) {
        return byPlayer.percentile;
    }
    const byRank = fight.playerDps.find((row) => row.rank === entry.rank);
    return byRank?.percentile;
}

export function resolvePlayerRankPercentile(
    entry: PlayerRankEntry,
    context: PlayerRankPercentileContext | OverallDpsEntry[],
): number | undefined {
    const ctx: PlayerRankPercentileContext = Array.isArray(context)
        ? {overallDps: context}
        : context;

    if (entry.percentile !== undefined) {
        return entry.percentile;
    }

    if (entry.category === 'Overall DPS') {
        return ctx.overallDps.find((row) => row.playerId === entry.playerId)?.percentile;
    }

    if (entry.category === 'Duration') {
        if (entry.percentile !== undefined) {
            return entry.percentile;
        }
        if (ctx.durationPercentile != null) {
            return ctx.durationPercentile;
        }
        if (entry.rank === 1) {
            return 100;
        }
        return undefined;
    }

    const fight = ctx.fights?.find((f) => fightKey(f) === entry.category);
    if (fight) {
        const percentile = lookupFightPlayerPercentile(fight, entry);
        if (percentile !== undefined) {
            return percentile;
        }
    }

    if (entry.rank === 1) {
        return 100;
    }

    return undefined;
}
