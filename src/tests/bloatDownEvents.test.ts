import { describe, expect, it } from "vitest";
import {
  BLOAT_STOMP_COUNTDOWN_TICK,
  BLOAT_STOMP_OFFSET_TICKS,
  getBloatDownEndFightTimeMsFromStomp,
  getBloatDownEvents,
  getBloatDownWindows,
  getBloatStompFightTimeMs,
} from "../utils/bloatDownEvents";
import { Fight } from "../models/Fight";
import { LogTypes } from "../models/LogLine";
import { NPC_ATTACK_ANIMATION_VERSION_1_6_9 } from "../utils/trackedNpcAttackNpcs";
import { buildBloatDownEventSearch } from "../utils/encounterSummaryLinks";
import { deserializeActorFilter } from "../utils/actorFilter";
import { deserializeAnimationIdFilter } from "../utils/animationIdFilter";

function makeFight(overrides: Partial<Fight> = {}): Fight {
  return {
    id: "fight-1",
    name: "Pestilent Bloat",
    mainEnemyName: "Pestilent Bloat",
    startTime: "2026-01-01T00:00:00Z",
    isNpc: true,
    isBoss: true,
    isWave: false,
    metaData: {
      name: "Pestilent Bloat",
      startTime: "2026-01-01T00:00:00Z",
      fightDurationTicks: 100,
      success: true,
    },
    data: [],
    enemyNames: ["Pestilent Bloat"],
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
        name: "Pestilent Bloat",
        id: 8359,
        index: 1,
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
      tick: 100,
      source: { name: "Player", isPlayer: true },
      target: {
        name: "Pestilent Bloat",
        id: 8359,
        index: 1,
        isPlayer: false,
      },
      hitsplatName: "DAMAGE_ME",
      damageAmount: 1,
    },
    ...overrides,
  };
}

describe("getBloatDownEvents", () => {
  it("collects numbered Downs and synthesizes Stomp when the fight continues", () => {
    const firstStompMs = getBloatStompFightTimeMs(6000);
    const fight = makeFight({
      lastLine: {
        type: LogTypes.DAMAGE,
        date: "01-01-2026",
        time: "00:01:00",
        timezone: "Z+0000",
        tick: 100,
        fightTimeMs: 60000,
        source: { name: "Player", isPlayer: true },
        target: {
          name: "Pestilent Bloat",
          id: 8359,
          index: 1,
          isPlayer: false,
        },
        hitsplatName: "DAMAGE_ME",
        damageAmount: 1,
      },
      data: [
        {
          type: LogTypes.PLAYER_ATTACK_ANIMATION,
          date: "01-01-2026",
          time: "00:00:10",
          timezone: "Z+0000",
          tick: 10,
          fightTimeMs: 6000,
          animationId: 8082,
          source: {
            name: "Pestilent Bloat",
            id: 10812,
            index: 42,
            isPlayer: false,
          },
          target: { name: "", isPlayer: false },
        },
        {
          type: LogTypes.PLAYER_ATTACK_ANIMATION,
          date: "01-01-2026",
          time: "00:01:00",
          timezone: "Z+0000",
          tick: 90,
          fightTimeMs: 54000,
          animationId: 8082,
          source: {
            name: "Pestilent Bloat",
            id: 10812,
            index: 42,
            isPlayer: false,
          },
          target: { name: "", isPlayer: false },
        },
      ],
    });

    const downs = getBloatDownEvents(fight);
    expect(downs).toHaveLength(2);
    expect(downs[0].downNumber).toBe(1);
    expect(downs[0].fightTimeMs).toBe(6000);
    expect(downs[0].stompFightTimeMs).toBe(firstStompMs);
    expect(downs[1].downNumber).toBe(2);
    expect(downs[1].fightTimeMs).toBe(54000);
    // Second Stomp would be past fight end.
    expect(downs[1].stompFightTimeMs).toBeUndefined();

    const windows = getBloatDownWindows(fight);
    expect(windows).toEqual([
      {
        downNumber: 1,
        startFightTimeMs: 6000,
        stompFightTimeMs: firstStompMs,
        endFightTimeMs: getBloatDownEndFightTimeMsFromStomp(firstStompMs),
        endsWithStomp: true,
      },
      {
        downNumber: 2,
        startFightTimeMs: 54000,
        endFightTimeMs: 60000,
        endsWithStomp: false,
      },
    ]);
    expect(windows[0].endFightTimeMs - windows[0].stompFightTimeMs!).toBe(
      BLOAT_STOMP_COUNTDOWN_TICK * 600,
    );
  });

  it(`synthesizes Stomp at Down + ${BLOAT_STOMP_OFFSET_TICKS} ticks`, () => {
    const fight = makeFight({
      lastLine: {
        type: LogTypes.DAMAGE,
        date: "01-01-2026",
        time: "00:01:00",
        timezone: "Z+0000",
        tick: 200,
        fightTimeMs: 120000,
        source: { name: "Player", isPlayer: true },
        target: {
          name: "Pestilent Bloat",
          id: 8359,
          index: 1,
          isPlayer: false,
        },
        hitsplatName: "DAMAGE_ME",
        damageAmount: 1,
      },
      data: [
        {
          type: LogTypes.PLAYER_ATTACK_ANIMATION,
          date: "01-01-2026",
          time: "00:00:10",
          timezone: "Z+0000",
          tick: 10,
          fightTimeMs: 6000,
          animationId: 8082,
          source: {
            name: "Pestilent Bloat",
            id: 10812,
            index: 42,
            isPlayer: false,
          },
          target: { name: "", isPlayer: false },
        },
      ],
    });

    const downs = getBloatDownEvents(fight);
    expect(downs).toHaveLength(1);
    expect(downs[0].stompFightTimeMs).toBe(getBloatStompFightTimeMs(6000));

    const stompMs = getBloatStompFightTimeMs(6000);
    expect(getBloatDownWindows(fight)).toEqual([
      {
        downNumber: 1,
        startFightTimeMs: 6000,
        stompFightTimeMs: stompMs,
        endFightTimeMs: getBloatDownEndFightTimeMsFromStomp(stompMs),
        endsWithStomp: true,
      },
    ]);
  });
});

describe("buildBloatDownEventSearch", () => {
  it("links to the matching attack animation event", () => {
    const search = buildBloatDownEventSearch(
      new URLSearchParams("tab=Summary"),
      {
        source: {
          name: "Pestilent Bloat",
          id: 10812,
          index: 42,
          isPlayer: false,
        },
        fightTimeMs: 6000,
        animationId: 8082,
        downNumber: 1,
      },
    );
    const params = new URLSearchParams(search);
    expect(params.get("tab")).toBe("Events");
    expect(params.get("eventType")).toBe("Attack Animation");
    expect(deserializeAnimationIdFilter(params.get("animationId"))).toBe(8082);
    expect(deserializeActorFilter(params.get("source"))).toEqual({
      name: "Pestilent Bloat",
      id: 10812,
      index: 42,
    });
  });
});
