import {LogLine} from "../FileParser";
import {calculateDPSByInterval} from "../charts/DPSChart";

describe('calculateDPSByInterval', () => {
    test('calculate dps by 6 second intervals', () => {
        let logLines: LogLine[] = [
            { date: "02-04-2024", time: "01:18:11.404", timezone: "", target: "Scurrius", damageAmount: 15 },
            { date: "02-04-2024", time: "01:18:11.405", timezone: "", target: "Scurrius", damageAmount: 2 },
            { date: "02-04-2024", time: "01:18:11.405", timezone: "", target: "Scurrius", damageAmount: 0 },
            { date: "02-04-2024", time: "01:18:14.403", timezone: "", target: "Scurrius", damageAmount: 17 },
            { date: "02-04-2024", time: "01:18:14.403", timezone: "", target: "Scurrius", damageAmount: 0 },
            { date: "02-04-2024", time: "01:18:14.404", timezone: "", target: "Scurrius", damageAmount: 0 },
            { date: "02-04-2024", time: "01:18:17.387", timezone: "", target: "Scurrius", damageAmount: 13 },
            { date: "02-04-2024", time: "01:18:17.388", timezone: "", target: "Scurrius", damageAmount: 19 },
            { date: "02-04-2024", time: "01:18:17.388", timezone: "", target: "Scurrius", damageAmount: 5 },
            { date: "02-04-2024", time: "01:18:20.405", timezone: "", target: "Scurrius", damageAmount: 20 },
            { date: "02-04-2024", time: "01:18:20.406", timezone: "", target: "Scurrius", damageAmount: 13 },
            { date: "02-04-2024", time: "01:18:20.406", timezone: "", target: "Scurrius", damageAmount: 3},
        ]

        const dpsData: { timestamp: number; dps: number }[] = calculateDPSByInterval(logLines, 6000);
        console.log(dpsData);
        expect(dpsData[0].dps).toBeCloseTo(71/6, 6);
    });

    test('calculate 0 dps at the end', () => {
        let logLines: LogLine[] = [
            { date: "02-04-2024", time: "01:18:13.802", timezone: "", target: "Million Pies", damageAmount: 12 },
            { date: "02-04-2024", time: "01:18:16.206", timezone: "", target: "Million Pies", damageAmount: 0 },
            { date: "02-04-2024", time: "01:18:18.605", timezone: "", target: "Million Pies", damageAmount: 0 },
            { date: "02-04-2024", time: "01:18:24.007", timezone: "", target: "Million Pies", damageAmount: 10 },
            { date: "02-04-2024", time: "01:18:26.404", timezone: "", target: "Million Pies", damageAmount: 8 },
            { date: "02-04-2024", time: "01:18:30.605", timezone: "", target: "Million Pies", damageAmount: 0 },
            { date: "02-04-2024", time: "01:18:34.804", timezone: "", target: "Million Pies", damageAmount: 0 },
            { date: "02-04-2024", time: "01:18:37.804", timezone: "", target: "Million Pies", damageAmount: 0 },
            { date: "02-04-2024", time: "01:18:44.407", timezone: "", target: "Million Pies", damageAmount: 0 },
            { date: "02-04-2024", time: "01:18:54.608", timezone: "", target: "Million Pies", damageAmount: 0 },
            { date: "02-04-2024", time: "01:18:55.207", timezone: "", target: "Million Pies", damageAmount: 0 },
            { date: "02-04-2024", time: "01:18:57.003", timezone: "", target: "Million Pies", damageAmount: 0 },
        ]

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