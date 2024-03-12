import {calculateDPSByInterval} from "../components/charts/DPSChart";
import {DamageLog, LogTypes} from "../models/LogLine";
import {convertTimeToMillis} from "../utils/utils";

describe('calculateDPSByInterval', () => {
    test('calculate dps by 6 second intervals', () => {
        let logLines: DamageLog[] = [
            generateDamageLog("02-04-2024", "01:18:11.404", 15),
            generateDamageLog("02-04-2024", "01:18:11.405", 2),
            generateDamageLog("02-04-2024", "01:18:11.405", 0),
            generateDamageLog("02-04-2024", "01:18:14.403", 17),
            generateDamageLog("02-04-2024", "01:18:14.403", 0),
            generateDamageLog("02-04-2024", "01:18:14.404", 0),
            generateDamageLog("02-04-2024", "01:18:17.387", 13),
            generateDamageLog("02-04-2024", "01:18:17.388", 19),
            generateDamageLog("02-04-2024", "01:18:17.388", 5),
            generateDamageLog("02-04-2024", "01:18:20.405", 20),
            generateDamageLog("02-04-2024", "01:18:20.406", 13),
            generateDamageLog("02-04-2024", "01:18:20.406", 3),
        ]

        const dpsData: { timestamp: number; dps: number }[] = calculateDPSByInterval(logLines, 6000);
        console.log(dpsData);
        expect(dpsData[0].dps).toBeCloseTo(71 / 6, 6);
    });

    test('calculate 0 dps at the end', () => {
        let logLines: DamageLog[] = [
            generateDamageLog("02-04-2024", "01:18:13.802", 12),
            generateDamageLog("02-04-2024", "01:18:16.206", 0),
            generateDamageLog("02-04-2024", "01:18:18.605", 0),
            generateDamageLog("02-04-2024", "01:18:24.007", 10),
            generateDamageLog("02-04-2024", "01:18:26.404", 8),
            generateDamageLog("02-04-2024", "01:18:30.605", 0),
            generateDamageLog("02-04-2024", "01:18:34.804", 0),
            generateDamageLog("02-04-2024", "01:18:37.804", 0),
            generateDamageLog("02-04-2024", "01:18:44.407", 0),
            generateDamageLog("02-04-2024", "01:18:54.608", 0),
            generateDamageLog("02-04-2024", "01:18:55.207", 0),
            generateDamageLog("02-04-2024", "01:18:57.003", 0),
        ];

        const dpsData: { timestamp: number; dps: number }[] = calculateDPSByInterval(logLines, 6000);
        console.log(dpsData);
        expect(dpsData[0].dps).toBeCloseTo(2, 6);
        expect(dpsData[1].dps).toBeCloseTo(1.667, 3);
        expect(dpsData[2].dps).toBeCloseTo(1.333, 3);
        expect(dpsData[3].dps).toBeCloseTo(0, 3);
        expect(dpsData[4].dps).toBeCloseTo(0, 3);
        expect(dpsData[5].dps).toBeCloseTo(0, 3);
        expect(dpsData[6].dps).toBeCloseTo(0, 3);
    });
});

function generateDamageLog(date: string, time: string, damageAmount: number): DamageLog {
    return {
        type: LogTypes.DAMAGE,
        date,
        time,
        fightTimeMs: convertTimeToMillis(time),
        timezone: "",
        target: {name: "Scurrius"},
        damageAmount,
        hitsplatName: "DAMAGE_ME"
    };
}