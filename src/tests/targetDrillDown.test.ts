import { describe, expect, it } from "vitest";
import { DamageLog, LogTypes } from "../models/LogLine";
import {
  canDrillDownTargetRow,
  formatTargetFilterLabel,
  getMonsterCanonicalName,
  getNextTargetFilter,
  matchesMonsterTargetFilter,
  resolveTargetDrillDownGrouping,
} from "../utils/targetDrillDown";

function damageLog(target: DamageLog["target"], damageAmount = 10): DamageLog {
  return {
    type: LogTypes.DAMAGE,
    date: "01-01-2024",
    time: "00:00:00.000",
    fightTimeMs: 0,
    timezone: "",
    source: { name: "Player1" },
    target,
    damageAmount,
    hitsplatName: "DAMAGE_ME",
  };
}

describe("targetDrillDown", () => {
  it("groups by monster name when only source is filtered", () => {
    expect(resolveTargetDrillDownGrouping(null)).toBe("monster-name");
  });

  it("groups by id when a filtered monster name has only one id", () => {
    expect(resolveTargetDrillDownGrouping({ name: "Nechryael" })).toBe(
      "monster-id",
    );
  });

  it("groups by id when a filtered monster name has multiple ids", () => {
    expect(resolveTargetDrillDownGrouping({ name: "Aberrant spectre" })).toBe(
      "monster-id",
    );
  });

  it("advances to id filter when clicking a monster name", () => {
    expect(
      getNextTargetFilter({ name: "Nechryael", id: 8 }, "monster-name"),
    ).toEqual({ name: "Nechryael" });
  });

  it("shows index grouping for a single index and allows clicking into it", () => {
    const logs = [damageLog({ name: "Nechryael", id: 8, index: 1 })];

    expect(resolveTargetDrillDownGrouping({ name: "Nechryael", id: 8 })).toBe(
      "monster-index",
    );
    expect(
      canDrillDownTargetRow(
        logs,
        { name: "Nechryael", id: 8 },
        { name: "Nechryael", id: 8, index: 1 },
        "monster-index",
      ),
    ).toBe(true);
    expect(
      resolveTargetDrillDownGrouping({
        name: "Nechryael",
        id: 8,
        index: 1,
      }),
    ).toBe("leaf");
  });

  it("matches targets by canonical monster name", () => {
    expect(
      matchesMonsterTargetFilter(
        { name: "Aberrant spectre", id: 2, index: 1 },
        { name: "Aberrant spectre" },
      ),
    ).toBe(true);
    expect(getMonsterCanonicalName({ name: "foo", id: 2, index: 1 })).toBe(
      "Aberrant spectre",
    );
  });

  it("formats target filter labels by drill-down level", () => {
    expect(formatTargetFilterLabel({ name: "Nechryael" })).toBe(
      "Target name: Nechryael",
    );
    expect(formatTargetFilterLabel({ name: "Nechryael", id: 8 })).toBe(
      "Target ID: 8",
    );
    expect(
      formatTargetFilterLabel({ name: "Nechryael", id: 8, index: 1 }),
    ).toBe("Target index: 1");
  });
});
