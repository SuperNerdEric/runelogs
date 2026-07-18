import { describe, expect, it } from "vitest";
import {
  getXarpusPhase2Markers,
  XARPUS_PHASE2_DELAY_TICKS,
} from "../utils/xarpusPhase2Events";
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
      target: { name: "Xarpus", id: 8339, index: 1 },
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

function npcChanged(tick: number, fromId: number, toId: number): LogLine {
  return {
    type: LogTypes.NPC_CHANGED,
    date: "01-01-2026",
    time: "00:00:00",
    timezone: "Z+0000",
    tick,
    fightTimeMs: tick * TICK_MS,
    source: { name: "Xarpus", id: fromId, index: 1 },
    oldNpc: { name: "Xarpus", id: fromId, index: 1 },
    newNpc: { name: "Xarpus", id: toId, index: 1 },
  } as unknown as LogLine;
}

describe("getXarpusPhase2Markers", () => {
  it("marks Phase 2 two ticks after the regular transition", () => {
    const fight = makeFight([npcChanged(50, 8339, 8340)]);
    expect(getXarpusPhase2Markers(fight)).toEqual([
      {
        label: "Phase 2",
        fightTimeMs: (50 + XARPUS_PHASE2_DELAY_TICKS) * TICK_MS,
        tick: 50 + XARPUS_PHASE2_DELAY_TICKS,
      },
    ]);
  });

  it("detects the entry-mode transition", () => {
    const fight = makeFight([npcChanged(40, 10767, 10768)]);
    expect(getXarpusPhase2Markers(fight)).toEqual([
      { label: "Phase 2", fightTimeMs: 42 * TICK_MS, tick: 42 },
    ]);
  });

  it("detects the hard-mode transition", () => {
    const fight = makeFight([npcChanged(30, 10771, 10772)]);
    expect(getXarpusPhase2Markers(fight)).toEqual([
      { label: "Phase 2", fightTimeMs: 32 * TICK_MS, tick: 32 },
    ]);
  });

  it("ignores unrelated NPC transitions", () => {
    const fight = makeFight([
      npcChanged(50, 8340, 8341),
      npcChanged(60, 8339, 9999),
    ]);
    expect(getXarpusPhase2Markers(fight)).toEqual([]);
  });

  it("deduplicates transitions landing on the same tick", () => {
    const fight = makeFight([
      npcChanged(50, 8339, 8340),
      npcChanged(50, 8339, 8340),
    ]);
    expect(getXarpusPhase2Markers(fight)).toHaveLength(1);
  });

  it("returns no markers when the transition is absent (older logs)", () => {
    const fight = makeFight([npcChanged(50, 8340, 8341)]);
    expect(getXarpusPhase2Markers(fight)).toEqual([]);
  });
});
