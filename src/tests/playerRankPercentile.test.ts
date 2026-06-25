import {describe, expect, it} from 'vitest';
import {resolvePlayerRankPercentile} from '../components/badges/playerRankPercentile';
import {MOKHAIOTL_HIGH_SCORE_MODE_LABEL} from '../utils/leaderboardContent';

describe('resolvePlayerRankPercentile', () => {
    it('uses highScorePercentile from context for deep delve badges', () => {
        expect(resolvePlayerRankPercentile(
            {playerId: '', category: MOKHAIOTL_HIGH_SCORE_MODE_LABEL, rank: 2},
            {overallDps: [], highScorePercentile: 88},
        )).toBe(88);
    });

    it('prefers entry percentile over context for deep delve badges', () => {
        expect(resolvePlayerRankPercentile(
            {playerId: '', category: MOKHAIOTL_HIGH_SCORE_MODE_LABEL, rank: 2, percentile: 91},
            {overallDps: [], highScorePercentile: 88},
        )).toBe(91);
    });
});
