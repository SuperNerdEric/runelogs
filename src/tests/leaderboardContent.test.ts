import {describe, expect, it} from 'vitest';
import {
    BROWSE_ANY_PLAYER_COUNT,
    browsePlayerCountToApiParam,
    buildBrowsePlayerCountOptions,
    buildLeaderboardPlayerCountOptions,
    buildPlayerRankLeaderboardHref,
    LEADERBOARD_CONTENT_OPTIONS,
    MOKHAIOTL_CONTENT_NAME,
    MOKHAIOTL_HIGH_SCORE_MODE_LABEL,
    resolveBrowsePlayerCount,
    resolveLeaderboardSelectedFight,
    resolveLeaderboardStateFromSearchParams,
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

describe('Yama leaderboard content', () => {
    it('includes solo and duo player counts', () => {
        const yama = LEADERBOARD_CONTENT_OPTIONS.find((option) => option.value === 'Yama');
        expect(yama).toEqual({
            label: 'Yama',
            value: 'Yama',
            playerCounts: [1, 2],
            defaultPlayerCount: 2,
        });
    });
});

describe('buildPlayerRankLeaderboardHref', () => {
    it('links deep delve rank badges to the high-score leaderboard', () => {
        expect(buildPlayerRankLeaderboardHref(
            {category: MOKHAIOTL_HIGH_SCORE_MODE_LABEL, rank: 4},
            MOKHAIOTL_CONTENT_NAME,
            1,
        )).toBe('/leaderboards?mode=high-score&leaderboard=Doom+of+Mokhaiotl&playerCount=1&highlightRank=4');
    });

    it('links delve DPS rank badges to the correct fight leaderboard', () => {
        expect(buildPlayerRankLeaderboardHref(
            {category: 'Delve 1', rank: 3},
            MOKHAIOTL_CONTENT_NAME,
            1,
        )).toBe('/leaderboards?mode=dps&leaderboard=Doom+of+Mokhaiotl&playerCount=1&fight=Delve+1&highlightRank=3');
    });
});

describe('resolveLeaderboardStateFromSearchParams', () => {
    it('uses the URL fight before DPS config loads so badge links do not request Overall', () => {
        const searchParams = new URLSearchParams(
            'mode=dps&leaderboard=Doom+of+Mokhaiotl&playerCount=1&fight=Delve+1&highlightRank=3',
        );

        const resolved = resolveLeaderboardStateFromSearchParams(searchParams, []);

        expect(resolved.mode).toBe('dps');
        expect(resolved.content.value).toBe(MOKHAIOTL_CONTENT_NAME);
        expect(resolved.playerCount).toBe(1);
        expect(resolved.selectedFight).toBe('Delve 1');
        expect(resolved.highlightRank).toBe(3);
    });

    it('falls back to delve 1-8 aggregate once mokhaiotl DPS config is available without a fight param', () => {
        const searchParams = new URLSearchParams(
            'mode=dps&leaderboard=Doom+of+Mokhaiotl&playerCount=1',
        );
        const dpsConfig = [{
            contentName: MOKHAIOTL_CONTENT_NAME,
            fights: ['Delve 1', 'Delve level 1 - 8'],
        }];

        expect(resolveLeaderboardStateFromSearchParams(searchParams, dpsConfig).selectedFight)
            .toBe('Delve level 1 - 8');
    });

    it('rejects an invalid fight param once config is loaded', () => {
        const searchParams = new URLSearchParams(
            'mode=dps&leaderboard=Theatre+of+Blood&playerCount=4&fight=Not+A+Room',
        );
        const dpsConfig = [{
            contentName: 'Theatre of Blood',
            fights: ['Overall', 'Verzik Vitur'],
        }];

        expect(resolveLeaderboardSelectedFight(
            'Theatre of Blood',
            'Not A Room',
            dpsConfig,
        )).toBe('Overall');
    });
});
