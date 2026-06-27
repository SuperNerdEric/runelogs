export type DurationPersonalBestEntry = {
    id: string;
    name: string;
    leaderboardName: string;
    officialDurationTicks: number;
    playerCount: number;
    rank?: number;
    percentile?: number;
    startTime?: string;
    players?: string[];
    resultType: 'fight' | 'fightGroup';
};

export type DurationStandaloneFightPersonalBest = {
    id: string;
    name: string;
    mainEnemyName: string;
    officialDurationTicks: number;
    playerCount: number;
    rank?: number;
    percentile?: number;
    startTime?: string;
    players?: string[];
};

export type DurationFightGroupPersonalBest = Omit<DurationPersonalBestEntry, 'resultType'>;

export function buildDurationPersonalBestEntries(personalBests: {
    fights?: DurationStandaloneFightPersonalBest[];
    fightGroups?: DurationFightGroupPersonalBest[];
} | null | undefined): DurationPersonalBestEntry[] {
    const fightGroups = (personalBests?.fightGroups ?? []).map((group) => ({
        ...group,
        resultType: 'fightGroup' as const,
    }));
    const standaloneFights = (personalBests?.fights ?? []).map((fight) => ({
        id: fight.id,
        name: fight.name,
        leaderboardName: fight.mainEnemyName,
        officialDurationTicks: fight.officialDurationTicks,
        playerCount: fight.playerCount,
        rank: fight.rank,
        percentile: fight.percentile,
        startTime: fight.startTime,
        players: fight.players,
        resultType: 'fight' as const,
    }));
    return [...fightGroups, ...standaloneFights];
}

export function getDurationPersonalBestsForContent(
    entries: DurationPersonalBestEntry[],
    contentName: string,
): DurationPersonalBestEntry[] {
    return entries
        .filter((entry) => entry.leaderboardName === contentName)
        .sort((a, b) => a.playerCount - b.playerCount);
}
