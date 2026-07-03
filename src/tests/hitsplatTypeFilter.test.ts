import { describe, expect, it } from "vitest";
import { LogTypes } from "../models/LogLine";
import {
  deserializeHitsplatTypeFilter,
  formatHitsplatTypeFilterLabel,
  getDistinctHitsplatTypes,
  matchesHitsplatTypeFilter,
  serializeHitsplatTypeFilter,
} from "../utils/hitsplatTypeFilter";

describe("hitsplatTypeFilter", () => {
  it("serializes and deserializes hitsplat type filters", () => {
    const filter = { type: "DAMAGE_ME" };
    expect(serializeHitsplatTypeFilter(filter)).toBe("DAMAGE_ME");
    expect(deserializeHitsplatTypeFilter("DAMAGE_ME")).toEqual(filter);
  });

  it("matches damage and heal logs by hitsplat type", () => {
    const filter = { type: "DAMAGE_ME" };

    expect(
      matchesHitsplatTypeFilter(
        {
          type: LogTypes.DAMAGE,
          hitsplatName: "DAMAGE_ME",
        } as never,
        filter,
      ),
    ).toBe(true);
    expect(
      matchesHitsplatTypeFilter(
        {
          type: LogTypes.DAMAGE,
          hitsplatName: "DAMAGE_OTHER",
        } as never,
        filter,
      ),
    ).toBe(false);
    expect(
      matchesHitsplatTypeFilter(
        {
          type: LogTypes.PRAYER,
          prayers: ["1"],
        } as never,
        filter,
      ),
    ).toBe(false);
  });

  it("collects distinct hitsplat types from damage and heal logs", () => {
    const types = getDistinctHitsplatTypes([
      { type: LogTypes.DAMAGE, hitsplatName: "DAMAGE_OTHER" } as never,
      { type: LogTypes.DAMAGE, hitsplatName: "DAMAGE_ME" } as never,
      { type: LogTypes.HEAL, hitsplatName: "HEAL" } as never,
      { type: LogTypes.DAMAGE, hitsplatName: "DAMAGE_ME" } as never,
    ]);

    expect(types).toEqual(["DAMAGE_ME", "DAMAGE_OTHER", "HEAL"]);
    expect(formatHitsplatTypeFilterLabel({ type: "DAMAGE_ME" })).toBe(
      "Hitsplat type: DAMAGE_ME",
    );
  });
});
