import { describe, expect, it } from "vitest";
import { synthesizeXarpusTurnAttacks } from "../utils/xarpusTurnHighlight";
import {
  getXarpusTurnTick,
  XARPUS_TICKS_PER_TURN_P3,
} from "../utils/xarpusTurnEvents";

describe("synthesizeXarpusTurnAttacks", () => {
  it("injects Turn cells every 8 ticks after Screech", () => {
    const screechTick = 100;
    const byTick: Record<
      number,
      Record<string, { attackName: string; animationId: number }>
    > = {};

    synthesizeXarpusTurnAttacks(
      byTick,
      [
        {
          npcKey: "xarpus:1",
          tick: screechTick,
          npcId: 8340,
          npcName: "Xarpus",
        },
      ],
      screechTick + XARPUS_TICKS_PER_TURN_P3 * 3,
      () => ({ attackName: "Turn", animationId: 0 }),
    );

    expect(byTick[getXarpusTurnTick(screechTick, 0)]?.["xarpus:1"]).toEqual({
      attackName: "Turn",
      animationId: 0,
    });
    expect(byTick[getXarpusTurnTick(screechTick, 1)]?.["xarpus:1"]).toEqual({
      attackName: "Turn",
      animationId: 0,
    });
    expect(byTick[getXarpusTurnTick(screechTick, 2)]?.["xarpus:1"]).toEqual({
      attackName: "Turn",
      animationId: 0,
    });
    expect(
      byTick[getXarpusTurnTick(screechTick, 3)]?.["xarpus:1"],
    ).toBeUndefined();
    expect(byTick[screechTick]).toBeUndefined();
  });

  it("skips hard-mode Xarpus", () => {
    const byTick: Record<
      number,
      Record<string, { attackName: string; animationId: number }>
    > = {};

    synthesizeXarpusTurnAttacks(
      byTick,
      [
        {
          npcKey: "xarpus:1",
          tick: 50,
          npcId: 10772,
          npcName: "Xarpus",
        },
      ],
      200,
      () => ({ attackName: "Turn", animationId: 0 }),
    );

    expect(Object.keys(byTick)).toHaveLength(0);
  });

  it("does not overwrite an existing cell", () => {
    const screechTick = 10;
    const turnTick = getXarpusTurnTick(screechTick, 0);
    const byTick: Record<
      number,
      Record<string, { attackName: string; animationId: number }>
    > = {
      [turnTick]: {
        "xarpus:1": { attackName: "Spit", animationId: 8059 },
      },
    };

    synthesizeXarpusTurnAttacks(
      byTick,
      [
        {
          npcKey: "xarpus:1",
          tick: screechTick,
          npcId: 8340,
          npcName: "Xarpus",
        },
      ],
      30,
      () => ({ attackName: "Turn", animationId: 0 }),
    );

    expect(byTick[turnTick]?.["xarpus:1"]).toEqual({
      attackName: "Spit",
      animationId: 8059,
    });
  });
});
