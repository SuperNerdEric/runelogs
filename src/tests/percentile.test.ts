import { describe, expect, it } from "vitest";
import {
  formatParsePercentileDisplay,
  getPercentileAccentColor,
  getPlayerDpsDisplayColor,
  rankToPercentile,
} from "../utils/percentile";
import { colors } from "../theme";

describe("rankToPercentile", () => {
  it("returns 100 for rank 1 on a multi-entry board", () => {
    expect(rankToPercentile(1, 100)).toBe(100);
  });

  it("returns 0 for last place", () => {
    expect(rankToPercentile(100, 100)).toBe(0);
  });

  it("returns 100 when the board has one entry", () => {
    expect(rankToPercentile(1, 1)).toBe(100);
  });
});

describe("getPercentileAccentColor", () => {
  it("uses the default color when percentile is missing", () => {
    expect(getPercentileAccentColor(undefined)).toBe(colors.percentile.default);
  });

  it("uses the top-tier color for a perfect percentile", () => {
    expect(getPercentileAccentColor(100)).toBe(colors.percentile.p100);
  });
});

describe("getPlayerDpsDisplayColor", () => {
  it("uses the unknown color for unidentified players", () => {
    expect(getPlayerDpsDisplayColor("Unknown")).toEqual({
      color: colors.text.unknown,
      useDpsTextClass: false,
    });
  });

  it("uses percentile color when ranked", () => {
    const result = getPlayerDpsDisplayColor("player1", 99);
    expect(result.useDpsTextClass).toBe(false);
    expect(result.color).toBe(colors.percentile.p99);
  });

  it("falls back to dps text class when unranked", () => {
    expect(getPlayerDpsDisplayColor("player1")).toEqual({
      color: colors.text.dps,
      useDpsTextClass: true,
    });
  });
});

describe("formatParsePercentileDisplay", () => {
  it("shows a dash for unknown players", () => {
    expect(formatParsePercentileDisplay("Unknown", 95)).toBe("-");
  });

  it("shows a dash when percentile is missing", () => {
    expect(formatParsePercentileDisplay("player1")).toBe("-");
  });

  it("shows the percentile value for ranked players", () => {
    expect(formatParsePercentileDisplay("player1", 95)).toBe("95");
  });
});
