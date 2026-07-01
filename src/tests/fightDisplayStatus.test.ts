import { describe, expect, it } from 'vitest';
import {
    FIGHT_IN_PROGRESS_COLOR,
    isFightGroupLiveInProgress,
    isFightGroupRunInProgress,
    isFightLiveInProgress,
    resolveFightOutcomeColor,
    resolveLiveFightTileInProgress,
} from '../utils/fightDisplayStatus';
import { colors } from '../theme';

describe('fightDisplayStatus', () => {
    it('uses blue for in-progress fights regardless of success flag', () => {
        expect(resolveFightOutcomeColor(false, true)).toBe(FIGHT_IN_PROGRESS_COLOR);
        expect(resolveFightOutcomeColor(true, true)).toBe(FIGHT_IN_PROGRESS_COLOR);
    });

    it('uses success and failure colors when not in progress', () => {
        expect(resolveFightOutcomeColor(true, false)).toBe(colors.fight.success);
        expect(resolveFightOutcomeColor(false, false)).toBe(colors.fight.failure);
    });

    it('detects an active fight within a live raid', () => {
        expect(
            isFightLiveInProgress(true, 'maiden-1', 'maiden-1'),
        ).toBe(true);
        expect(
            isFightLiveInProgress(true, 'maiden-1', 'group-1'),
        ).toBe(false);
        expect(
            isFightLiveInProgress(false, 'maiden-1', 'maiden-1'),
        ).toBe(false);
    });

    it('detects an in-progress fight group from group or nested fight ids', () => {
        expect(
            isFightGroupLiveInProgress(true, 'group-1', ['maiden-1'], 'group-1'),
        ).toBe(true);
        expect(
            isFightGroupLiveInProgress(true, 'group-1', ['maiden-1'], 'maiden-1'),
        ).toBe(true);
        expect(
            isFightGroupLiveInProgress(true, 'group-1', ['maiden-1'], 'other'),
        ).toBe(false);
    });

    it('marks an unfinished fight group as in progress while the log is live', () => {
        expect(isFightGroupRunInProgress(true, false)).toBe(true);
        expect(isFightGroupRunInProgress(true, true)).toBe(false);
        expect(isFightGroupRunInProgress(false, false)).toBe(false);
    });

    it('treats a live unfinished raid as in progress even when active id mismatches db group id', () => {
        const receivingData = true;
        const groupSuccess = false;
        const dbGroupId = 'ee930771-c75c-4f8a-a400-086a89a12fc5';
        const checkpointGroupId = 'aab4addd-3e44-4c24-b429-acb84e937413';
        const fightIds = ['b2363fc8-b926-4b64-8296-a731d36e69fb'];

        expect(
            isFightGroupLiveInProgress(
                receivingData,
                dbGroupId,
                fightIds,
                checkpointGroupId,
            ),
        ).toBe(false);
        expect(isFightGroupRunInProgress(receivingData, groupSuccess)).toBe(true);
        expect(
            resolveFightOutcomeColor(groupSuccess, isFightGroupRunInProgress(receivingData, groupSuccess)),
        ).toBe(FIGHT_IN_PROGRESS_COLOR);
    });

    it('marks the current unfinished fight during a live run when active ids mismatch', () => {
        const fights = [
            { id: 'maiden-db', success: true, order: 0 },
            { id: 'bloat-db', success: true, order: 1 },
            { id: 'nylo-db', success: false, order: 2 },
        ];

        expect(
            resolveLiveFightTileInProgress(true, false, fights, fights[0], 'checkpoint-nylo'),
        ).toBe(false);
        expect(
            resolveLiveFightTileInProgress(true, false, fights, fights[1], 'checkpoint-nylo'),
        ).toBe(false);
        expect(
            resolveLiveFightTileInProgress(true, false, fights, fights[2], 'checkpoint-nylo'),
        ).toBe(true);
    });
});
