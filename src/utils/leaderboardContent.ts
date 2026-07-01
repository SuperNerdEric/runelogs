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
    'Doom of Mokhaiotl',
] as const;

export const MOKHAIOTL_CONTENT_NAME = 'Doom of Mokhaiotl';
export const YAMA_CONTENT_NAME = 'Yama';
export const MOKHAIOTL_DELVE_1_8_KEY = 'Delve level 1 - 8';
/** User-facing label for the high-score leaderboard on Doom of Mokhaiotl. */
export const MOKHAIOTL_HIGH_SCORE_MODE_LABEL = 'Deep Delve';

export const LEADERBOARD_MODE_HIGH_SCORE = 'high-score' as const;

export type LeaderboardContentOption = {
    label: string;
    value: string;
    /** Hiscore sprite filename (without .png) from cache dump. */
    spriteKey: string;
    playerCounts: number[];
    defaultPlayerCount: number;
};

/** Per-boss DPS categories for multi-fight leaderboard content (About page, etc.). */
export const LEADERBOARD_DPS_BOSS_NAMES: Partial<Record<string, readonly string[]>> = {
    'Theatre of Blood': [
        'The Maiden of Sugadinti',
        'Pestilent Bloat',
        'Nylocas Vasilias',
        'Sotetseg',
        'Xarpus',
        'Verzik P1',
        'Verzik P2',
        'Verzik P3',
    ],
    'Theatre of Blood: Hard Mode': [
        'The Maiden of Sugadinti',
        'Pestilent Bloat',
        'Nylocas Vasilias',
        'Sotetseg',
        'Xarpus',
        'Verzik P1',
        'Verzik P2',
        'Verzik P3',
    ],
    'Tombs of Amascut': [
        'Ba-Ba',
        'Kephri',
        'Zebak',
        'Akkha',
        'Wardens P1',
        'Wardens P2',
        'Wardens P3',
    ],
    'Tombs of Amascut: Expert Mode': [
        'Ba-Ba',
        'Kephri',
        'Zebak',
        'Akkha',
        'Wardens P1',
        'Wardens P2',
        'Wardens P3',
    ],
    'Doom of Mokhaiotl': [
        'Delve 1',
        'Delve 2',
        'Delve 3',
        'Delve 4',
        'Delve 5',
        'Delve 6',
        'Delve 7',
        'Delve 8',
    ],
};

export const LEADERBOARD_CONTENT_OPTIONS: LeaderboardContentOption[] = [
    {label: 'Theatre of Blood', value: 'Theatre of Blood', spriteKey: 'theatre_of_blood', playerCounts: [1, 2, 3, 4, 5], defaultPlayerCount: 4},
    {label: 'Theatre of Blood: Hard Mode', value: 'Theatre of Blood: Hard Mode', spriteKey: 'theatre_of_blood', playerCounts: [1, 2, 3, 4, 5], defaultPlayerCount: 5},
    {label: 'Tombs of Amascut', value: 'Tombs of Amascut', spriteKey: 'tombs_of_amascut', playerCounts: [1, 2, 3, 4, 5, 6, 7, 8], defaultPlayerCount: 1},
    {label: 'Tombs of Amascut: Expert Mode', value: 'Tombs of Amascut: Expert Mode', spriteKey: 'tombs_of_amascut_expert', playerCounts: [1, 2, 3, 4, 5, 6, 7, 8], defaultPlayerCount: 1},
    {label: 'Fight Caves', value: 'Fight Caves', spriteKey: 'tztok_jad', playerCounts: [1], defaultPlayerCount: 1},
    {label: 'The Inferno', value: 'The Inferno', spriteKey: 'tzkal_zuk', playerCounts: [1], defaultPlayerCount: 1},
    {label: 'Fortis Colosseum', value: 'Fortis Colosseum', spriteKey: 'colosseum_glory', playerCounts: [1], defaultPlayerCount: 1},
    {label: 'The Gauntlet', value: 'The Gauntlet', spriteKey: 'the_gauntlet', playerCounts: [1], defaultPlayerCount: 1},
    {label: 'Corrupted Gauntlet', value: 'Corrupted Gauntlet', spriteKey: 'the_corrupted_gauntlet', playerCounts: [1], defaultPlayerCount: 1},
    {label: 'Doom of Mokhaiotl', value: MOKHAIOTL_CONTENT_NAME, spriteKey: 'doom_of_mokhaiotl', playerCounts: [1], defaultPlayerCount: 1},
    {label: 'Yama', value: YAMA_CONTENT_NAME, spriteKey: 'yama', playerCounts: [1, 2], defaultPlayerCount: 2},
];

