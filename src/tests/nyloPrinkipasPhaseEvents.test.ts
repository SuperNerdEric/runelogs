import { describe, expect, it } from "vitest";
import {
  getNyloPrinkipasPhaseMarkers,
  NYLO_PRINKIPAS_MIN_SESSION_SIZE,
  NYLO_PRINKIPAS_SESSION_GAP_TICKS,
} from "../utils/nyloPrinkipasPhaseEvents";
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
      fightDurationTicks: 400,
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
      time: "00:04:00",
      timezone: "Z+0000",
      tick: 400,
      fightTimeMs: 240000,
      source: { name: "Player", isPlayer: true },
      target: { name: "Nylocas Vasilias", id: 8355, index: 5 },
      hitsplatName: "DAMAGE_ME",
      damageAmount: 1,
    },
    ...overrides,
  };
}

/** A Prinkipas POSITION log on a given tick / style id / scene index. */
function prinkipasPosition(tick: number, id = 10803, index = 44785): LogLine {
  return {
    type: LogTypes.POSITION,
    date: "01-01-2026",
    time: "00:00:00",
    timezone: "Z+0000",
    tick,
    fightTimeMs: tick * TICK_MS,
    source: { name: "Unknown", isPlayer: false },
    target: { name: "Nylocas Prinkipas", id, index },
    hitsplatName: "POSITION",
    damageAmount: null,
  } as unknown as LogLine;
}

/**
 * One Prinkipas spawn: continuous per-tick sightings for `life` ticks starting
 * at `spawnTick`. Morphs style id (and gets a fresh index) partway through, as
 * real logs do, to prove the session stays a single marker.
 */
function prinkipasSpawn(
  spawnTick: number,
  baseIndex: number,
  life = 16,
): LogLine[] {
  return Array.from({ length: life }, (_, i) => {
    const morphed = i >= life / 2;
    return prinkipasPosition(
      spawnTick + i,
      morphed ? 10804 : 10803,
      morphed ? baseIndex + 24 : baseIndex,
    );
  });
}

describe("getNyloPrinkipasPhaseMarkers", () => {
  it("labels each of the three spawns 'Prinkipas Spawn' in order", () => {
    const fight = makeFight([
      ...prinkipasSpawn(100, 44785),
      ...prinkipasSpawn(200, 46900),
      ...prinkipasSpawn(300, 49000),
    ]);

    const markers = getNyloPrinkipasPhaseMarkers(fight);
    expect(markers.map((m) => m.label)).toEqual([
      "Prinkipas Spawn",
      "Prinkipas Spawn",
      "Prinkipas Spawn",
    ]);
    expect(markers.map((m) => m.waveNumber)).toEqual([1, 2, 3]);
    expect(markers.map((m) => m.tick)).toEqual([100, 200, 300]);
  });

  it("keeps a single spawn as one marker despite style/index morphs", () => {
    const fight = makeFight(prinkipasSpawn(100, 44785, 16));
    const markers = getNyloPrinkipasPhaseMarkers(fight);
    expect(markers).toHaveLength(1);
    expect(markers[0].fightTimeMs).toBe(100 * TICK_MS);
    expect(markers[0].spawnCount).toBe(16);
  });

  it("splits spawns separated by more than the session gap", () => {
    const gap = NYLO_PRINKIPAS_SESSION_GAP_TICKS;
    const fight = makeFight([
      prinkipasPosition(100),
      prinkipasPosition(101),
      // Well beyond the session gap => a new spawn.
      prinkipasPosition(100 + gap + 5, 10803, 46900),
      prinkipasPosition(100 + gap + 6, 10803, 46900),
    ]);
    expect(getNyloPrinkipasPhaseMarkers(fight)).toHaveLength(2);
  });

  it("does not split a spawn when sightings stay within the session gap", () => {
    const gap = NYLO_PRINKIPAS_SESSION_GAP_TICKS;
    const fight = makeFight([
      prinkipasPosition(100),
      prinkipasPosition(100 + gap),
      prinkipasPosition(100 + gap * 2),
    ]);
    expect(getNyloPrinkipasPhaseMarkers(fight)).toHaveLength(1);
  });

  it("detects Prinkipas across styles and from different log types", () => {
    const fight = makeFight([
      {
        type: LogTypes.TARGET_CHANGE,
        date: "01-01-2026",
        time: "00:00:00",
        timezone: "Z+0000",
        tick: 150,
        fightTimeMs: 150 * TICK_MS,
        source: { name: "Nylocas Prinkipas", id: 10805, index: 50000 },
        target: { name: "Player", isPlayer: true },
      },
      {
        type: LogTypes.DAMAGE,
        date: "01-01-2026",
        time: "00:00:00",
        timezone: "Z+0000",
        tick: 151,
        fightTimeMs: 151 * TICK_MS,
        source: { name: "Player", isPlayer: true },
        target: { name: "Nylocas Prinkipas", id: 10806, index: 50000 },
        hitsplatName: "DAMAGE_OTHER",
        damageAmount: 30,
      },
    ]);

    const markers = getNyloPrinkipasPhaseMarkers(fight);
    expect(markers).toHaveLength(1);
    expect(markers[0].tick).toBe(150);
  });

  it("ignores a lone stray sighting below the minimum session size", () => {
    expect(NYLO_PRINKIPAS_MIN_SESSION_SIZE).toBeGreaterThan(1);
    const fight = makeFight([prinkipasPosition(100)]);
    expect(getNyloPrinkipasPhaseMarkers(fight)).toEqual([]);
  });

  it("returns no markers when no Prinkipas appears (regular/entry mode)", () => {
    const fight = makeFight([
      {
        type: LogTypes.DAMAGE,
        date: "01-01-2026",
        time: "00:00:00",
        timezone: "Z+0000",
        tick: 10,
        fightTimeMs: 6000,
        source: { name: "Player", isPlayer: true },
        target: { name: "Nylocas Vasilias", id: 8355, index: 5 },
        hitsplatName: "DAMAGE_ME",
        damageAmount: 5,
      },
    ]);
    expect(getNyloPrinkipasPhaseMarkers(fight)).toEqual([]);
  });
});
