import { describe, expect, it } from "vitest";
import { Fight } from "../models/Fight";
import { LogTypes } from "../models/LogLine";
import { getReplayMissedTicks } from "../utils/replayMissedTicks";

function makeFight(data: Fight["data"], overrides: Partial<Fight> = {}): Fight {
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
      fightDurationTicks: 11,
      success: true,
    },
    data,
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
      fightTimeMs: 6000,
    } as Fight["lastLine"],
    ...overrides,
  };
}

describe("getReplayMissedTicks", () => {
  it("marks ticks where weapon cooldown was ready but no attack happened", () => {
    const fight = makeFight([
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
    ] as unknown as Fight["data"]);

    const missed = getReplayMissedTicks(fight, 100, 110);

    expect(missed[100]?.Player).toBe(true);
    expect(missed[101]?.Player).toBe(true);
    expect(missed[104]?.Player).toBe(true);
    expect(missed[105]?.Player).toBeUndefined();
    expect(missed[109]?.Player).toBe(true);
    expect(missed[110]?.Player).toBe(true);
  });

  it("does not mark missed ticks before a weapon is equipped", () => {
    const fight = makeFight([
      {
        type: LogTypes.PLAYER_ATTACK_ANIMATION,
        tick: 101,
        fightTimeMs: 600,
        source: { name: "Player", isPlayer: true },
        target: { name: "Verzik Vitur", id: 8370, index: 1, isPlayer: false },
        animationId: 390,
      },
      {
        type: LogTypes.PLAYER_EQUIPMENT,
        tick: 105,
        fightTimeMs: 3000,
        source: { name: "Player", isPlayer: true },
        playerEquipment: ["24539"],
      },
    ] as unknown as Fight["data"]);

    const missed = getReplayMissedTicks(fight, 100, 110);

    expect(missed[100]?.Player).toBeUndefined();
    expect(missed[101]?.Player).toBeUndefined();
    expect(missed[105]?.Player).toBe(true);
  });
});