/** @deprecated Use LEADERBOARD_CONTENT_OPTIONS */
export const PERSONAL_BESTS_CONTENT_OPTIONS = LEADERBOARD_CONTENT_OPTIONS;

export const RECENT_ENCOUNTERS_ALL_CONTENT = 'all';

export function getLeaderboardContentSpriteKey(contentValue: string): string | undefined {
    if (contentValue === RECENT_ENCOUNTERS_ALL_CONTENT) {
        return 'overall';
    }
    return LEADERBOARD_CONTENT_OPTIONS.find((option) => option.value === contentValue)?.spriteKey;
}

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

/** Sentinel for browse filters (recent encounters, uploader logs) that match any party size. */
export const BROWSE_ANY_PLAYER_COUNT = 'any' as const;

export type BrowsePlayerCount = number | typeof BROWSE_ANY_PLAYER_COUNT;

export function resolveBrowsePlayerCount(
    content: RecentEncountersContentOption,
    playerCountParam: string | null,
): BrowsePlayerCount {
    if (isRecentEncountersAllContent(content.value)) {
        return BROWSE_ANY_PLAYER_COUNT;
    }
    if (!playerCountParam) {
        return BROWSE_ANY_PLAYER_COUNT;
    }
    const parsed = parseInt(playerCountParam, 10);
    if (Number.isFinite(parsed) && content.playerCounts.includes(parsed)) {
        return parsed;
    }
    return BROWSE_ANY_PLAYER_COUNT;
}

export function browsePlayerCountToApiParam(playerCount: BrowsePlayerCount): number | undefined {
    return playerCount === BROWSE_ANY_PLAYER_COUNT ? undefined : playerCount;
}

export function buildLeaderboardPlayerCountOptions(
    playerCounts: readonly number[],
): Array<{value: number; label: string}> {
    return playerCounts.map((pc) => ({value: pc, label: String(pc)}));
}

