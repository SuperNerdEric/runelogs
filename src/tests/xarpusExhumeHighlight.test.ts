import { describe, expect, it } from "vitest";
import {
  injectXarpusExhumeAttacks,
  isXarpusExhumedGroundObjectId,
  XARPUS_EXHUMED_GROUND_OBJECT_ID,
} from "../utils/xarpusExhumeHighlight";

describe("injectXarpusExhumeAttacks", () => {
  it("injects Exhume cells for each spawn onto each Xarpus row", () => {
    const byTick: Record<
      number,
      Record<string, { attackName: string; animationId: number }>
    > = {};

    injectXarpusExhumeAttacks(
      byTick,
      ["xarpus:1"],
      [{ tick: 10 }, { tick: 14 }],
      () => ({ attackName: "Exhume", animationId: 0 }),
    );

    expect(byTick[10]?.["xarpus:1"]).toEqual({
      attackName: "Exhume",
      animationId: 0,
    });
    expect(byTick[14]?.["xarpus:1"]).toEqual({
      attackName: "Exhume",
      animationId: 0,
    });
  });

  it("does not overwrite an existing cell", () => {
    const byTick: Record<
      number,
      Record<string, { attackName: string; animationId: number }>
    > = {
      10: { "xarpus:1": { attackName: "Spit", animationId: 8059 } },
    };

    injectXarpusExhumeAttacks(byTick, ["xarpus:1"], [{ tick: 10 }], () => ({
      attackName: "Exhume",
      animationId: 0,
    }));

    expect(byTick[10]?.["xarpus:1"]).toEqual({
      attackName: "Spit",
      animationId: 8059,
    });
  });

  it("no-ops without Xarpus rows or spawns", () => {
    const byTick: Record<
      number,
      Record<string, { attackName: string; animationId: number }>
    > = {};

    injectXarpusExhumeAttacks(byTick, [], [{ tick: 10 }], () => ({
      attackName: "Exhume",
      animationId: 0,
    }));
    injectXarpusExhumeAttacks(byTick, ["xarpus:1"], [], () => ({
      attackName: "Exhume",
      animationId: 0,
    }));

    expect(Object.keys(byTick)).toHaveLength(0);
  });
});

describe("isXarpusExhumedGroundObjectId", () => {
  it("matches the exhume ground object id", () => {
    expect(isXarpusExhumedGroundObjectId(XARPUS_EXHUMED_GROUND_OBJECT_ID)).toBe(
      true,
    );
    expect(isXarpusExhumedGroundObjectId(32744)).toBe(false);
  });
});
