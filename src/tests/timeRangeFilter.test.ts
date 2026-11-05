import { describe, expect, it } from "vitest";
import { Fight } from "../models/Fight";
import { LogLine, LogTypes } from "../models/LogLine";
import { calculatePlayerDps } from "../utils/dpsCalculation";
import { getAttackAnimationBreakdown } from "../utils/attackAnimationBreakdown";
import {
  buildEquipmentTimelines,
  playerHasEquipmentAtTime,
} from "../utils/equipmentFilter";
import { deriveGearSetupsFromFight } from "../utils/gearSetup/deriveGearSetup";
import { getFightPerformanceByPlayer } from "../utils/TickActivity";
import {
  clampTimeRange,
  deserializeTimeRange,
  formatFightTime,
  formatTimeRangeFilterLabel,
  getFightTimeAtPlotX,
  isTimeRangeSeed,
  parseFightTime,
  resolveTimeRange,
  serializeTimeRange,
  sliceFightToTimeRange,
} from "../utils/timeRangeFilter";

const ALICE = { name: "Alice", isPlayer: true };
const OCELLUS = { name: "Ocellus", id: 16675, index: 1, isPlayer: false };
const WHIP = "4151";
const BOW = "11235";

const at = (fightTimeMs: number, log: object): LogLine =>
  ({ fightTimeMs, tick: 1000 + fightTimeMs / 600, ...log }) as LogLine;

const damage = (fightTimeMs: number, damageAmount: number): LogLine =>
  at(fightTimeMs, {
    type: LogTypes.DAMAGE,
    source: ALICE,
    target: OCELLUS,
    hitsplatName: "DAMAGE_ME",
    damageAmount,
  });

const equipment = (fightTimeMs: number, weapon: string): LogLine =>
  at(fightTimeMs, {
    type: LogTypes.PLAYER_EQUIPMENT,
    source: ALICE,
    playerEquipment: ["-1", "-1", "-1", weapon],
  });

const boosts = (fightTimeMs: number, ranged: number): LogLine =>
  at(fightTimeMs, {
    type: LogTypes.BOOSTED_LEVELS,
    source: ALICE,
    boostedLevels: { ranged },
  });

const attack = (fightTimeMs: number): LogLine =>
  at(fightTimeMs, {
    type: LogTypes.PLAYER_ATTACK_ANIMATION,
    source: ALICE,
    target: OCELLUS,
    animationId: 390,
  });

const makeFight = (data: LogLine[]): Fight =>
  ({
    name: "Ocellus",
    players: ["Alice"],
    enemyNames: ["Ocellus"],
    loggedInPlayer: "Alice",
    metaData: { fightDurationTicks: 100, name: "Ocellus", success: true },
    firstLine: data[0],
    lastLine: data[data.length - 1],
    gearSetups: [{ player: "Alice" }],
    data,
  }) as unknown as Fight;

const realLogs = (fight: Fight) =>
  fight.data.filter((log) => !isTimeRangeSeed(log));

