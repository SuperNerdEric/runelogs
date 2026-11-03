import { describe, expect, it } from "vitest";
import { Fight } from "../models/Fight";
import { LogTypes } from "../models/LogLine";
import {
  countMechanicDamage,
  formatMechanicHitsplatsLabel,
  formatMechanicHitsplatsTooltip,
  showsMechanicHitsplats,
  withoutMechanicDamage,
} from "../utils/mechanicDamageFilter";
import { calculatePlayerDps } from "../utils/dpsCalculation";

const phaseSplat = {
  type: LogTypes.DAMAGE,
  source: { name: "Alice", isPlayer: true },
  target: { name: "Ocellus", id: 16675, index: 1, isPlayer: false },
  hitsplatName: "DAMAGE_MAX_ME_CYAN",
  damageAmount: 5250,
  isMechanicDamage: true,
};

const playerHit = {
  type: LogTypes.DAMAGE,
  source: { name: "Alice", isPlayer: true },
  target: { name: "Ocellus", id: 16675, index: 1, isPlayer: false },
  hitsplatName: "DAMAGE_ME",
  damageAmount: 60,
};

const makeFight = (data: unknown[]): Fight =>
  ({
    players: ["Alice"],
    metaData: { fightDurationTicks: 100 },
    data,
  }) as unknown as Fight;

describe("mechanicDamageFilter", () => {
  it("hides mechanic hitsplats unless the param is show", () => {
    expect(showsMechanicHitsplats(null)).toBe(false);
    expect(showsMechanicHitsplats("hide")).toBe(false);
    expect(showsMechanicHitsplats("show")).toBe(true);
  });

  it("removes only mechanic damage", () => {
    const fight = makeFight([phaseSplat, playerHit]);
    expect(countMechanicDamage(fight)).toBe(1);
    expect(withoutMechanicDamage(fight).data).toEqual([playerHit]);
  });

  it("returns the same fight when there is nothing to hide", () => {
    const fight = makeFight([playerHit]);
    expect(withoutMechanicDamage(fight)).toBe(fight);
  });

  it("labels the chip for each state", () => {
    expect(formatMechanicHitsplatsLabel(false)).toBe(
      "Hiding invalid hitsplats",
    );
    expect(formatMechanicHitsplatsLabel(true)).toBe("Hide invalid hitsplats");
  });

  it("puts the count at the end of the tooltip", () => {
    expect(formatMechanicHitsplatsTooltip(1)).toMatch(
      /This fight has 1 invalid hitsplat\.$/,
    );
    expect(formatMechanicHitsplatsTooltip(3)).toMatch(
      /This fight has 3 invalid hitsplats\.$/,
    );
  });

  it("never counts mechanic damage toward player DPS", () => {
    const [alice] = calculatePlayerDps(makeFight([phaseSplat, playerHit]));
    expect(alice.damageDealt).toBe(60);
  });
});
