import { describe, expect, it } from "vitest";
import { getXarpusScreechMarkers } from "../utils/xarpusScreechEvents";
import { Fight } from "../models/Fight";
import { LogLine, LogTypes } from "../models/LogLine";

const TICK_MS = 600;

function makeFight(data: LogLine[], overrides: Partial<Fight> = {}): Fight {
  return {
    id: "fight-1",
    name: "Xarpus",
    mainEnemyName: "Xarpus",
    startTime: "2026-01-01T00:00:00Z",
    isNpc: true,
    isBoss: true,
    isWave: false,
    metaData: {
      name: "Xarpus",
      startTime: "2026-01-01T00:00:00Z",
      fightDurationTicks: 200,
      success: true,
    },
    data,
    enemyNames: ["Xarpus"],
    loggedInPlayer: "Player",
    players: ["Player"],
    logVersion: "1.7.0",
    firstLine: {
      type: LogTypes.DAMAGE,
      date: "01-01-2026",
      time: "00:00:00",
      timezone: "Z+0000",
      tick: 1,
      fightTimeMs: 0,
      source: { name: "Player", isPlayer: true },
      target: { name: "Xarpus", id: 8340, index: 1 },
      hitsplatName: "DAMAGE_ME",
      damageAmount: 1,
    },
    lastLine: {
      type: LogTypes.DAMAGE,
      date: "01-01-2026",
      time: "00:02:00",
      timezone: "Z+0000",
      tick: 200,
      fightTimeMs: 120000,
      source: { name: "Player", isPlayer: true },
      target: { name: "Xarpus", id: 8340, index: 1 },
      hitsplatName: "DAMAGE_ME",
      damageAmount: 1,
    },
    ...overrides,
  };
}

function screech(tick: number, id = 8340): LogLine {
  return {
    type: LogTypes.PLAYER_ATTACK_ANIMATION,
    date: "01-01-2026",
    time: "00:00:00",
    timezone: "Z+0000",
    tick,
    fightTimeMs: tick * TICK_MS,
    source: { name: "Xarpus", id, index: 57733 },
    animationId: 0,
    attackSpecial: "SCREECH",
  } as unknown as LogLine;
}

function spit(tick: number): LogLine {
  return {
    type: LogTypes.PLAYER_ATTACK_ANIMATION,
    date: "01-01-2026",
    time: "00:00:00",
    timezone: "Z+0000",
    tick,
    fightTimeMs: tick * TICK_MS,
    source: { name: "Xarpus", id: 8340, index: 57733 },
    animationId: 0,
    attackSpecial: "SPIT",
  } as unknown as LogLine;
}

describe("getXarpusScreechMarkers", () => {
  it("marks the P3 Screech", () => {
    const fight = makeFight([spit(40), spit(50), screech(90)]);
    expect(getXarpusScreechMarkers(fight)).toEqual([
      { label: "Phase 3", fightTimeMs: 90 * TICK_MS, tick: 90 },
    ]);
  });

  it("detects Screech across Xarpus mode ids and ignores other specials", () => {
    const fight = makeFight([spit(40), screech(88, 10768)]); // hard-mode id
    expect(getXarpusScreechMarkers(fight)).toEqual([
      { label: "Phase 3", fightTimeMs: 88 * TICK_MS, tick: 88 },
    ]);
  });

  it("deduplicates multiple Screech log lines on the same tick", () => {
    const fight = makeFight([screech(90), screech(90)]);
    expect(getXarpusScreechMarkers(fight)).toHaveLength(1);
  });

  it("returns markers in chronological order", () => {
    const fight = makeFight([screech(150), screech(90)]);
    expect(getXarpusScreechMarkers(fight).map((m) => m.tick)).toEqual([
      90, 150,
    ]);
  });

  it("returns no markers when there is no Screech", () => {
    const fight = makeFight([spit(40), spit(50)]);
    expect(getXarpusScreechMarkers(fight)).toEqual([]);
  });
});
