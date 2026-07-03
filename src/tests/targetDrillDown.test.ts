import { describe, expect, it } from "vitest";
import { DamageLog, LogTypes } from "../models/LogLine";
import {
  canDrillDownTargetRow,
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
    const logs = [
      damageLog({ name: "Aberrant spectre", id: 2, index: 1 }),
      damageLog({ name: "Aberrant spectre", id: 3, index: 2 }),
      damageLog({ name: "Nechryael", id: 8, index: 1 }),
    ];

    expect(resolveTargetDrillDownGrouping(logs, null)).toBe("monster-name");
  });

  it("skips id grouping when a filtered monster name has only one id", () => {
    const logs = [
      damageLog({ name: "Nechryael", id: 8, index: 1 }),
      damageLog({ name: "Nechryael", id: 8, index: 2 }),
    ];

    expect(resolveTargetDrillDownGrouping(logs, { name: "Nechryael" })).toBe(
      "monster-index",
    );
  });

  it("groups by id when a filtered monster name has multiple ids", () => {
    const logs = [
      damageLog({ name: "Aberrant spectre", id: 2, index: 1 }),
      damageLog({ name: "Aberrant spectre", id: 3, index: 2 }),
    ];

    expect(
      resolveTargetDrillDownGrouping(logs, { name: "Aberrant spectre" }),
    ).toBe("monster-id");
  });

  it("advances to index filter when clicking a name with a single id", () => {
    const logs = [
      damageLog({ name: "Nechryael", id: 8, index: 1 }),
      damageLog({ name: "Nechryael", id: 8, index: 2 }),
    ];

    expect(
      getNextTargetFilter(logs, { name: "Nechryael", id: 8 }, "monster-name"),
    ).toEqual({ name: "Nechryael", id: 8 });
  });

  it("shows index grouping for a single index and allows clicking into it", () => {
    const logs = [damageLog({ name: "Nechryael", id: 8, index: 1 })];

    expect(
      resolveTargetDrillDownGrouping(logs, { name: "Nechryael", id: 8 }),
    ).toBe("monster-index");
    expect(
      canDrillDownTargetRow(
        logs,
        { name: "Nechryael", id: 8 },
        { name: "Nechryael", id: 8, index: 1 },
        "monster-index",
      ),
    ).toBe(true);
    expect(
      resolveTargetDrillDownGrouping(logs, {
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
});
