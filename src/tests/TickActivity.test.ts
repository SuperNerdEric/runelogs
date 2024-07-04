import {getMockFights} from "./utils/TestUtils";
import {getFightPerformance} from "../components/performance/TickActivity";

describe('getFightPerformance', () => {
    // todo: remove/rework this because we handle blowpipe logic differently now
    test('should get expected number of hits', async () => {
        const parsedFights = getMockFights("blowpiping-leviathan.txt");
        const fight = parsedFights![0];
        // @ts-ignore
        const results = getFightPerformance(fight);
        expect(results.expectedWeaponHits).toEqual(64); // checked in excel
        expect(results.actualWeaponHits).toEqual(62);
        expect(results.activeTime).toBeCloseTo(117.594, 3); // not sure
    });

    test('should be 100%', async () => {
        const parsedFights = getMockFights("scurrius-6.txt");
        const fight = parsedFights![0];
        // @ts-ignore
        const results = getFightPerformance(fight);
        expect(results.expectedWeaponHits).toEqual(14);
        expect(results.actualWeaponHits).toEqual(14);
        expect(results.boostedHits).toEqual(14);
        expect(results.activeTime).toBeLessThanOrEqual(39.601); // this is only over the fight length because of tick variance, should be resolved when we log ticks instead of time
    });
});