describe("timeRangeFilter", () => {
  describe("query param", () => {
    it("round-trips a range", () => {
      const range = { startMs: 6000, endMs: 12000 };
      expect(deserializeTimeRange(serializeTimeRange(range))).toEqual(range);
    });

    it.each([null, "", "abc", "12000", "12000-6000", "6000-6000", "-1-5"])(
      "rejects %s",
      (value) => {
        expect(deserializeTimeRange(value)).toBeNull();
      },
    );
  });

  describe("resolving against the fight", () => {
    const bounds = { startMs: 0, endMs: 60000 };

    it("snaps to ticks and clamps to the fight", () => {
      expect(clampTimeRange({ startMs: 700, endMs: 90000 }, bounds)).toEqual({
        startMs: 600,
        endMs: 60000,
      });
    });

    it("rejects less than one tick inside the fight", () => {
      expect(clampTimeRange({ startMs: 700, endMs: 800 }, bounds)).toBeNull();
      expect(
        clampTimeRange({ startMs: 70000, endMs: 80000 }, bounds),
      ).toBeNull();
    });

    it("treats the whole fight as no filter", () => {
      expect(resolveTimeRange({ startMs: 0, endMs: 90000 }, bounds)).toBeNull();
      expect(resolveTimeRange(null, bounds)).toBeNull();
    });

    it("keeps a range that narrows the fight", () => {
      expect(resolveTimeRange({ startMs: 600, endMs: 1200 }, bounds)).toEqual({
        startMs: 600,
        endMs: 1200,
      });
    });
  });

  describe("sliceFightToTimeRange", () => {
    const fight = makeFight([
      equipment(0, WHIP),
      boosts(0, 99),
      damage(0, 10),
      equipment(6000, BOW),
      boosts(6000, 112),
      damage(6000, 20),
      damage(12000, 30),
      attack(12000),
      damage(18000, 40),
      damage(60000, 50),
    ]);
    const range = { startMs: 12000, endMs: 18000 };

    it("returns the same fight without a range", () => {
      expect(sliceFightToTimeRange(fight, null)).toBe(fight);
    });

    it("keeps only logs inside the inclusive range", () => {
      const damageAmounts = realLogs(sliceFightToTimeRange(fight, range))
        .filter((log) => log.type === LogTypes.DAMAGE)
        .map((log) => (log as { damageAmount?: number }).damageAmount);
      expect(damageAmounts).toEqual([30, 40]);
    });

    it("rebases the time span and duration on the range", () => {
      const sliced = sliceFightToTimeRange(fight, range);
      expect(sliced.firstLine.fightTimeMs).toBe(12000);
      expect(sliced.lastLine.fightTimeMs).toBe(18000);
      expect(sliced.metaData.fightDurationTicks).toBe(10);
      expect(sliced.appliedTimeRange).toEqual(range);
    });

    it("computes DPS over the range, not the whole fight", () => {
      const [alice] = calculatePlayerDps(sliceFightToTimeRange(fight, range));
      expect(alice.damageDealt).toBe(70);
      expect(alice.dps).toBeCloseTo(70 / 6);
    });

    it("carries the latest state forward to the range start", () => {
      const seeds = sliceFightToTimeRange(fight, range).data.filter(
        isTimeRangeSeed,
      );
      expect(seeds.map((log) => [log.type, log.fightTimeMs])).toEqual([
        [LogTypes.PLAYER_EQUIPMENT, 12000],
        [LogTypes.BOOSTED_LEVELS, 12000],
      ]);
      expect(seeds[0]).toMatchObject({
        playerEquipment: ["-1", "-1", "-1", BOW],
      });
      expect(seeds[1]).toMatchObject({ boostedLevels: { ranged: 112 } });
    });

    it("does not seed state already logged on the first tick", () => {
      const sliced = sliceFightToTimeRange(fight, {
        startMs: 6000,
        endMs: 12000,
      });
      expect(sliced.data.filter(isTimeRangeSeed)).toEqual([]);
    });

    it("never mutates the original logs", () => {
      sliceFightToTimeRange(fight, range);
      expect(fight.data[3]).not.toHaveProperty("isTimeRangeSeed");
      expect(fight.data[3].fightTimeMs).toBe(6000);
    });

    it("keeps the equipment filter timeline correct inside the range", () => {
      const timelines = buildEquipmentTimelines(
        sliceFightToTimeRange(fight, range).data,
      );
      expect(
        playerHasEquipmentAtTime(timelines, "Alice", 12000, Number(BOW)),
      ).toBe(true);
    });

    it("attributes attacks to the weapon worn before the range began", () => {
      const [alice] = getAttackAnimationBreakdown(
        sliceFightToTimeRange(fight, range),
      );
      expect(alice.totalAttacks).toBe(1);
      expect(alice.weapons[0].itemId).toBe(Number(BOW));
    });

    it("scores activity against the range using the carried weapon", () => {
      const performance = getFightPerformanceByPlayer(
        sliceFightToTimeRange(fight, range),
      ).get("Alice")!;
      expect(performance.actualWeaponHits).toBe(1);
      expect(performance.activeTicks).toBeGreaterThan(0);
    });

    it("drops stored gear setups so they reflect the range", () => {
      const inventory = at(0, {
        type: LogTypes.PLAYER_INVENTORY,
        source: ALICE,
        inventory: [{ id: 1, quantity: 1 }],
      });
      const pouch = at(0, {
        type: LogTypes.RUNE_POUCH,
        source: ALICE,
        runePouch: [],
      });
      const sliced = sliceFightToTimeRange(
        makeFight([inventory, pouch, ...fight.data]),
        range,
      );
      expect(sliced.gearSetups).toBeUndefined();
      expect(deriveGearSetupsFromFight(sliced)[0].player).toBe("Alice");
    });
  });

  describe("chart position", () => {
    const plot = { left: 100, width: 600 };
    const domain = { startMs: 6000, endMs: 66000 };

    it("maps a pointer to the nearest tick", () => {
      expect(getFightTimeAtPlotX(400, plot, domain)).toBe(36000);
      expect(getFightTimeAtPlotX(106, plot, domain)).toBe(6600);
    });

    it("clamps a pointer dragged past the plot", () => {
      expect(getFightTimeAtPlotX(0, plot, domain)).toBe(6000);
      expect(getFightTimeAtPlotX(9999, plot, domain)).toBe(66000);
    });
  });

  describe("typing and formatting times", () => {
    it.each([
      ["83", 83000],
      ["83.4", 83400],
      ["1:23", 83000],
      [" 1:23.4 ", 83400],
      ["1:01:23", 3683000],
    ])("parses %s", (value, expected) => {
      expect(parseFightTime(value)).toBe(expected);
    });

    it.each(["", "abc", "1:", ":30", "1:2:3:4", "-5"])(
      "rejects %s",
      (value) => {
        expect(parseFightTime(value)).toBeNull();
      },
    );

    it("formats and re-parses tick times exactly", () => {
      expect(formatFightTime(83400)).toBe("01:23.4");
      expect(formatFightTime(3683400)).toBe("01:01:23.4");
      expect(parseFightTime(formatFightTime(83400))).toBe(83400);
    });

    it("labels the chip", () => {
      expect(formatTimeRangeFilterLabel({ startMs: 12000, endMs: 18600 })).toBe(
        "Time range: 00:12.0 – 00:18.6",
      );
    });
  });
});
