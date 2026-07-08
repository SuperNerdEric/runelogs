import { describe, expect, it } from "vitest";
import {
  BOOST_ATTACK_ICON_MIN_SPACING,
  BOOST_CHART_HORIZONTAL_MARGIN,
  getBoostChartScrollWidth,
  getBoostChartScrollbarMetrics,
  getMinPlotWidthForAttackSpacing,
  getScrollLeftForThumbDrag,
  getScrollLeftForTrackClick,
  hasBoostChartHorizontalOverflow,
} from "../utils/boostChartScroll";

describe("getMinPlotWidthForAttackSpacing", () => {
  it("requires wider plot area when attacks are close together", () => {
    const plotWidth = getMinPlotWidthForAttackSpacing(60_000, [0, 600, 1_200]);

    expect(plotWidth).toBe((BOOST_ATTACK_ICON_MIN_SPACING * 60_000) / 600);
  });
});

describe("getBoostChartScrollWidth", () => {
  it("returns null when attack markers are hidden", () => {
    expect(
      getBoostChartScrollWidth({
        fightDurationMs: 420_000,
        attackTimestamps: [0, 600, 1_200],
        showAttackAnimations: false,
        isMobile: false,
      }),
    ).toBeNull();
  });

  it("returns null when attacks are sparse enough to fit", () => {
    expect(
      getBoostChartScrollWidth({
        fightDurationMs: 90_000,
        attackTimestamps: [0, 30_000, 60_000],
        showAttackAnimations: true,
        isMobile: false,
      }),
    ).toBeNull();
  });

  it("returns a wider chart when attacks need more than icon spacing", () => {
    const width = getBoostChartScrollWidth({
      fightDurationMs: 60_000,
      attackTimestamps: [0, 600, 1_200],
      showAttackAnimations: true,
      isMobile: false,
    });

    expect(width).not.toBeNull();
    expect(width!).toBeGreaterThanOrEqual(
      (BOOST_ATTACK_ICON_MIN_SPACING * 60_000) / 600 +
        BOOST_CHART_HORIZONTAL_MARGIN,
    );
  });

  it("scrolls sooner on mobile when attacks are dense", () => {
    const width = getBoostChartScrollWidth({
      fightDurationMs: 45_000,
      attackTimestamps: [0, 600, 1_200, 1_800],
      showAttackAnimations: true,
      isMobile: true,
    });

    expect(width).not.toBeNull();
    expect(width!).toBeGreaterThanOrEqual(360);
  });
});

describe("hasBoostChartHorizontalOverflow", () => {
  it("returns false when content fits within the viewport", () => {
    expect(
      hasBoostChartHorizontalOverflow({
        clientWidth: 800,
        scrollWidth: 800,
      }),
    ).toBe(false);
  });

  it("returns true when content is wider than the viewport", () => {
    expect(
      hasBoostChartHorizontalOverflow({
        clientWidth: 400,
        scrollWidth: 800,
      }),
    ).toBe(true);
  });
});

describe("getBoostChartScrollbarMetrics", () => {
  it("maps scroll position to thumb position across the rail", () => {
    const start = getBoostChartScrollbarMetrics({
      clientWidth: 400,
      railWidth: 300,
      scrollLeft: 0,
      scrollWidth: 800,
    });
    const end = getBoostChartScrollbarMetrics({
      clientWidth: 400,
      railWidth: 300,
      scrollLeft: 400,
      scrollWidth: 800,
    });

    expect(start.thumbLeft).toBe(0);
    expect(end.thumbLeft).toBeGreaterThan(start.thumbLeft);
    expect(start.thumbWidth).toBe(150);
  });

  it("returns a disabled scrollbar when content fits", () => {
    expect(
      getBoostChartScrollbarMetrics({
        clientWidth: 800,
        railWidth: 300,
        scrollLeft: 0,
        scrollWidth: 800,
      }).canScroll,
    ).toBe(false);
  });
});

describe("getScrollLeftForTrackClick", () => {
  it("centers the thumb on the click position", () => {
    const scrollLeft = getScrollLeftForTrackClick({
      clickX: 150,
      clientWidth: 400,
      maxScrollLeft: 400,
      railWidth: 300,
      scrollWidth: 800,
    });

    expect(scrollLeft).toBeGreaterThan(0);
    expect(scrollLeft).toBeLessThan(400);
  });
});

describe("getScrollLeftForThumbDrag", () => {
  it("maps thumb drag distance to scroll delta", () => {
    const scrollLeft = getScrollLeftForThumbDrag({
      deltaX: 75,
      maxScrollLeft: 400,
      railWidth: 300,
      startScrollLeft: 0,
      thumbWidth: 150,
    });

    expect(scrollLeft).toBe(200);
  });
});
