import { describe, expect, it } from "vitest";
import { Fight } from "../models/Fight";
import { LogLine, LogTypes } from "../models/LogLine";
import { deserializeActorFilter } from "../utils/actorFilter";
import { getAttackAnimationBreakdown } from "../utils/attackAnimationBreakdown";
import { getDeathEvents } from "../utils/deathEvents";
import { getBoostPotionsForRaid } from "../utils/boostPotions";
import { getEncounterRaidType } from "../utils/encounterRaidType";
import {
  buildAttackAnimationFilterSearch,
  buildAttackEventSearch,
  buildDamageDoneSourceSearch,
  buildDeathEventSearch,
} from "../utils/encounterSummaryLinks";
import { matchesEventTimeFilter } from "../utils/eventTimeFilter";
import { matchesAnimationIdFilter } from "../utils/animationIdFilter";
import {
  getSummaryDuration,
  hasSummaryDuration,
} from "../utils/summaryDuration";
import { isEncounterFightInProgress } from "../utils/fightDisplayStatus";

function makeFight(overrides: Partial<Fight> = {}): Fight {
  return {
    id: "fight-1",
    name: "Test Fight",
    mainEnemyName: "Test Boss",
    startTime: "2025-01-01T00:00:00.000Z",
    isNpc: true,
    isBoss: true,
    isWave: false,
    metaData: {
      name: "Test Fight",
      startTime: "2025-01-01T00:00:00.000Z",
      fightDurationTicks: 10,
      success: true,
    },
    data: [],
    enemyNames: ["Test Boss"],
    players: ["Player"],
    loggedInPlayer: "Player",
    logVersion: "1.3.6",
    firstLine: {
      type: LogTypes.DAMAGE,
      tick: 100,
      fightTimeMs: 0,
    } as Fight["firstLine"],
    lastLine: {
      type: LogTypes.DAMAGE,
      tick: 110,
      fightTimeMs: 6000,
    } as Fight["lastLine"],
    ...overrides,
  };
}

describe("getEncounterRaidType", () => {
  it("detects ToA fights", () => {
    const fight = makeFight({ enemyNames: ["Ba-Ba"] });
    expect(getEncounterRaidType(fight)).toBe("toa");
  });

  it("detects CoX fights", () => {
    const fight = makeFight({ enemyNames: ["Great Olm"] });
    expect(getEncounterRaidType(fight)).toBe("cox");
  });
});

describe("getBoostPotionsForRaid", () => {
  it("shows smelling salts in ToA", () => {
    const potions = getBoostPotionsForRaid("toa");
    expect(potions.map((potion) => potion.id)).toEqual([
      "smelling-salts",
      "saturated-heart",
    ]);
  });

  it("shows overload in CoX", () => {
    const potions = getBoostPotionsForRaid("cox");
    expect(potions.map((potion) => potion.id)).toEqual([
      "overload",
      "saturated-heart",
    ]);
  });
});

describe("getDeathEvents", () => {
  it("returns player deaths sorted by time", () => {
    const fight = makeFight({
      data: [
        {
          type: LogTypes.DEATH,
          fightTimeMs: 3000,
          target: { name: "Player", index: 1 },
        },
        {
          type: LogTypes.DEATH,
          fightTimeMs: 1000,
          target: { name: "Player", index: 1 },
        },
      ] as Fight["data"],
    });

    expect(getDeathEvents(fight).map((death) => death.fightTimeMs)).toEqual([
      1000, 3000,
    ]);
  });

  it("excludes npc deaths", () => {
    const fight = makeFight({
      data: [
        {
          type: LogTypes.DEATH,
          fightTimeMs: 1000,
          target: { name: "Player", index: 1 },
        },
        {
          type: LogTypes.DEATH,
          fightTimeMs: 2000,
          target: { name: "Test Boss", index: 2 },
        },
      ] as Fight["data"],
    });

    const deaths = getDeathEvents(fight);
    expect(deaths).toHaveLength(1);
    expect(deaths[0].target.name).toBe("Player");
  });
});

