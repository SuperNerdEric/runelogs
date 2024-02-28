import {calculateWeightedAverages} from "../components/charts/BoostsChart";
import {LogLine, LogTypes} from "../models/LogLine";
import {Fight} from "../models/Fight";
import {convertTimeToMillis} from "../utils/utils";

describe('calculateWeightedAverages', () => {
    test('should calculate stat average correctly', () => {
        let logLines: LogLine[] = [
            {
                type: LogTypes.BOOSTED_LEVELS,
                date: "02-04-2024", time: "01:18:00.000", fightTimeMs: convertTimeToMillis("01:18:00.000"), timezone: "", boostedLevels: {
                    attack: 99,
                    strength: 99,
                    defence: 99,
                    ranged: 99,
                    magic: 99,
                    hitpoints: 99,
                    prayer: 99
                }
            },
            {
                type: LogTypes.BOOSTED_LEVELS,
                date: "02-04-2024", time: "01:18:50.000", fightTimeMs:  convertTimeToMillis("01:18:50.000"), timezone: "", boostedLevels: {
                    attack: 1,
                    strength: 1,
                    defence: 1,
                    ranged: 1,
                    magic: 1,
                    hitpoints: 1,
                    prayer: 1
                }
            },
        ]

        // @ts-ignore
        const fight: Fight = {
            name: "Test",
            data: logLines,
            enemies: [],
            loggedInPlayer: "Million Pies",
            firstLine: {
                type: LogTypes.BOOSTED_LEVELS,
                date: "02-04-2024", time: "01:18:00.000", fightTimeMs:  convertTimeToMillis("01:18:00.000"), timezone: "", boostedLevels: {
                    attack: 99,
                    strength: 99,
                    defence: 99,
                    ranged: 99,
                    magic: 99,
                    hitpoints: 99,
                    prayer: 99
                }
            },
            lastLine: {
                type: LogTypes.DAMAGE,
                date: "02-04-2024",
                time: "01:19:00.000",
                fightTimeMs:  convertTimeToMillis("01:19:00.000"),
                timezone: "",
                target: "Scurrius",
                damageAmount: 15,
                hitsplatName: "Damage_Me"
            },
        }

        const results = calculateWeightedAverages(fight);
        expect(results).toEqual({
            attack: 82.66666666666667,
            strength: 82.66666666666667,
            defence: 82.66666666666667,
            ranged: 82.66666666666667,
            magic: 82.66666666666667,
            hitpoints: 82.66666666666667,
            prayer: 82.66666666666667
        })
    });
});