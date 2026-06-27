import {describe, expect, it} from 'vitest';
import {
    buildDurationPersonalBestEntries,
    getDurationPersonalBestsForContent,
} from '../utils/personalBests';

describe('buildDurationPersonalBestEntries', () => {
    it('includes standalone Yama fights alongside fight group personal bests', () => {
        const entries = buildDurationPersonalBestEntries({
            fightGroups: [{
                id: 'tob-1',
                name: 'Theatre of Blood - 1',
                leaderboardName: 'Theatre of Blood',
                officialDurationTicks: 1000,
                playerCount: 4,
            }],
            fights: [{
                id: 'yama-1',
                name: 'Yama - 1',
                mainEnemyName: 'Yama',
                officialDurationTicks: 551,
                playerCount: 2,
                players: ['Alice', 'Bob'],
            }],
        });

        expect(entries).toHaveLength(2);
        expect(entries).toEqual([
            expect.objectContaining({
                id: 'tob-1',
                leaderboardName: 'Theatre of Blood',
                resultType: 'fightGroup',
            }),
            expect.objectContaining({
                id: 'yama-1',
                leaderboardName: 'Yama',
                resultType: 'fight',
                playerCount: 2,
            }),
        ]);
    });

    it('maps standalone fight mainEnemyName to leaderboardName for content filtering', () => {
        const entries = buildDurationPersonalBestEntries({
            fights: [{
                id: 'yama-solo',
                name: 'Yama - 2',
                mainEnemyName: 'Yama',
                officialDurationTicks: 400,
                playerCount: 1,
            }],
        });

        expect(getDurationPersonalBestsForContent(entries, 'Yama')).toEqual([
            expect.objectContaining({
                id: 'yama-solo',
                leaderboardName: 'Yama',
                playerCount: 1,
                resultType: 'fight',
            }),
        ]);
        expect(getDurationPersonalBestsForContent(entries, 'Theatre of Blood')).toEqual([]);
    });
});
