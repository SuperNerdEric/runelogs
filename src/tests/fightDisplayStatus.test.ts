import { describe, expect, it } from 'vitest';
import {
    FIGHT_IN_PROGRESS_COLOR,
    isFightGroupLiveInProgress,
    isFightLiveInProgress,
    resolveFightOutcomeColor,
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
});
