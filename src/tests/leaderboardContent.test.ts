import {describe, expect, it} from 'vitest';
import {
    BROWSE_ANY_PLAYER_COUNT,
    browsePlayerCountToApiParam,
    buildBrowsePlayerCountOptions,
    buildLeaderboardPlayerCountOptions,
    LEADERBOARD_CONTENT_OPTIONS,
    resolveBrowsePlayerCount,
} from '../utils/leaderboardContent';

describe('browse player count filters', () => {
    it('include Any as the first option and default when no URL param is set', () => {
        const options = buildBrowsePlayerCountOptions([1, 2, 3, 4, 5]);
        expect(options[0]).toEqual({value: BROWSE_ANY_PLAYER_COUNT, label: 'Any'});
        expect(options.slice(1).map((option) => option.value)).toEqual([1, 2, 3, 4, 5]);

        const tob = LEADERBOARD_CONTENT_OPTIONS[0];
        expect(resolveBrowsePlayerCount(tob, null)).toBe(BROWSE_ANY_PLAYER_COUNT);
        expect(browsePlayerCountToApiParam(BROWSE_ANY_PLAYER_COUNT)).toBeUndefined();
    });

    it('preserve a specific player count from the URL when valid', () => {
        const tob = LEADERBOARD_CONTENT_OPTIONS[0];
        expect(resolveBrowsePlayerCount(tob, '3')).toBe(3);
        expect(browsePlayerCountToApiParam(3)).toBe(3);
    });
});

describe('leaderboard player count filters', () => {
    it('list only specific player counts because leaderboards are party-size specific', () => {
        for (const content of LEADERBOARD_CONTENT_OPTIONS) {
            const options = buildLeaderboardPlayerCountOptions(content.playerCounts);
            expect(options.some((option) => option.value === BROWSE_ANY_PLAYER_COUNT)).toBe(false);
            expect(options.map((option) => option.value)).toEqual([...content.playerCounts]);
        }
    });
});
