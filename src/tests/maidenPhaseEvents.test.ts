import { describe, expect, it } from "vitest";
import {
  getMaidenPhaseMarkers,
  injectMaidenPhaseSpawnAttacks,
  MAIDEN_PHASE_MIN_WAVE_SIZE,
  MaidenPhaseMarker,
} from "../utils/maidenPhaseEvents";
import { Fight } from "../models/Fight";
import { LogLine, LogTypes } from "../models/LogLine";

const TICK_MS = 600;

function makeFight(data: LogLine[], overrides: Partial<Fight> = {}): Fight {
  return {
    id: "fight-1",
    name: "The Maiden of Sugadinti",
    mainEnemyName: "The Maiden of Sugadinti",
    startTime: "2026-01-01T00:00:00Z",
    isNpc: true,
    isBoss: true,
    isWave: false,
    metaData: {
      name: "The Maiden of Sugadinti",
      startTime: "2026-01-01T00:00:00Z",
      fightDurationTicks: 200,
      success: true,
    },
    data,
    enemyNames: ["The Maiden of Sugadinti"],
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
      target: { name: "The Maiden of Sugadinti", id: 8360, index: 1 },
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
      target: { name: "The Maiden of Sugadinti", id: 8360, index: 1 },
      hitsplatName: "DAMAGE_ME",
      damageAmount: 1,
    },
    ...overrides,
  };
}

/** A Matomenos POSITION log for a given crab instance on a given tick. */
function matomenosPosition(index: number, tick: number, id = 8366): LogLine {
  return {
    type: LogTypes.POSITION,
    date: "01-01-2026",
    time: "00:00:00",
    timezone: "Z+0000",
    tick,
    fightTimeMs: tick * TICK_MS,
    source: { name: "Nylocas Matomenos", id, index },
    position: { x: 3180, y: 4444, plane: 0 },
  };
}

/** A wave of `count` crabs first appearing on `tick`, indices from `baseIndex`. */
function spawnWave(baseIndex: number, tick: number, count: number): LogLine[] {
  return Array.from({ length: count }, (_, i) =>
    matomenosPosition(baseIndex + i, tick),
  );
}

describe("getMaidenPhaseMarkers", () => {
  it("labels the three Matomenos spawn bursts 70%, 50%, 30% in order", () => {
    const fight = makeFight([
      ...spawnWave(40148, 70, 8),
      ...spawnWave(41059, 120, 8),
      ...spawnWave(42000, 170, 8),
    ]);

    const markers = getMaidenPhaseMarkers(fight);
    expect(markers).toEqual([
      {
        label: "70%",
        waveNumber: 1,
        fightTimeMs: 70 * TICK_MS,
        tick: 70,
        spawnCount: 8,
      },
      {
        label: "50%",
        waveNumber: 2,
        fightTimeMs: 120 * TICK_MS,
        tick: 120,
        spawnCount: 8,
      },
      {
        label: "30%",
        waveNumber: 3,
        fightTimeMs: 170 * TICK_MS,
        tick: 170,
        spawnCount: 8,
      },
    ]);
  });

  it("uses the earliest sighting of each crab as the wave time", () => {
    const fight = makeFight([
      // Later sighting first in the array to prove min-time is used.
      matomenosPosition(40148, 72),
      matomenosPosition(40148, 70),
      matomenosPosition(40149, 70),
      matomenosPosition(40150, 70),
    ]);

    const markers = getMaidenPhaseMarkers(fight);
    expect(markers).toHaveLength(1);
    expect(markers[0].fightTimeMs).toBe(70 * TICK_MS);
    expect(markers[0].label).toBe("70%");
  });

  it("groups crabs of one wave even if a straggler appears a tick late", () => {
    const fight = makeFight([
      ...spawnWave(40148, 70, 6),
      matomenosPosition(40160, 71),
    ]);

    const markers = getMaidenPhaseMarkers(fight);
    expect(markers).toHaveLength(1);
    expect(markers[0].spawnCount).toBe(7);
    expect(markers[0].fightTimeMs).toBe(70 * TICK_MS);
  });

  it("only reports waves that reached the 50% and 30% thresholds", () => {
    const fight = makeFight([
      ...spawnWave(40148, 70, 8),
      ...spawnWave(41059, 120, 8),
    ]);

    const markers = getMaidenPhaseMarkers(fight);
    expect(markers.map((m) => m.label)).toEqual(["70%", "50%"]);
  });

  it("detects crabs from damage and target-change logs, not just positions", () => {
    const fight = makeFight([
      {
        type: LogTypes.TARGET_CHANGE,
        date: "01-01-2026",
        time: "00:00:00",
        timezone: "Z+0000",
        tick: 70,
        fightTimeMs: 70 * TICK_MS,
        source: { name: "Nylocas Matomenos", id: 8366, index: 40148 },
        target: { name: "The Maiden of Sugadinti", id: 8361, index: 1 },
      },
      {
        type: LogTypes.DAMAGE,
        date: "01-01-2026",
        time: "00:00:00",
        timezone: "Z+0000",
        tick: 71,
        fightTimeMs: 71 * TICK_MS,
        source: { name: "Player", isPlayer: true },
        target: { name: "Nylocas Matomenos", id: 8366, index: 40149 },
        hitsplatName: "DAMAGE_OTHER",
        damageAmount: 20,
      },
    ]);

    const markers = getMaidenPhaseMarkers(fight);
    expect(markers).toHaveLength(1);
    expect(markers[0].spawnCount).toBe(2);
  });

  it("ignores a lone stray Matomenos below the minimum wave size", () => {
    expect(MAIDEN_PHASE_MIN_WAVE_SIZE).toBeGreaterThan(1);
    const fight = makeFight([matomenosPosition(40148, 70)]);
    expect(getMaidenPhaseMarkers(fight)).toEqual([]);
  });

  it("captures the spawn tick of the first crab in each wave", () => {
    const fight = makeFight([
      ...spawnWave(40148, 70, 8),
      ...spawnWave(41059, 120, 8),
    ]);

    expect(getMaidenPhaseMarkers(fight).map((m) => m.tick)).toEqual([70, 120]);
  });

  it("returns no markers when there are no Matomenos", () => {
    const fight = makeFight([
      {
        type: LogTypes.DAMAGE,
        date: "01-01-2026",
        time: "00:00:00",
        timezone: "Z+0000",
        tick: 10,
        fightTimeMs: 6000,
        source: { name: "Player", isPlayer: true },
        target: { name: "The Maiden of Sugadinti", id: 8360, index: 1 },
        hitsplatName: "DAMAGE_ME",
        damageAmount: 5,
      },
    ]);
    expect(getMaidenPhaseMarkers(fight)).toEqual([]);
  });
});

