import { describe, expect, it } from "vitest";
import { Fight } from "../models/Fight";
import { LogTypes } from "../models/LogLine";
import {
  calculateFightDps,
  calculatePlayerDps,
  getFightDurationSeconds,
  isLeaderboardEligibleDamage,
} from "../utils/dpsCalculation";
import { DamageLog, LogTypes } from "../models/LogLine";

function makeFight(overrides: Partial<Fight> = {}): Fight {
  return {
    id: "fight-1",
    name: "Test Boss",
    mainEnemyName: "Test Boss",
    startTime: "2025-01-01T00:00:00.000Z",
    isNpc: true,
    isBoss: true,
    isWave: false,
    metaData: {
      name: "Test Boss",
      startTime: "2025-01-01T00:00:00.000Z",
      fightDurationTicks: 100,
      success: true,
    },
    data: [],
    enemyNames: ["Test Boss"],
    players: ["Alice", "Bob"],
    loggedInPlayer: "Alice",
    logVersion: "1.3.6",
    firstLine: {
      type: LogTypes.WAVE_START,
      tick: 100,
      fightTimeMs: 0,
    } as Fight["firstLine"],
    lastLine: {
      type: LogTypes.WAVE_END,
      tick: 200,
      fightTimeMs: 60000,
    } as Fight["lastLine"],
    ...overrides,
  };
}

describe("getFightDurationSeconds", () => {
  it("prefers tick duration over fightTimeMs", () => {
    const fight = makeFight({
      metaData: {
        name: "Test Boss",
        startTime: "2025-01-01T00:00:00.000Z",
        fightDurationTicks: 100,
        success: true,
      },
      firstLine: {
        type: LogTypes.WAVE_START,
        tick: 100,
        fightTimeMs: 0,
      } as Fight["firstLine"],
      lastLine: {
        type: LogTypes.WAVE_END,
        tick: 200,
        fightTimeMs: 50000,
      } as Fight["lastLine"],
    });

    expect(getFightDurationSeconds(fight)).toBe(60);
  });
});

describe("calculatePlayerDps", () => {
  it("matches backend leaderboard rules", () => {
    const fight = makeFight({
      data: [
        {
          type: LogTypes.DAMAGE,
          source: { name: "Alice", isPlayer: true },
          target: { name: "Test Boss", isPlayer: false, index: 1 },
          damageAmount: 600,
          hitsplatName: "DAMAGE_ME",
        },
        {
          type: LogTypes.DAMAGE,
          source: { name: "Bob", isPlayer: true },
          target: { name: "Test Boss", isPlayer: false, index: 1 },
          damageAmount: 300,
          hitsplatName: "DAMAGE_OTHER",
        },
      ] as Fight["data"],
    });

    const results = calculatePlayerDps(fight);
    expect(results.find((entry) => entry.playerName === "Alice")).toMatchObject(
      { damageDealt: 600, dps: 10 },
    );
    expect(results.find((entry) => entry.playerName === "Bob")).toMatchObject({
      damageDealt: 300,
      dps: 5,
    });
  });

  it("respects additional UI filters passed via logs", () => {
    const fight = makeFight({
      data: [
        {
          type: LogTypes.DAMAGE,
          source: { name: "Alice", isPlayer: true },
          target: { name: "Test Boss", isPlayer: false, index: 1 },
          damageAmount: 600,
          hitsplatName: "DAMAGE_ME",
        },
        {
          type: LogTypes.DAMAGE,
          source: { name: "Bob", isPlayer: true },
          target: { name: "Test Boss", isPlayer: false, index: 1 },
          damageAmount: 300,
          hitsplatName: "DAMAGE_OTHER",
        },
      ] as Fight["data"],
    });

    const filteredLogs = fight.data.filter(
      (log) =>
        log.type === LogTypes.DAMAGE &&
        (log as { source?: { name?: string } }).source?.name === "Alice",
    );
    const results = calculatePlayerDps(fight, filteredLogs);

    expect(results).toHaveLength(1);
    expect(results[0].playerName).toBe("Alice");
    expect(results[0].dps).toBe(10);
  });
});

describe("isLeaderboardEligibleDamage", () => {
  it("excludes player targets and sailing boats", () => {
    const playerHit = {
      type: LogTypes.DAMAGE,
      source: { name: "Alice" },
      target: { name: "Bob" },
      damageAmount: 10,
      hitsplatName: "DAMAGE_OTHER",
    } as DamageLog;
    const boatHit = {
      type: LogTypes.DAMAGE,
      source: { name: "Alice" },
      target: { name: "Raft", id: 15187, index: 1 },
      damageAmount: 10,
      hitsplatName: "DAMAGE_ME",
    } as DamageLog;
    const bossHit = {
      type: LogTypes.DAMAGE,
      source: { name: "Alice" },
      target: { name: "Zebak", id: 1, index: 1 },
      damageAmount: 10,
      hitsplatName: "DAMAGE_ME",
    } as DamageLog;

    expect(isLeaderboardEligibleDamage(playerHit)).toBe(false);
    expect(isLeaderboardEligibleDamage(boatHit)).toBe(false);
    expect(isLeaderboardEligibleDamage(bossHit)).toBe(true);
  });
});

describe("calculateFightDps", () => {
  it("uses the currently visible logs and tick duration", () => {
    const fight = makeFight({
      data: [
        {
          type: LogTypes.DAMAGE,
          source: { name: "Alice", isPlayer: true },
          target: { name: "Test Boss", isPlayer: false, index: 1 },
          damageAmount: 900,
          hitsplatName: "DAMAGE_ME",
        },
      ] as Fight["data"],
    });

    expect(calculateFightDps(fight)).toBe(15);
  });
});
