import { describe, expect, it } from "vitest";
import { Levels } from "../models/Levels";
import {
  createBoostLevelResolver,
  getFightTimeMsForTick,
} from "../utils/replayTickTooltip";

describe("replayTickTooltip", () => {
  it("resolves boosted levels at or before a tick", () => {
    const boostedLevelsAtTick: Record<number, Record<string, Levels>> = {
      100: {
        Player: {
          attack: 118,
          strength: 118,
          defence: 99,
          ranged: 99,
          magic: 99,
          hitpoints: 99,
          prayer: 70,
        },
      },
      103: {
        Player: {
          attack: 118,
          strength: 118,
          defence: 99,
          ranged: 99,
          magic: 99,
          hitpoints: 95,
          prayer: 68,
        },
      },
    };

    const resolveLevels = createBoostLevelResolver(boostedLevelsAtTick);

    expect(resolveLevels(100, "Player")?.hitpoints).toBe(99);
    expect(resolveLevels(101, "Player")?.hitpoints).toBe(99);
    expect(resolveLevels(103, "Player")?.hitpoints).toBe(95);
    expect(resolveLevels(104, "Player")?.hitpoints).toBe(95);
  });

  it("derives fight time from tick offset", () => {
    expect(getFightTimeMsForTick(102, 100, 1500)).toBe(2700);
  });
});
