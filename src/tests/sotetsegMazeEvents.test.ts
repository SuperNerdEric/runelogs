import { describe, expect, it } from "vitest";
import { getSotetsegMazeWindows } from "../utils/sotetsegMazeEvents";
import { Fight } from "../models/Fight";
import { LogLine, LogTypes } from "../models/LogLine";

const TICK_MS = 600;

function makeFight(data: LogLine[], overrides: Partial<Fight> = {}): Fight {
  return {
    id: "fight-1",
    name: "Sotetseg",
    mainEnemyName: "Sotetseg",
    startTime: "2026-01-01T00:00:00Z",
    isNpc: true,
    isBoss: true,
    isWave: false,
    metaData: {
      name: "Sotetseg",
      startTime: "2026-01-01T00:00:00Z",
      fightDurationTicks: 300,
      success: true,
    },
    data,
    enemyNames: ["Sotetseg"],
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
      target: { name: "Sotetseg", id: 8388, index: 1 },
      hitsplatName: "DAMAGE_ME",
      damageAmount: 1,
    },
    lastLine: {
      type: LogTypes.DAMAGE,
      date: "01-01-2026",
      time: "00:03:00",
      timezone: "Z+0000",
      tick: 300,
      fightTimeMs: 180000,
      source: { name: "Player", isPlayer: true },
      target: { name: "Sotetseg", id: 8388, index: 1 },
      hitsplatName: "DAMAGE_ME",
      damageAmount: 1,
    },
    ...overrides,
  };
}

/** A Sotetseg POSITION log on a given tick for a given form id. */
function sotetsegPosition(tick: number, id: number): LogLine {
  return {
    type: LogTypes.POSITION,
    date: "01-01-2026",
    time: "00:00:00",
    timezone: "Z+0000",
    tick,
    fightTimeMs: tick * TICK_MS,
    source: { name: "Sotetseg", id, index: 1 },
    position: { x: 3300, y: 4300, plane: 0 },
  } as unknown as LogLine;
}

/** Continuous per-tick sightings of a given form over [startTick, endTick). */
function form(startTick: number, endTick: number, id: number): LogLine[] {
  const logs: LogLine[] = [];
  for (let tick = startTick; tick < endTick; tick++) {
    logs.push(sotetsegPosition(tick, id));
  }
  return logs;
}

describe("getSotetsegMazeWindows", () => {
  it("captures a maze window between noncombat and combat forms (regular)", () => {
    const fight = makeFight([
      ...form(1, 20, 8388), // combat
      ...form(20, 50, 8387), // maze
      ...form(50, 80, 8388), // combat again
    ]);

    expect(getSotetsegMazeWindows(fight)).toEqual([
      {
        mazeNumber: 1,
        startFightTimeMs: 20 * TICK_MS,
        startTick: 20,
        endFightTimeMs: 50 * TICK_MS,
        endTick: 50,
        endsWithCombat: true,
      },
    ]);
  });

  it("detects the two mazes of a normal Sotetseg fight in order", () => {
    const fight = makeFight([
      ...form(1, 20, 8388),
      ...form(20, 40, 8387), // maze 1
      ...form(40, 100, 8388),
      ...form(100, 120, 8387), // maze 2
      ...form(120, 160, 8388),
    ]);

    const windows = getSotetsegMazeWindows(fight);
    expect(windows.map((w) => w.mazeNumber)).toEqual([1, 2]);
    expect(windows.map((w) => w.startTick)).toEqual([20, 100]);
    expect(windows.map((w) => w.endTick)).toEqual([40, 120]);
  });

  it("extends an unfinished maze to fight end", () => {
    const fight = makeFight([
      ...form(1, 20, 8388),
      ...form(20, 50, 8387), // maze never closes
    ]);

    const windows = getSotetsegMazeWindows(fight);
    expect(windows).toHaveLength(1);
    expect(windows[0].endsWithCombat).toBe(false);
    expect(windows[0].endFightTimeMs).toBe(180000); // fight end
    expect(windows[0].endTick).toBe(300);
  });

  it("detects entry-mode maze forms (10864 / 10865)", () => {
    const fight = makeFight([
      ...form(1, 10, 10865),
      ...form(10, 30, 10864),
      ...form(30, 50, 10865),
    ]);
    const windows = getSotetsegMazeWindows(fight);
    expect(windows).toHaveLength(1);
    expect(windows[0].startTick).toBe(10);
    expect(windows[0].endTick).toBe(30);
  });

  it("detects hard-mode maze forms (10867 / 10868)", () => {
    const fight = makeFight([
      ...form(1, 10, 10868),
      ...form(10, 30, 10867),
      ...form(30, 50, 10868),
    ]);
    const windows = getSotetsegMazeWindows(fight);
    expect(windows).toHaveLength(1);
    expect(windows[0].startTick).toBe(10);
    expect(windows[0].endTick).toBe(30);
  });

  it("returns no windows when Sotetseg never enters a maze", () => {
    const fight = makeFight([...form(1, 60, 8388)]);
    expect(getSotetsegMazeWindows(fight)).toEqual([]);
  });
});