interface TestCell {
  attackName: string;
  attackImageUrl: string;
}

function marker(overrides: Partial<MaidenPhaseMarker>): MaidenPhaseMarker {
  return {
    label: "70%",
    waveNumber: 1,
    fightTimeMs: 70 * TICK_MS,
    tick: 70,
    spawnCount: 8,
    ...overrides,
  };
}

describe("injectMaidenPhaseSpawnAttacks", () => {
  it("places a spawn cell on each Maiden row at the wave tick", () => {
    const byTick: Record<number, Record<string, TestCell>> = {};
    injectMaidenPhaseSpawnAttacks(
      byTick,
      ["maiden:39244"],
      [
        marker({ label: "70%", tick: 70 }),
        marker({ label: "50%", waveNumber: 2, tick: 120 }),
      ],
      (m) => ({ attackName: `${m.label} spawn`, attackImageUrl: "crab.png" }),
    );

    expect(byTick[70]["maiden:39244"].attackName).toBe("70% spawn");
    expect(byTick[120]["maiden:39244"].attackName).toBe("50% spawn");
  });

  it("does not overwrite a real Maiden attack already on that tick", () => {
    const byTick: Record<number, Record<string, TestCell>> = {
      70: { "maiden:39244": { attackName: "Blood throw", attackImageUrl: "" } },
    };
    injectMaidenPhaseSpawnAttacks(
      byTick,
      ["maiden:39244"],
      [marker({ tick: 70 })],
      (m) => ({ attackName: `${m.label} spawn`, attackImageUrl: "crab.png" }),
    );

    expect(byTick[70]["maiden:39244"].attackName).toBe("Blood throw");
  });

  it("is a no-op without Maiden rows or markers", () => {
    const byTick: Record<number, Record<string, TestCell>> = {};
    injectMaidenPhaseSpawnAttacks(byTick, [], [marker({})], () => ({
      attackName: "x",
      attackImageUrl: "",
    }));
    injectMaidenPhaseSpawnAttacks(byTick, ["maiden:1"], [], () => ({
      attackName: "x",
      attackImageUrl: "",
    }));
    expect(byTick).toEqual({});
  });
});
