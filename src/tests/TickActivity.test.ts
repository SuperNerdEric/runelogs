import { describe, expect, it } from "vitest";
import { Fight } from "../models/Fight";
import { LogTypes } from "../models/LogLine";
import {
  getFightPerformanceByPlayer,
  getTargetGroupActivityPercent,
} from "../utils/TickActivity";

function makeFight(overrides: Partial<Fight> = {}): Fight {
  return {
    id: "fight-1",
    name: "Verzik P1",
    mainEnemyName: "Verzik P1",
    startTime: "2025-01-01T00:00:00.000Z",
    isNpc: true,
    isBoss: true,
    isWave: false,
    metaData: {
      name: "Verzik P1",
      startTime: "2025-01-01T00:00:00.000Z",
      fightDurationTicks: 10,
      success: true,
    },
    data: [],
    enemyNames: ["Verzik Vitur"],
    players: ["Player"],
    loggedInPlayer: "Player",
    logVersion: "1.3.6",
    firstLine: {
      type: LogTypes.DAMAGE,
      tick: 100,
      fightTimeMs: 0,
    } as Fight["firstLine"],
    lastLine: {
      type: LogTypes.DEATH,
      tick: 110,
      fightTimeMs: 0,
    } as Fight["lastLine"],
    ...overrides,
  };
}

describe("getFightPerformanceByPlayer", () => {
  it("does not produce negative activity when lastLine.fightTimeMs was zeroed by a phase transition", () => {
    const fight = makeFight({
      data: [
        {
          type: LogTypes.PLAYER_EQUIPMENT,
          tick: 100,
          fightTimeMs: 0,
          source: { name: "Player", isPlayer: true },
          playerEquipment: ["24539"],
        },
        {
          type: LogTypes.PLAYER_ATTACK_ANIMATION,
          tick: 105,
          fightTimeMs: 3000,
          source: { name: "Player", isPlayer: true },
          target: { name: "Verzik Vitur", id: 8370, index: 1, isPlayer: false },
          animationId: 390,
        },
        {
          type: LogTypes.PLAYER_ATTACK_ANIMATION,
          tick: 108,
          fightTimeMs: 4800,
          source: { name: "Player", isPlayer: true },
          target: { name: "Verzik Vitur", id: 8370, index: 1, isPlayer: false },
          animationId: 390,
        },
      ] as unknown as Fight["data"],
    });

    const performance = getFightPerformanceByPlayer(fight).get("Player")!;
    const activityPercent =
      (performance.activeTicks / fight.metaData.fightDurationTicks) * 100;

    expect(activityPercent).toBeGreaterThanOrEqual(0);
    expect(performance.activeTime).toBeGreaterThanOrEqual(0);
    expect(performance.activeTicks).toBeGreaterThanOrEqual(0);
  });

  it("caps active time at the fight end when lastLine.fightTimeMs is valid", () => {
    const fight = makeFight({
      metaData: {
        name: "Verzik P1",
        startTime: "2025-01-01T00:00:00.000Z",
        fightDurationTicks: 10,
        success: true,
      },
      lastLine: {
        type: LogTypes.DEATH,
        tick: 110,
        fightTimeMs: 6000,
      } as Fight["lastLine"],
      data: [
        {
          type: LogTypes.PLAYER_EQUIPMENT,
          tick: 100,
          fightTimeMs: 0,
          source: { name: "Player", isPlayer: true },
          playerEquipment: ["24539"],
        },
        {
          type: LogTypes.PLAYER_ATTACK_ANIMATION,
          tick: 110,
          fightTimeMs: 6000,
          source: { name: "Player", isPlayer: true },
          target: { name: "Verzik Vitur", id: 8370, index: 1, isPlayer: false },
          animationId: 390,
        },
      ] as unknown as Fight["data"],
    });

    const performance = getFightPerformanceByPlayer(fight).get("Player")!;
    const activityPercent =
      (performance.activeTicks / fight.metaData.fightDurationTicks) * 100;

    expect(activityPercent).toBeGreaterThanOrEqual(0);
    expect(activityPercent).toBeLessThanOrEqual(100);
  });
});

describe("getTargetGroupActivityPercent", () => {
  it("attributes attack activity to target groups for drill-down rows", () => {
    const fight = makeFight({
      metaData: {
        name: "Verzik P1",
        startTime: "2025-01-01T00:00:00.000Z",
        fightDurationTicks: 10,
        success: true,
      },
      lastLine: {
        type: LogTypes.DEATH,
        tick: 110,
        fightTimeMs: 6000,
      } as Fight["lastLine"],
      data: [
        {
          type: LogTypes.PLAYER_EQUIPMENT,
          tick: 100,
          fightTimeMs: 0,
          source: { name: "Player", isPlayer: true },
          playerEquipment: ["24539"],
        },
        {
          type: LogTypes.PLAYER_ATTACK_ANIMATION,
          tick: 105,
          fightTimeMs: 0,
          source: { name: "Player", isPlayer: true },
          target: { name: "Nechryael", id: 8, index: 1, isPlayer: false },
          animationId: 390,
        },
        {
          type: LogTypes.PLAYER_ATTACK_ANIMATION,
          tick: 108,
          fightTimeMs: 3000,
          source: { name: "Player", isPlayer: true },
          target: {
            name: "Aberrant spectre",
            id: 2,
            index: 1,
            isPlayer: false,
          },
          animationId: 390,
        },
      ] as unknown as Fight["data"],
    });

    const activityByGroup = getTargetGroupActivityPercent(
      fight,
      "Player",
      (target) => `name:${target.name}`,
    );

    expect(activityByGroup.get("name:Nechryael")).toBeGreaterThan(0);
    expect(activityByGroup.get("name:Aberrant spectre")).toBeGreaterThan(0);
  });
});
