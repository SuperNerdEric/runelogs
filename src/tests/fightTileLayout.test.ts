import { describe, expect, it } from "vitest";
import {
  buildFightGridCompactContainerQueryCss,
  compactRowWidthPx,
  estimateTileMinWidthPx,
  fightCompactRowWidth,
  fightCompactRowWidthCss,
  fightTileMinTrackWidthCss,
  formatFightDurationLabel,
  getFightGroupFamilyName,
  longestLabelCh,
  MAIDEN_OF_SUGADINTI_LABEL,
  resolveFamilyTileLayouts,
  shouldStretchFightTiles,
  shouldUseCompactFightLayout,
} from "../utils/fightTileLayout";

describe("fightTileMinTrackWidthCss", () => {
  it("sizes tracks from theme variables and label length", () => {
    expect(fightTileMinTrackWidthCss(9)).toBe(
      "max(var(--fight-tile-min-base), calc(9 * 1ch + 2 * var(--fight-tile-padding-x)))",
    );
  });
});

describe("fightCompactRowWidthCss", () => {
  it("builds a calc expression from theme values", () => {
    expect(fightCompactRowWidthCss(6, 9)).toBe(
      "calc(6 * (max(10rem, calc(9 * 1ch + 2 * 0.625rem))) + 5 * 0.625rem + 2 * 0.9375rem)",
    );
  });

  it("uses a single track width for one tile", () => {
    expect(fightCompactRowWidthCss(1, 12)).toBe(
      "calc(max(10rem, calc(12 * 1ch + 2 * 0.625rem)) + 2 * 0.9375rem)",
    );
  });
});

describe("buildFightGridCompactContainerQueryCss", () => {
  it("generates a named container query with literal thresholds", () => {
    const css = buildFightGridCompactContainerQueryCss("fight-gridr1", 6, 9);
    expect(css).toContain("@container fight-gridr1 (min-width:");
    expect(css).toContain("repeat(6,");
    expect(css).not.toContain("var(--fight-compact-row-width)");
  });
});

describe("fightCompactRowWidth", () => {
  it("builds a resolved pixel width for the container query", () => {
    expect(fightCompactRowWidth(6, 9)).toBe(`${compactRowWidthPx(6, 9)}px`);
  });
});

describe("shouldUseCompactFightLayout", () => {
  const desktopContentWidth = 1378;

  it("uses compact layout for small groups that fit on one row", () => {
    expect(shouldUseCompactFightLayout(6, 9, desktopContentWidth)).toBe(true);
  });

  it("uses stretched layout for large groups", () => {
    expect(shouldUseCompactFightLayout(343, 11, desktopContentWidth)).toBe(
      false,
    );
  });

  it("uses stretched layout for Theatre of Blood at desktop width", () => {
    const labelCh = MAIDEN_OF_SUGADINTI_LABEL.length;
    expect(shouldUseCompactFightLayout(8, labelCh, desktopContentWidth)).toBe(
      false,
    );
    expect(estimateTileMinWidthPx(labelCh)).toBeGreaterThan(160);
  });
});

describe("formatFightDurationLabel", () => {
  it("keeps the fight name and duration in one label string", () => {
    const fightDurationTicks = 95000 / 600;
    expect(formatFightDurationLabel("1", fightDurationTicks)).toBe("1 (01:35)");
  });
});

describe("longestLabelCh", () => {
  it("returns the longest label length in characters", () => {
    expect(longestLabelCh(["1 (01:11)", "22 (00:50)"])).toBe(10);
    expect(
      longestLabelCh([MAIDEN_OF_SUGADINTI_LABEL, "Pestilent Bloat (01:34)"]),
    ).toBe(MAIDEN_OF_SUGADINTI_LABEL.length);
  });
});

describe("shouldStretchFightTiles", () => {
  const desktopContentWidth = 1378;

  it("keeps compact groups on one row when they fit at minimum width", () => {
    expect(shouldStretchFightTiles(6, 160, desktopContentWidth)).toBe(false);
    expect(shouldStretchFightTiles(3, 160, desktopContentWidth)).toBe(false);
  });

  it("stretches large groups that cannot fit on one row at minimum width", () => {
    expect(shouldStretchFightTiles(343, 160, desktopContentWidth)).toBe(true);
  });

  it("stretches Theatre of Blood groups at desktop width", () => {
    const maidenMinWidth = 290;
    expect(
      shouldStretchFightTiles(8, maidenMinWidth, desktopContentWidth),
    ).toBe(true);
  });

  it("stretches when the container becomes narrower than a single compact row", () => {
    expect(shouldStretchFightTiles(6, 160, 900)).toBe(true);
  });
});

describe("getFightGroupFamilyName", () => {
  it("strips numbered suffixes from fight group names", () => {
    expect(getFightGroupFamilyName("Theatre of Blood - 1")).toBe(
      "Theatre of Blood",
    );
    expect(getFightGroupFamilyName("Theatre of Blood - 2")).toBe(
      "Theatre of Blood",
    );
  });

  it("leaves names without numbered suffixes unchanged", () => {
    expect(getFightGroupFamilyName("Cerberus")).toBe("Cerberus");
    expect(getFightGroupFamilyName("Araxxor")).toBe("Araxxor");
  });
});

describe("fight selector mobile overflow", () => {
  it("uses boss labels longer than a phone-sized single-column grid track", () => {
    const labelCh = MAIDEN_OF_SUGADINTI_LABEL.length;
    // ~319px fight-list width leaves ~24ch for content at typical body font sizes.
    // Grid track mins use labelCh * 1ch, so Theatre of Blood tiles need min(100%, …) in CSS.
    const phoneColumnBudgetCh = 24;

    expect(labelCh).toBeGreaterThan(phoneColumnBudgetCh);
    expect(fightTileMinTrackWidthCss(labelCh)).toContain(`${labelCh} * 1ch`);
  });
});

describe("resolveFamilyTileLayouts", () => {
  const shortLabels = ["1 (01:11)", "2 (00:50)"];
  const longLabels = [
    MAIDEN_OF_SUGADINTI_LABEL,
    "Pestilent Bloat (01:34)",
    "Nylocas Vasilias (05:06)",
  ];

  it("uses the first successful fight group to size numbered families", () => {
    const layouts = resolveFamilyTileLayouts([
      {
        groupName: "Theatre of Blood - 1",
        success: false,
        labels: shortLabels,
      },
      { groupName: "Theatre of Blood - 2", success: true, labels: longLabels },
      {
        groupName: "Theatre of Blood - 3",
        success: false,
        labels: shortLabels,
      },
    ]);

    expect(layouts.get("Theatre of Blood")).toEqual({
      labelCh: longestLabelCh(longLabels),
    });
  });

  it("falls back to the first fight group when none succeeded", () => {
    const layouts = resolveFamilyTileLayouts([
      { groupName: "Theatre of Blood - 1", success: false, labels: longLabels },
      {
        groupName: "Theatre of Blood - 2",
        success: false,
        labels: shortLabels,
      },
    ]);

    expect(layouts.get("Theatre of Blood")).toEqual({
      labelCh: longestLabelCh(longLabels),
    });
  });

  it("shares the same label width across sibling fight groups in a family", () => {
    const layouts = resolveFamilyTileLayouts([
      { groupName: "Theatre of Blood - 1", success: true, labels: longLabels },
      {
        groupName: "Theatre of Blood - 2",
        success: false,
        labels: shortLabels,
      },
    ]);

    expect(layouts.get("Theatre of Blood")?.labelCh).toBe(
      longestLabelCh(longLabels),
    );
  });
});
