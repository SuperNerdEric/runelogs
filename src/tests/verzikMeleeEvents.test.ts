import { describe, expect, it } from "vitest";
import { Fight } from "../models/Fight";
import { LogTypes } from "../models/LogLine";
import { NPC_ATTACK_ANIMATION_VERSION_1_6_9 } from "../utils/trackedNpcAttackNpcs";
import { getEncounterFailureSeries } from "../utils/failureEvents";
import {
  getVerzikMeleeEvents,
  getVerzikMeleeFailureSeries,
  VERZIK_P3_MELEE_ANIMATION_ID,
} from "../utils/verzikMeleeEvents";
import { buildFailureEventSearch } from "../utils/encounterSummaryLinks";
import { deserializeActorFilter } from "../utils/actorFilter";
import { deserializeAnimationIdFilter } from "../utils/animationIdFilter";

function makeFight(overrides: Partial<Fight> = {}): Fight {
  return {
    id: "fight-1",
    name: "Verzik Vitur",
    mainEnemyName: "Verzik Vitur",
    startTime: "2026-01-01T00:00:00Z",
    isNpc: true,
    isBoss: true,
    isWave: false,
    metaData: {
      name: "Verzik Vitur",
      startTime: "2026-01-01T00:00:00Z",
      fightDurationTicks: 100,
      success: true,
    },
    data: [],
    enemyNames: ["Verzik Vitur"],
    loggedInPlayer: "Alice",
    players: ["Alice", "Bob"],
    logVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    firstLine: {
      type: LogTypes.DAMAGE,
      date: "01-01-2026",
      time: "00:00:00",
      timezone: "Z+0000",
      tick: 1,
      source: { name: "Alice", isPlayer: true },
      target: {
        name: "Verzik Vitur",
        id: 8374,
        index: 1,
        isPlayer: false,
      },
      hitsplatName: "DAMAGE_ME",
      damageAmount: 1,
    },
    lastLine: {
      type: LogTypes.DAMAGE,
      date: "01-01-2026",
      time: "00:01:00",
      timezone: "Z+0000",
      tick: 100,
      source: { name: "Alice", isPlayer: true },
      target: {
        name: "Verzik Vitur",
        id: 8374,
        index: 1,
        isPlayer: false,
      },
      hitsplatName: "DAMAGE_ME",
      damageAmount: 1,
    },
    ...overrides,
  };
}

