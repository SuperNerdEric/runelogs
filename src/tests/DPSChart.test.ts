import {
  calculateDPSByInterval,
  densifyDpsToTicks,
} from "../components/charts/DPSChart";
import { DamageLog, LogTypes } from "../models/LogLine";
import { convertTimeToMillis } from "../utils/utils";

function fightBounds(logLines: DamageLog[]) {
  const times = logLines.map((log) => log.fightTimeMs!);
  return { startTime: Math.min(...times), endTime: Math.max(...times) };
}

describe("calculateDPSByInterval", () => {
  test("calculate dps by 6 second intervals", () => {
    const logLines: DamageLog[] = [
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
    ];

    const { startTime, endTime } = fightBounds(logLines);
    const dpsData = calculateDPSByInterval(logLines, 6000, startTime, endTime);

    expect(dpsData[0].dps).toBeCloseTo(71 / 6, 6);
  });

  test("calculate 0 dps at the end", () => {
    const logLines: DamageLog[] = [
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

    const { startTime, endTime } = fightBounds(logLines);
    const dpsData = calculateDPSByInterval(logLines, 6000, startTime, endTime);

    expect(dpsData[0].dps).toBeCloseTo(2, 6);
    expect(dpsData[1].dps).toBeCloseTo(1.667, 3);
    expect(dpsData[2].dps).toBeCloseTo(1.333, 3);
    expect(dpsData[3].dps).toBeCloseTo(0, 3);
    expect(dpsData[4].dps).toBeCloseTo(0, 3);
    expect(dpsData[5].dps).toBeCloseTo(0, 3);
    expect(dpsData[6].dps).toBeCloseTo(0, 3);
  });
});

describe("densifyDpsToTicks", () => {
  test("creates a selectable point every tick while preserving coarse values", () => {
    const densified = densifyDpsToTicks(
      [
        { timestamp: 6000, dps: 10 },
        { timestamp: 12000, dps: 20 },
      ],
      0,
      12000,
      600,
    );

    expect(densified).toHaveLength(21);
    expect(densified[0]).toEqual({ timestamp: 0, dps: 10 });
    expect(densified[10]).toEqual({ timestamp: 6000, dps: 10 });
    expect(densified[20]).toEqual({ timestamp: 12000, dps: 20 });
    // Flat approach into a ramp uses monotone easing (not a sharp linear seam).
    expect(densified[15].dps).not.toBeCloseTo(15, 6);
    expect(densified[15].dps).toBeGreaterThan(10);
    expect(densified[15].dps).toBeLessThan(20);
  });
});

function generateDamageLog(
  date: string,
  time: string,
  damageAmount: number,
): DamageLog {
  return {
    type: LogTypes.DAMAGE,
    date,
    time,
    fightTimeMs: convertTimeToMillis(time),
    timezone: "",
    source: { name: "Million Pies" },
    target: { name: "Scurrius" },
    damageAmount,
    hitsplatName: "DAMAGE_ME",
  };
}
