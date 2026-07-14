import {
  getPresentTrackedNpcAttackNpcs,
  getTrackedNpcAttackNpc,
  isNpcAttackTrackingSupported,
  NPC_ATTACK_ANIMATION_VERSION_1_6_9,
  npcAttackRowKey,
} from "../utils/trackedNpcAttackNpcs";
import { Fight } from "../models/Fight";
import { LogTypes } from "../models/LogLine";

function makeFight(overrides: Partial<Fight> = {}): Fight {
  return {
    id: "fight-1",
    name: "Test",
    mainEnemyName: "The Maiden of Sugadinti",
    startTime: "2026-01-01T00:00:00Z",
    isNpc: true,
    isBoss: true,
    isWave: false,
    metaData: {
      name: "Test",
      startTime: "2026-01-01T00:00:00Z",
      fightDurationTicks: 10,
      success: true,
    },
    data: [],
    enemyNames: ["The Maiden of Sugadinti"],
    loggedInPlayer: "Player",
    players: ["Player"],
    logVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    firstLine: {
      type: LogTypes.DAMAGE,
      date: "01-01-2026",
      time: "00:00:00",
      timezone: "Z+0000",
      tick: 1,
      source: { name: "Player", isPlayer: true },
      target: {
        name: "The Maiden of Sugadinti",
        id: 8360,
        index: 42,
        isPlayer: false,
      },
      hitsplatName: "DAMAGE_ME",
      damageAmount: 1,
    },
    lastLine: {
      type: LogTypes.DAMAGE,
      date: "01-01-2026",
      time: "00:00:00",
      timezone: "Z+0000",
      tick: 10,
      source: { name: "Player", isPlayer: true },
      target: {
        name: "The Maiden of Sugadinti",
        id: 8360,
        index: 42,
        isPlayer: false,
      },
      hitsplatName: "DAMAGE_ME",
      damageAmount: 1,
    },
    ...overrides,
  };
}

describe("trackedNpcAttackNpcs", () => {
  it("maps Inferno mager ids to Jal-Zek family", () => {
    expect(getTrackedNpcAttackNpc(7699)?.family).toBe("jal-zek");
    expect(getTrackedNpcAttackNpc(7703)?.family).toBe("jal-zek");
    expect(getTrackedNpcAttackNpc(7699)?.primaryId).toBe(7699);
    expect(getTrackedNpcAttackNpc(7699)?.shortName).toBe("Mager");
  });

  it("uses short names for tick-chart labels", () => {
    expect(getTrackedNpcAttackNpc(8360)?.shortName).toBe("Maiden");
    expect(getTrackedNpcAttackNpc(8355)?.shortName).toBe("Nylo Boss");
    expect(getTrackedNpcAttackNpc(12810)?.shortName).toBe("Jaguar");
    expect(getTrackedNpcAttackNpc(14707)?.shortName).toBe("Mokhaiotl");
  });

  it("gates tracking on combat logger version", () => {
    expect(isNpcAttackTrackingSupported("1.6.8")).toBe(false);
    expect(isNpcAttackTrackingSupported("1.6.9")).toBe(true);
    expect(isNpcAttackTrackingSupported("1.7.0")).toBe(true);
    expect(isNpcAttackTrackingSupported(undefined)).toBe(false);
  });

  it("includes tracked NPCs present in a supported fight", () => {
    const fight = makeFight({
      data: [
        {
          type: LogTypes.POSITION,
          date: "01-01-2026",
          time: "00:00:00",
          timezone: "Z+0000",
          tick: 1,
          source: {
            name: "The Maiden of Sugadinti",
            id: 8361,
            index: 42,
            isPlayer: false,
          },
          position: { x: 1, y: 2, plane: 0 },
        },
        {
          type: LogTypes.POSITION,
          date: "01-01-2026",
          time: "00:00:01",
          timezone: "Z+0000",
          tick: 2,
          source: {
            name: "Jal-Zek",
            id: 7699,
            index: 7,
            isPlayer: false,
          },
          position: { x: 3, y: 4, plane: 0 },
        },
      ],
    });

    const present = getPresentTrackedNpcAttackNpcs(fight);
    expect(present.map((npc) => npc.key).sort()).toEqual([
      npcAttackRowKey("jal-zek", 7),
      npcAttackRowKey("maiden", 42),
    ]);
    expect(present.find((npc) => npc.family === "maiden")?.name).toBe("Maiden");
    expect(present.find((npc) => npc.family === "jal-zek")?.name).toBe("Mager");
    expect(present.find((npc) => npc.family === "maiden")?.primaryId).toBe(
      8360,
    );
  });

  it("collapses Maiden phase ids onto one row key by index", () => {
    const fight = makeFight({
      data: [
        {
          type: LogTypes.POSITION,
          date: "01-01-2026",
          time: "00:00:00",
          timezone: "Z+0000",
          tick: 1,
          source: {
            name: "The Maiden of Sugadinti",
            id: 8360,
            index: 42,
            isPlayer: false,
          },
          position: { x: 1, y: 2, plane: 0 },
        },
        {
          type: LogTypes.POSITION,
          date: "01-01-2026",
          time: "00:00:01",
          timezone: "Z+0000",
          tick: 5,
          source: {
            name: "The Maiden of Sugadinti",
            id: 8363,
            index: 42,
            isPlayer: false,
          },
          position: { x: 1, y: 2, plane: 0 },
        },
      ],
    });

    const present = getPresentTrackedNpcAttackNpcs(fight);
    expect(present).toHaveLength(1);
    expect(present[0].key).toBe(npcAttackRowKey("maiden", 42));
  });

  it("hides tracked NPCs on older combat logger versions", () => {
    const fight = makeFight({
      logVersion: "1.6.8",
      data: [
        {
          type: LogTypes.POSITION,
          date: "01-01-2026",
          time: "00:00:00",
          timezone: "Z+0000",
          tick: 1,
          source: {
            name: "The Maiden of Sugadinti",
            id: 8360,
            index: 42,
            isPlayer: false,
          },
          position: { x: 1, y: 2, plane: 0 },
        },
      ],
    });

    expect(getPresentTrackedNpcAttackNpcs(fight)).toEqual([]);
  });
});
