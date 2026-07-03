import { describe, expect, it } from "vitest";
import { LogTypes } from "../models/LogLine";
import {
  deserializeHitsplatFilter,
  formatHitsplatFilterLabel,
  getDistinctHitsplatAmounts,
  matchesHitsplatFilter,
  serializeHitsplatFilter,
} from "../utils/hitsplatFilter";

describe("hitsplatFilter", () => {
  it("serializes and deserializes hitsplat amount filters", () => {
    const filter = { amount: 23 };
    expect(serializeHitsplatFilter(filter)).toBe("23");
    expect(deserializeHitsplatFilter("23")).toEqual(filter);
  });

  it("matches damage and heal logs by amount", () => {
    const filter = { amount: 23 };

    expect(
      matchesHitsplatFilter(
        {
          type: LogTypes.DAMAGE,
          damageAmount: 23,
        } as never,
        filter,
      ),
    ).toBe(true);
    expect(
      matchesHitsplatFilter(
        {
          type: LogTypes.DAMAGE,
          damageAmount: 0,
        } as never,
        filter,
      ),
    ).toBe(false);
    expect(
      matchesHitsplatFilter(
        {
          type: LogTypes.PRAYER,
          prayers: ["1"],
        } as never,
        filter,
      ),
    ).toBe(false);
  });

  it("collects distinct hitsplat amounts from damage and heal logs", () => {
    const amounts = getDistinctHitsplatAmounts([
      { type: LogTypes.DAMAGE, damageAmount: 23 } as never,
      { type: LogTypes.DAMAGE, damageAmount: 0 } as never,
      { type: LogTypes.HEAL, healAmount: 8 } as never,
      { type: LogTypes.DAMAGE, damageAmount: 23 } as never,
    ]);

    expect(amounts).toEqual([0, 8, 23]);
    expect(formatHitsplatFilterLabel({ amount: 23 })).toBe(
      "Hitsplat amount: 23",
    );
  });
});