describe("getSummaryDuration", () => {
  it("formats fight duration from metadata", () => {
    const fight = makeFight({
      metaData: {
        name: "Test Fight",
        startTime: "2025-01-01T00:00:00.000Z",
        fightDurationTicks: 100,
        success: true,
      },
    });

    expect(getSummaryDuration(fight)).toBe("1:00");
  });
});

describe("hasSummaryDuration", () => {
  it("returns true when metadata has fight duration ticks", () => {
    const fight = makeFight({
      metaData: {
        name: "Test Fight",
        startTime: "2025-01-01T00:00:00.000Z",
        fightDurationTicks: 100,
        success: true,
      },
    });

    expect(hasSummaryDuration(fight)).toBe(true);
  });

  it("returns false when no duration is available", () => {
    const fight = makeFight({
      metaData: {
        name: "Test Fight",
        startTime: "2025-01-01T00:00:00.000Z",
        fightDurationTicks: 0,
        success: false,
      },
      firstLine: {
        type: LogTypes.DAMAGE,
        tick: 100,
        fightTimeMs: 0,
      } as Fight["firstLine"],
      lastLine: {
        type: LogTypes.DAMAGE,
        tick: 100,
        fightTimeMs: 0,
      } as Fight["lastLine"],
    });

    expect(hasSummaryDuration(fight)).toBe(false);
  });
});

describe("isEncounterFightInProgress", () => {
  it("is in progress while live data is still syncing and the fight has not finished", () => {
    expect(isEncounterFightInProgress(true, false)).toBe(true);
  });

  it("is not in progress after the fight completes", () => {
    expect(isEncounterFightInProgress(true, true)).toBe(false);
  });

  it("is not in progress when the log is no longer live", () => {
    expect(isEncounterFightInProgress(false, false)).toBe(false);
  });
});

describe("getAttackAnimationBreakdown", () => {
  it("counts attack animations per equipped weapon", () => {
    const fight = makeFight({
      data: [
        {
          type: LogTypes.PLAYER_EQUIPMENT,
          fightTimeMs: 0,
          source: { name: "Player", index: 1 },
          playerEquipment: ["24539"],
        },
        {
          type: LogTypes.PLAYER_ATTACK_ANIMATION,
          fightTimeMs: 600,
          source: { name: "Player", index: 1 },
          target: { name: "Verzik Vitur", id: 8370, index: 1 },
          animationId: 390,
        },
        {
          type: LogTypes.PLAYER_ATTACK_ANIMATION,
          fightTimeMs: 1200,
          source: { name: "Player", index: 1 },
          target: { name: "Verzik Vitur", id: 8370, index: 1 },
          animationId: 390,
        },
      ] as Fight["data"],
    });

    const breakdown = getAttackAnimationBreakdown(fight);
    expect(breakdown).toHaveLength(1);
    expect(breakdown[0].playerName).toBe("Player");
    expect(breakdown[0].totalAttacks).toBe(2);
    expect(breakdown[0].weapons[0].itemId).toBe(24539);
    expect(breakdown[0].weapons[0].count).toBe(2);
    expect(breakdown[0].weapons[0].percent).toBe(100);
    expect(breakdown[0].events).toHaveLength(2);
    expect(breakdown[0].events.map((event) => event.fightTimeMs)).toEqual([
      600, 1200,
    ]);
    expect(breakdown[0].events[0].animationId).toBe(390);
  });
});

describe("matchesAnimationIdFilter", () => {
  it("matches attack animation logs by id", () => {
    const log = {
      type: LogTypes.PLAYER_ATTACK_ANIMATION,
      animationId: 390,
    } as LogLine;
    expect(matchesAnimationIdFilter(log, 390)).toBe(true);
    expect(matchesAnimationIdFilter(log, 422)).toBe(false);
    expect(matchesAnimationIdFilter(log, null)).toBe(true);
  });
});

describe("matchesEventTimeFilter", () => {
  it("matches exact fight times", () => {
    const log = {
      type: LogTypes.DEATH,
      fightTimeMs: 1500,
    } as LogLine;
    expect(matchesEventTimeFilter(log, 1500)).toBe(true);
    expect(matchesEventTimeFilter(log, 1200)).toBe(false);
    expect(matchesEventTimeFilter(log, null)).toBe(true);
  });
});

