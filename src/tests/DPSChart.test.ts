import {LogLine, parseLogLine} from "../FileParser";
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
});