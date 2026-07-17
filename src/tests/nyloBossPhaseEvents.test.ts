import { describe, expect, it } from "vitest";
import {
  getNyloBossPhaseMarkers,
  injectNyloBossPhaseSpawnAttacks,
  NyloBossPhaseMarker,
} from "../utils/nyloBossPhaseEvents";
import { Fight } from "../models/Fight";
import { LogLine, LogTypes } from "../models/LogLine";

const TICK_MS = 600;

function makeFight(data: LogLine[], overrides: Partial<Fight> = {}): Fight {
  return {
    id: "fight-1",
    name: "Nylocas Vasilias",
    mainEnemyName: "Nylocas Vasilias",
    startTime: "2026-01-01T00:00:00Z",
    isNpc: true,
    isBoss: true,
    isWave: false,
    metaData: {
      name: "Nylocas Vasilias",
      startTime: "2026-01-01T00:00:00Z",
      fightDurationTicks: 200,
      success: true,
    },
    data,
    enemyNames: ["Nylocas Vasilias"],
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
      target: { name: "Nylocas Hagios", id: 8342, index: 1 },
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
      target: { name: "Nylocas Vasilias", id: 8355, index: 5 },
      hitsplatName: "DAMAGE_ME",
      damageAmount: 1,
    },
    ...overrides,
  };
}

/** A Nylo boss POSITION log for a given tick / style id. */
function bossPosition(tick: number, id = 8355, index = 5): LogLine {
  return {
    type: LogTypes.POSITION,
    date: "01-01-2026",
    time: "00:00:00",
    timezone: "Z+0000",
    tick,
    fightTimeMs: tick * TICK_MS,
    source: { name: "Nylocas Vasilias", id, index },
    position: { x: 3288, y: 4249, plane: 0 },
  };
}

/** A wave-add (Nylocas Hagios) POSITION log — must never trigger a marker. */
function addPosition(tick: number, index: number): LogLine {
  return {
    type: LogTypes.POSITION,
    date: "01-01-2026",
    time: "00:00:00",
    timezone: "Z+0000",
    tick,
    fightTimeMs: tick * TICK_MS,
    source: { name: "Nylocas Hagios", id: 8342, index },
    position: { x: 3288, y: 4249, plane: 0 },
  };
}

describe("getNyloBossPhaseMarkers", () => {
  it("marks the boss spawn at its earliest sighting", () => {
    const fight = makeFight([
      addPosition(10, 100),
      addPosition(20, 101),
      bossPosition(90),
      bossPosition(95, 8356),
    ]);

    expect(getNyloBossPhaseMarkers(fight)).toEqual([
      { label: "Boss Spawn", fightTimeMs: 90 * TICK_MS, tick: 90 },
    ]);
  });

  it("uses the earliest sighting even when logged out of order", () => {
    const fight = makeFight([
      bossPosition(95),
      bossPosition(90),
      bossPosition(92, 8357),
    ]);

    const markers = getNyloBossPhaseMarkers(fight);
    expect(markers).toHaveLength(1);
    expect(markers[0].fightTimeMs).toBe(90 * TICK_MS);
    expect(markers[0].tick).toBe(90);
  });

  it("detects the boss across modes and from different log types", () => {
    const fight = makeFight([
      {
        type: LogTypes.DAMAGE,
        date: "01-01-2026",
        time: "00:00:00",
        timezone: "Z+0000",
        tick: 88,
        fightTimeMs: 88 * TICK_MS,
        source: { name: "Player", isPlayer: true },
        target: { name: "Nylocas Vasilias", id: 10808, index: 7 }, // hard mode
        hitsplatName: "DAMAGE_OTHER",
        damageAmount: 15,
      },
    ]);

    expect(getNyloBossPhaseMarkers(fight)).toEqual([
      { label: "Boss Spawn", fightTimeMs: 88 * TICK_MS, tick: 88 },
    ]);
  });

  it("ignores wave adds and returns no marker when the boss never appears", () => {
    const fight = makeFight([
      addPosition(10, 100),
      addPosition(20, 101),
      addPosition(30, 102),
    ]);

    expect(getNyloBossPhaseMarkers(fight)).toEqual([]);
  });
});

interface TestCell {
  attackName: string;
  attackImageUrl: string;
}

function marker(
  overrides: Partial<NyloBossPhaseMarker> = {},
): NyloBossPhaseMarker {
  return {
    label: "Boss Spawn",
    fightTimeMs: 90 * TICK_MS,
    tick: 90,
    ...overrides,
  };
}

describe("injectNyloBossPhaseSpawnAttacks", () => {
  it("places a spawn cell on each Nylo boss row at the spawn tick", () => {
    const byTick: Record<number, Record<string, TestCell>> = {};
    injectNyloBossPhaseSpawnAttacks(
      byTick,
      ["nylocas-vasilias:5"],
      [marker({ tick: 90 })],
      (m) => ({ attackName: m.label, attackImageUrl: "boss.png" }),
    );

    expect(byTick[90]["nylocas-vasilias:5"].attackName).toBe("Boss Spawn");
  });

  it("does not overwrite a real boss attack already on that tick", () => {
    const byTick: Record<number, Record<string, TestCell>> = {
      90: {
        "nylocas-vasilias:5": { attackName: "Melee", attackImageUrl: "" },
      },
    };
    injectNyloBossPhaseSpawnAttacks(
      byTick,
      ["nylocas-vasilias:5"],
      [marker({ tick: 90 })],
      (m) => ({ attackName: m.label, attackImageUrl: "boss.png" }),
    );

    expect(byTick[90]["nylocas-vasilias:5"].attackName).toBe("Melee");
  });

  it("is a no-op without Nylo boss rows or markers", () => {
    const byTick: Record<number, Record<string, TestCell>> = {};
    injectNyloBossPhaseSpawnAttacks(byTick, [], [marker()], () => ({
      attackName: "x",
      attackImageUrl: "",
    }));
    injectNyloBossPhaseSpawnAttacks(byTick, ["nylocas-vasilias:5"], [], () => ({
      attackName: "x",
      attackImageUrl: "",
    }));
    expect(byTick).toEqual({});
  });
});
