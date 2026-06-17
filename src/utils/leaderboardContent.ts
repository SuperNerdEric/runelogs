/** Fight group names that appear on duration and/or DPS leaderboards. */
export const LEADERBOARD_FIGHT_GROUP_NAMES = [
    'Theatre of Blood',
    'Theatre of Blood: Hard Mode',
    'Tombs of Amascut',
    'Tombs of Amascut: Expert Mode',
    'Fight Caves',
    'The Inferno',
    'Fortis Colosseum',
    'The Gauntlet',
    'Corrupted Gauntlet',
] as const;

export type LeaderboardContentOption = {
    label: string;
    value: string;
    playerCounts: number[];
    defaultPlayerCount: number;
};

export const LEADERBOARD_CONTENT_OPTIONS: LeaderboardContentOption[] = [
    {label: 'Theatre of Blood', value: 'Theatre of Blood', playerCounts: [1, 2, 3, 4, 5], defaultPlayerCount: 4},
    {label: 'Theatre of Blood: Hard Mode', value: 'Theatre of Blood: Hard Mode', playerCounts: [1, 2, 3, 4, 5], defaultPlayerCount: 5},
    {label: 'Tombs of Amascut', value: 'Tombs of Amascut', playerCounts: [1, 2, 3, 4, 5, 6, 7, 8], defaultPlayerCount: 1},
    {label: 'Tombs of Amascut: Expert Mode', value: 'Tombs of Amascut: Expert Mode', playerCounts: [1, 2, 3, 4, 5, 6, 7, 8], defaultPlayerCount: 1},
    {label: 'Fight Caves', value: 'Fight Caves', playerCounts: [1], defaultPlayerCount: 1},
    {label: 'The Inferno', value: 'The Inferno', playerCounts: [1], defaultPlayerCount: 1},
    {label: 'Fortis Colosseum', value: 'Fortis Colosseum', playerCounts: [1], defaultPlayerCount: 1},
    {label: 'The Gauntlet', value: 'The Gauntlet', playerCounts: [1], defaultPlayerCount: 1},
    {label: 'Corrupted Gauntlet', value: 'Corrupted Gauntlet', playerCounts: [1], defaultPlayerCount: 1},
];

/** @deprecated Use LEADERBOARD_CONTENT_OPTIONS */
export const PERSONAL_BESTS_CONTENT_OPTIONS = LEADERBOARD_CONTENT_OPTIONS;

export const RECENT_ENCOUNTERS_ALL_CONTENT = 'all';

export const RECENT_ENCOUNTERS_PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export type RecentEncountersContentOption = {
    label: string;
    value: string;
    playerCounts: readonly number[];
    defaultPlayerCount?: number;
};

export const RECENT_ENCOUNTERS_CONTENT_OPTIONS: RecentEncountersContentOption[] = [
    {label: 'All Content', value: RECENT_ENCOUNTERS_ALL_CONTENT, playerCounts: RECENT_ENCOUNTERS_PARTY_SIZES},
    ...LEADERBOARD_CONTENT_OPTIONS,
];

export function resolveRecentEncountersContent(contentParam: string | null): RecentEncountersContentOption {
    if (!contentParam || contentParam === RECENT_ENCOUNTERS_ALL_CONTENT) {
        return RECENT_ENCOUNTERS_CONTENT_OPTIONS[0];
    }
    return LEADERBOARD_CONTENT_OPTIONS.find((o) => o.value === contentParam)
        ?? RECENT_ENCOUNTERS_CONTENT_OPTIONS[0];
}

export function isRecentEncountersAllContent(value: string): boolean {
    return value === RECENT_ENCOUNTERS_ALL_CONTENT;
}

export function buildRecentEncountersHref(params: {
    content?: string;
    playerCount?: number;
    page?: number;
}): string {
    const search = new URLSearchParams();
    if (params.content && !isRecentEncountersAllContent(params.content)) {
        search.set('content', params.content);
    }
    if (params.playerCount != null) {
        search.set('playerCount', String(params.playerCount));
    }
    if (params.page != null && params.page > 1) {
        search.set('page', String(params.page));
    }
    const query = search.toString();
    return query ? `/recent-encounters?${query}` : '/recent-encounters';
}

export function buildUploaderLogsHref(
    uploaderId: string,
    params: {
        content?: string;
        playerCount?: number;
    } = {},
): string {
    const search = new URLSearchParams();
    if (params.content && !isRecentEncountersAllContent(params.content)) {
        search.set('content', params.content);
    }
    if (params.playerCount != null) {
        search.set('playerCount', String(params.playerCount));
    }
    const query = search.toString();
    return query ? `/logs/${uploaderId}?${query}` : `/logs/${uploaderId}`;
}

export type LeaderboardMode = 'time' | 'dps';

export function buildLeaderboardHref(params: {
    mode: LeaderboardMode;
    leaderboard: string;
    playerCount: number;
    fight?: string;
    highlightRank?: number;
}): string {
    const search = new URLSearchParams({
        mode: params.mode,
        leaderboard: params.leaderboard,
        playerCount: String(params.playerCount),
    });
    if (params.mode === 'dps' && params.fight) {
        search.set('fight', params.fight);
    }
    if (params.highlightRank != null && params.highlightRank > 0) {
        search.set('highlightRank', String(params.highlightRank));
    }
    return `/leaderboards?${search.toString()}`;
}

export function buildPlayerRankLeaderboardHref(
    entry: {category: string; rank: number},
    leaderboardName: string | null | undefined,
    playerCount: number,
): string | undefined {
    if (!leaderboardName || !isLeaderboardFightGroup(leaderboardName)) {
        return undefined;
    }
    if (entry.category === 'Duration') {
        return buildLeaderboardHref({
            mode: 'time',
            leaderboard: leaderboardName,
            playerCount,
            highlightRank: entry.rank,
        });
    }
    const fight = entry.category === 'Overall DPS' ? 'Overall' : entry.category;
    return buildLeaderboardHref({
        mode: 'dps',
        leaderboard: leaderboardName,
        playerCount,
        fight,
        highlightRank: entry.rank,
    });
}

export function buildFightDpsRankLeaderboardHref(
    rank: number,
    leaderboardName: string | null | undefined,
    playerCount: number,
    fightKey: string | null | undefined,
): string | undefined {
    if (!leaderboardName || !fightKey || !isLeaderboardFightGroup(leaderboardName)) {
        return undefined;
    }
    return buildLeaderboardHref({
        mode: 'dps',
        leaderboard: leaderboardName,
        playerCount,
        fight: fightKey,
        highlightRank: rank,
    });
}

export function isLeaderboardFightGroup(leaderboardName: string | null | undefined): boolean {
    return Boolean(
        leaderboardName &&
        LEADERBOARD_FIGHT_GROUP_NAMES.includes(leaderboardName as typeof LEADERBOARD_FIGHT_GROUP_NAMES[number]),
    );
}

/** Infer leaderboard content from a fight group display name (e.g. "Theatre of Blood - 1"). */
export function inferLeaderboardFightGroupName(name: string): string | null {
    const base = name.replace(/ - Incomplete$/, '').replace(/ - \d+$/, '');
    return isLeaderboardFightGroup(base) ? base : null;
}