describe("getVerzikMeleeEvents", () => {
  it("collects P3 melee animations with targets in fight-time order", () => {
    const fight = makeFight({
      data: [
        {
          type: LogTypes.PLAYER_ATTACK_ANIMATION,
          date: "01-01-2026",
          time: "00:00:10",
          timezone: "Z+0000",
          tick: 20,
          fightTimeMs: 12000,
          animationId: VERZIK_P3_MELEE_ANIMATION_ID,
          source: { name: "Verzik", id: 8374, index: 3, isPlayer: false },
          target: { name: "Bob", isPlayer: true },
        },
        {
          type: LogTypes.PLAYER_ATTACK_ANIMATION,
          date: "01-01-2026",
          time: "00:00:06",
          timezone: "Z+0000",
          tick: 10,
          fightTimeMs: 6000,
          animationId: VERZIK_P3_MELEE_ANIMATION_ID,
          source: { name: "Verzik", id: 8374, index: 3, isPlayer: false },
          target: { name: "Alice", isPlayer: true },
        },
        {
          type: LogTypes.PLAYER_ATTACK_ANIMATION,
          date: "01-01-2026",
          time: "00:00:08",
          timezone: "Z+0000",
          tick: 15,
          fightTimeMs: 9000,
          animationId: 8124,
          source: { name: "Verzik", id: 8374, index: 3, isPlayer: false },
          target: { name: "Alice", isPlayer: true },
        },
      ],
    });

    expect(getVerzikMeleeEvents(fight)).toEqual([
      expect.objectContaining({
        fightTimeMs: 6000,
        subjectLabel: "Alice",
      }),
      expect.objectContaining({
        fightTimeMs: 12000,
        subjectLabel: "Bob",
      }),
    ]);
  });

  it("includes legacy attack special MELEE lines", () => {
    const fight = makeFight({
      data: [
        {
          type: LogTypes.PLAYER_ATTACK_ANIMATION,
          date: "01-01-2026",
          time: "00:00:06",
          timezone: "Z+0000",
          tick: 10,
          fightTimeMs: 6000,
          animationId: 0,
          attackSpecial: "MELEE",
          source: { name: "Verzik", id: 8374, index: 3, isPlayer: false },
          target: { name: "Alice", isPlayer: true },
        },
      ],
    });

    expect(getVerzikMeleeEvents(fight)).toHaveLength(1);
    expect(getVerzikMeleeEvents(fight)[0].subjectLabel).toBe("Alice");
  });

  it("ignores non-Verzik sources", () => {
    const fight = makeFight({
      data: [
        {
          type: LogTypes.PLAYER_ATTACK_ANIMATION,
          date: "01-01-2026",
          time: "00:00:06",
          timezone: "Z+0000",
          tick: 10,
          fightTimeMs: 6000,
          animationId: VERZIK_P3_MELEE_ANIMATION_ID,
          source: {
            name: "Pestilent Bloat",
            id: 8359,
            index: 1,
            isPlayer: false,
          },
          target: { name: "Alice", isPlayer: true },
        },
      ],
    });

    expect(getVerzikMeleeEvents(fight)).toEqual([]);
  });
});

describe("getVerzikMeleeFailureSeries", () => {
  it("builds a Melees series with the melee icon", () => {
    const fight = makeFight({
      data: [
        {
          type: LogTypes.PLAYER_ATTACK_ANIMATION,
          date: "01-01-2026",
          time: "00:00:06",
          timezone: "Z+0000",
          tick: 10,
          fightTimeMs: 6000,
          animationId: VERZIK_P3_MELEE_ANIMATION_ID,
          source: { name: "Verzik", id: 8374, index: 3, isPlayer: false },
          target: { name: "Alice", isPlayer: true },
        },
      ],
    });

    const series = getVerzikMeleeFailureSeries(fight);
    expect(series).toMatchObject({
      id: "verzik-melee",
      singularLabel: "Melee",
      pluralLabel: "Melees",
    });
    expect(series?.iconUrl).toContain("verzik_p3_melee.png");
    expect(getEncounterFailureSeries(fight)).toHaveLength(1);
  });

  it("returns null when there are no melees", () => {
    expect(getVerzikMeleeFailureSeries(makeFight())).toBeNull();
    expect(getEncounterFailureSeries(makeFight())).toEqual([]);
  });
});

describe("buildFailureEventSearch", () => {
  it("deep-links to the Events tab for a Verzik melee", () => {
    const event = {
      fightTimeMs: 6000,
      subjectLabel: "Alice",
      source: { name: "Verzik", id: 8374, index: 3, isPlayer: false },
      target: { name: "Alice", isPlayer: true },
      animationId: VERZIK_P3_MELEE_ANIMATION_ID,
      eventType: LogTypes.PLAYER_ATTACK_ANIMATION,
    };
    const search = buildFailureEventSearch(new URLSearchParams(), event);
    const params = new URLSearchParams(search);

    expect(params.get("tab")).toBe("Events");
    expect(params.get("eventType")).toBe(LogTypes.PLAYER_ATTACK_ANIMATION);
    expect(deserializeActorFilter(params.get("target")!)).toEqual({
      name: "Alice",
    });
    expect(deserializeActorFilter(params.get("source")!).id).toBe(8374);
    expect(deserializeAnimationIdFilter(params.get("animationId")!)).toBe(
      VERZIK_P3_MELEE_ANIMATION_ID,
    );
  });
});