export function buildBrowsePlayerCountOptions(
    playerCounts: readonly number[],
): Array<{value: BrowsePlayerCount; label: string}> {
    return [
        {value: BROWSE_ANY_PLAYER_COUNT, label: 'Any'},
        ...buildLeaderboardPlayerCountOptions(playerCounts),
    ];
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

export type LeaderboardMode = 'time' | 'dps' | typeof LEADERBOARD_MODE_HIGH_SCORE;

export function isMokhaiotlLeaderboardContent(contentName: string): boolean {
    return contentName === MOKHAIOTL_CONTENT_NAME;
}

export function getLeaderboardModesForContent(contentName: string): LeaderboardMode[] {
    if (isMokhaiotlLeaderboardContent(contentName)) {
        return ['time', 'dps', LEADERBOARD_MODE_HIGH_SCORE];
    }
    return ['time', 'dps'];
}

export function getLeaderboardModeLabel(contentName: string, mode: LeaderboardMode): string {
    if (mode === LEADERBOARD_MODE_HIGH_SCORE) {
        return isMokhaiotlLeaderboardContent(contentName)
            ? MOKHAIOTL_HIGH_SCORE_MODE_LABEL
            : 'High score';
    }
    if (mode === 'dps') {
        return 'DPS';
    }
    return 'Time';
}

export function getHighScoreLevelColumnLabel(contentName: string): string {
    if (isMokhaiotlLeaderboardContent(contentName)) {
        return 'Delve';
    }
    return 'Level';
}

export type LeaderboardDpsConfigGroup = {
    contentName: string;
    fights: string[];
};

export function resolveLeaderboardContent(contentParam: string | null): LeaderboardContentOption {
    return LEADERBOARD_CONTENT_OPTIONS.find((option) => option.value === contentParam)
        ?? LEADERBOARD_CONTENT_OPTIONS[0];
}

export function resolveLeaderboardPlayerCount(
    content: LeaderboardContentOption,
    playerCountParam: string | null,
): number {
    const parsed = parseInt(playerCountParam || '', 10);
    return content.playerCounts.includes(parsed) ? parsed : content.defaultPlayerCount;
}

export function resolveLeaderboardMode(
    contentValue: string,
    modeParam: string | null,
): LeaderboardMode {
    const allowedModes = getLeaderboardModesForContent(contentValue);
    const mode = modeParam as LeaderboardMode | null;
    return mode && allowedModes.includes(mode) ? mode : 'time';
}

/** Trust the URL fight param before DPS config has loaded so badge links fetch once. */
export function resolveLeaderboardSelectedFight(
    contentValue: string,
    fightParam: string | null,
    dpsConfig: LeaderboardDpsConfigGroup[],
): string {
    const fightsForContent = dpsConfig.find((group) => group.contentName === contentValue)?.fights ?? [];
    if (fightParam && (fightsForContent.length === 0 || fightsForContent.includes(fightParam))) {
        return fightParam;
    }
    if (isMokhaiotlLeaderboardContent(contentValue) && fightsForContent.includes(MOKHAIOTL_DELVE_1_8_KEY)) {
        return MOKHAIOTL_DELVE_1_8_KEY;
    }
    if (fightsForContent.includes('Overall')) {
        return 'Overall';
    }
    if (fightsForContent.length > 0) {
        return fightsForContent[0];
    }
    return fightParam ?? 'Overall';
}

export function resolveLeaderboardHighlightRank(highlightRankParam: string | null): number | null {
    const parsed = parseInt(highlightRankParam || '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function resolveLeaderboardStateFromSearchParams(
    searchParams: URLSearchParams,
    dpsConfig: LeaderboardDpsConfigGroup[],
): {
    mode: LeaderboardMode;
    content: LeaderboardContentOption;
    playerCount: number;
    selectedFight: string;
    highlightRank: number | null;
} {
    const content = resolveLeaderboardContent(searchParams.get('leaderboard'));
    return {
        mode: resolveLeaderboardMode(content.value, searchParams.get('mode')),
        content,
        playerCount: resolveLeaderboardPlayerCount(content, searchParams.get('playerCount')),
        selectedFight: resolveLeaderboardSelectedFight(
            content.value,
            searchParams.get('fight'),
            dpsConfig,
        ),
        highlightRank: resolveLeaderboardHighlightRank(searchParams.get('highlightRank')),
    };
}

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
    if (!leaderboardName || !isLeaderboardContent(leaderboardName)) {
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
    if (entry.category === MOKHAIOTL_HIGH_SCORE_MODE_LABEL) {
        return buildLeaderboardHref({
            mode: LEADERBOARD_MODE_HIGH_SCORE,
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
    if (!leaderboardName || !fightKey || !isLeaderboardContent(leaderboardName)) {
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

/** Maps standalone boss fights (no fight group) to their leaderboard content name. */
export function inferStandaloneLeaderboardContent(mainEnemyName: string | null | undefined): string | null {
    if (mainEnemyName === YAMA_CONTENT_NAME) {
        return YAMA_CONTENT_NAME;
    }
    return null;
}

export function isLeaderboardContent(leaderboardName: string | null | undefined): boolean {
    return isLeaderboardFightGroup(leaderboardName)
        || inferStandaloneLeaderboardContent(leaderboardName) !== null;
}

/** Infer leaderboard content from a fight group display name (e.g. "Theatre of Blood - 1"). */
export function inferLeaderboardFightGroupName(name: string): string | null {
    const base = name.replace(/ - Incomplete$/, '').replace(/ - \d+$/, '');
    return isLeaderboardFightGroup(base) ? base : null;
}