describe("encounter summary link search params", () => {
  it("builds Damage Done source filter links", () => {
    const searchParams = new URLSearchParams("tab=Summary");
    const filter = { name: "Alice", index: 2 };

    const search = buildDamageDoneSourceSearch(searchParams, filter);
    const params = new URLSearchParams(search);

    expect(params.get("tab")).toBe("Damage Done");
    expect(deserializeActorFilter(params.get("source"))).toEqual({
      name: "Alice",
      index: 2,
    });
  });

  it("builds death event links", () => {
    const searchParams = new URLSearchParams("tab=Summary");
    const death = {
      target: { name: "Player", index: 1 },
      fightTimeMs: 1500,
    };

    const search = buildDeathEventSearch(searchParams, death);
    const params = new URLSearchParams(search);

    expect(params.get("tab")).toBe("Events");
    expect(params.get("eventType")).toBe(LogTypes.DEATH);
    expect(deserializeActorFilter(params.get("target"))).toEqual({
      name: "Player",
      index: 1,
    });
    expect(params.get("eventTime")).toBe("1500");
  });

  it("builds attack event links", () => {
    const searchParams = new URLSearchParams(
      "tab=Summary&animationId=390&target=The+Maiden+of+Sugadinti|8363|",
    );
    const event = {
      source: { name: "Player", index: 1 },
      playerName: "Player",
      animationId: 390,
      fightTimeMs: 1200,
      weaponItemId: 24539,
      weaponName: "Osmumten's fang",
      target: { name: "The Maiden of Sugadinti", id: 8363, index: 2 },
      targetName: "The Maiden of Sugadinti",
      boostedLevels: undefined,
      isSpecialAttack: false,
    };

    const search = buildAttackEventSearch(searchParams, event);
    const params = new URLSearchParams(search);

    expect(params.get("tab")).toBe("Events");
    expect(params.get("eventType")).toBe(LogTypes.PLAYER_ATTACK_ANIMATION);
    expect(deserializeActorFilter(params.get("source"))).toEqual({
      name: "Player",
      index: 1,
    });
    expect(deserializeActorFilter(params.get("target"))).toEqual({
      name: "The Maiden of Sugadinti",
      id: 8363,
      index: 2,
    });
    expect(params.get("eventTime")).toBe("1200");
    expect(params.has("animationId")).toBe(false);
  });

  it("builds attack animation filter links", () => {
    const searchParams = new URLSearchParams("tab=Summary&eventTime=1200");
    const event = {
      source: { name: "Player", index: 1 },
      playerName: "Player",
      animationId: 390,
      fightTimeMs: 1200,
      weaponItemId: 24539,
      weaponName: "Osmumten's fang",
      target: { name: "The Maiden of Sugadinti", id: 8363 },
      targetName: "The Maiden of Sugadinti",
      boostedLevels: undefined,
      isSpecialAttack: false,
    };

    const search = buildAttackAnimationFilterSearch(searchParams, event);
    const params = new URLSearchParams(search);

    expect(params.get("tab")).toBe("Events");
    expect(params.get("eventType")).toBe(LogTypes.PLAYER_ATTACK_ANIMATION);
    expect(deserializeActorFilter(params.get("source"))).toEqual({
      name: "Player",
      index: 1,
    });
    expect(deserializeActorFilter(params.get("target"))).toEqual({
      name: "The Maiden of Sugadinti",
      id: 8363,
    });
    expect(params.get("animationId")).toBe("390");
    expect(params.has("eventTime")).toBe(false);
  });
});

describe("summary damage done player navigation", () => {
  it("uses Damage Done tab and source actor filter param", () => {
    const searchParams = new URLSearchParams("tab=Summary");
    const filter = { name: "Alice", index: 2 };

    const search = buildDamageDoneSourceSearch(searchParams, filter);
    const params = new URLSearchParams(search);

    expect(params.get("tab")).toBe("Damage Done");
    expect(deserializeActorFilter(params.get("source"))).toEqual({
      name: "Alice",
      index: 2,
    });
  });
});
