import {describe, expect, it} from 'vitest';
import {getPercentileAccentColor, rankToPercentile} from '../utils/percentile';
import {colors} from '../theme';

describe('rankToPercentile', () => {
    it('returns 100 for rank 1 on a multi-entry board', () => {
        expect(rankToPercentile(1, 100)).toBe(100);
    });

    it('returns 0 for last place', () => {
        expect(rankToPercentile(100, 100)).toBe(0);
    });

    it('returns 100 when the board has one entry', () => {
        expect(rankToPercentile(1, 1)).toBe(100);
    });
});

describe('getPercentileAccentColor', () => {
    it('uses the default color when percentile is missing', () => {
        expect(getPercentileAccentColor(undefined)).toBe(colors.percentile.default);
    });

    it('uses the top-tier color for a perfect percentile', () => {
        expect(getPercentileAccentColor(100)).toBe(colors.percentile.p100);
    });
});
