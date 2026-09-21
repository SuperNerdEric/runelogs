import { describe, expect, it } from "vitest";
import {
  formatCoxPoints,
  formatCoxRaidScale,
  hasCoxRaidData,
} from "../utils/coxExtraInfo";

describe("coxExtraInfo", () => {
  it("requires scale and both point totals", () => {
    expect(hasCoxRaidData(undefined)).toBe(false);
    expect(
      hasCoxRaidData({
        partySize: 2,
        teamPoints: 89074,
        playerPoints: 54911,
        playerName: "x1BaSSS",
      }),
    ).toBe(true);
  });

  it("formats raid scale and points", () => {
    expect(formatCoxRaidScale(2)).toBe("2");
    expect(formatCoxPoints(89074)).toBe((89074).toLocaleString());
  });
});
