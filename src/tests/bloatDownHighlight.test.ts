import { describe, expect, it } from "vitest";
import {
  buildBloatDownHighlightTicks,
  formatBloatDownContextLabel,
  synthesizeBloatStompAttacks,
} from "../utils/bloatDownHighlight";
import {
  BLOAT_DOWN_CYCLE_TICKS,
  BLOAT_STOMP_OFFSET_TICKS,
} from "../utils/bloatDownEvents";

describe("buildBloatDownHighlightTicks", () => {
  it("highlights Down through the full cycle end", () => {
    const downTick = 100;
    const endTick = downTick + BLOAT_DOWN_CYCLE_TICKS;
    const highlights = buildBloatDownHighlightTicks(
      {
        [downTick]: {
          "bloat:1": { attackName: "Down", animationId: 8082 },
        },
      },
      200,
    );

    expect(highlights[downTick]?.["bloat:1"]).toBe(1);
    expect(highlights[downTick + BLOAT_STOMP_OFFSET_TICKS]?.["bloat:1"]).toBe(
      1,
    );
    expect(highlights[endTick]?.["bloat:1"]).toBe(1);
    expect(highlights[endTick + 1]?.["bloat:1"]).toBeUndefined();
  });

  it("increments the cycle number across separate downs", () => {
    const highlights = buildBloatDownHighlightTicks(
      {
        10: { "bloat:7": { attackName: "Down", animationId: 8082 } },
        50: { "bloat:7": { attackName: "Down", animationId: 8082 } },
      },
      100,
    );

    expect(highlights[10]?.["bloat:7"]).toBe(1);
    expect(highlights[10 + BLOAT_DOWN_CYCLE_TICKS]?.["bloat:7"]).toBe(1);
    expect(highlights[50]?.["bloat:7"]).toBe(2);
    expect(highlights[50 + BLOAT_DOWN_CYCLE_TICKS]?.["bloat:7"]).toBe(2);
  });

  it("ignores non-bloat rows", () => {
    const highlights = buildBloatDownHighlightTicks(
      {
        10: {
          "maiden:1": { attackName: "Down", animationId: 8082 },
          "bloat:1": { attackName: "Down", animationId: 8082 },
        },
      },
      50,
    );

    expect(highlights[10]?.["maiden:1"]).toBeUndefined();
    expect(highlights[10]?.["bloat:1"]).toBe(1);
    expect(highlights[10 + BLOAT_DOWN_CYCLE_TICKS]?.["bloat:1"]).toBe(1);
  });

  it("extends through fight end when the cycle cannot complete", () => {
    const highlights = buildBloatDownHighlightTicks(
      {
        50: { "bloat:1": { attackName: "Down", animationId: 8082 } },
      },
      55,
    );
    expect(highlights[50]?.["bloat:1"]).toBe(1);
    expect(highlights[51]?.["bloat:1"]).toBe(1);
    expect(highlights[55]?.["bloat:1"]).toBe(1);
    expect(highlights[56]).toBeUndefined();
  });
});

describe("synthesizeBloatStompAttacks", () => {
  it("injects a Stomp cell at Down + offset", () => {
    const downTick = 100;
    const stompTick = downTick + BLOAT_STOMP_OFFSET_TICKS;
    const byTick: Record<
      number,
      Record<string, { attackName: string; animationId: number }>
    > = {
      [downTick]: { "bloat:1": { attackName: "Down", animationId: 8082 } },
    };

    synthesizeBloatStompAttacks(byTick, 200, () => ({
      attackName: "Stomp",
      animationId: 0,
    }));

    expect(byTick[stompTick]?.["bloat:1"]).toEqual({
      attackName: "Stomp",
      animationId: 0,
    });
    expect(byTick[downTick + BLOAT_DOWN_CYCLE_TICKS]).toBeUndefined();
  });
});

describe("formatBloatDownContextLabel", () => {
  it("labels Start and End from boundary flags", () => {
    expect(
      formatBloatDownContextLabel(1, {
        isDownAttack: true,
      }),
    ).toBe("Down 1 Start");
    expect(
      formatBloatDownContextLabel(2, {
        isWindowEnd: true,
      }),
    ).toBe("Down 2 End");
    expect(formatBloatDownContextLabel(1)).toBe("Down 1");
  });
});
