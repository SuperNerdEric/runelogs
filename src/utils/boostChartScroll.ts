export const BOOST_ATTACK_ICON_SIZE = 20;
export const BOOST_ATTACK_ICON_MIN_GAP = 4;
export const BOOST_ATTACK_ICON_MIN_SPACING =
  BOOST_ATTACK_ICON_SIZE + BOOST_ATTACK_ICON_MIN_GAP;
export const BOOST_CHART_LEFT_MARGIN = 60;
export const BOOST_CHART_RIGHT_MARGIN = 20;
export const BOOST_CHART_HORIZONTAL_MARGIN =
  BOOST_CHART_LEFT_MARGIN + BOOST_CHART_RIGHT_MARGIN;
export const BOOST_CHART_SCROLL_TRACK_HEIGHT = 16;
export const BOOST_CHART_SCROLL_ARROW_WIDTH = 16;
export const BOOST_CHART_SCROLL_THUMB_MIN_WIDTH = 32;
export const BOOST_CHART_SCROLL_STEP = 80;

export interface BoostChartScrollbarMetrics {
  canScroll: boolean;
  maxScrollLeft: number;
  thumbLeft: number;
  thumbWidth: number;
}

export function hasBoostChartHorizontalOverflow({
  clientWidth,
  scrollWidth,
}: {
  clientWidth: number;
  scrollWidth: number;
}): boolean {
  return scrollWidth > clientWidth;
}

export function getBoostChartScrollbarMetrics({
  clientWidth,
  railWidth,
  scrollLeft,
  scrollWidth,
}: {
  clientWidth: number;
  railWidth: number;
  scrollLeft: number;
  scrollWidth: number;
}): BoostChartScrollbarMetrics {
  const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);
  const canScroll = maxScrollLeft > 0 && railWidth > 0;

  if (!canScroll) {
    return {
      canScroll: false,
      maxScrollLeft,
      thumbLeft: 0,
      thumbWidth: railWidth,
    };
  }

  const thumbWidth = Math.max(
    BOOST_CHART_SCROLL_THUMB_MIN_WIDTH,
    (clientWidth / scrollWidth) * railWidth,
  );
  const thumbMaxLeft = Math.max(0, railWidth - thumbWidth);
  const thumbLeft =
    maxScrollLeft > 0 ? (scrollLeft / maxScrollLeft) * thumbMaxLeft : 0;

  return {
    canScroll: true,
    maxScrollLeft,
    thumbLeft,
    thumbWidth,
  };
}

export function getScrollLeftForTrackClick({
  clickX,
  clientWidth,
  maxScrollLeft,
  railWidth,
  scrollWidth,
}: {
  clickX: number;
  clientWidth: number;
  maxScrollLeft: number;
  railWidth: number;
  scrollWidth: number;
}): number {
  const { thumbWidth } = getBoostChartScrollbarMetrics({
    clientWidth,
    railWidth,
    scrollLeft: 0,
    scrollWidth,
  });
  const thumbMaxLeft = Math.max(0, railWidth - thumbWidth);
  const targetThumbLeft = Math.max(
    0,
    Math.min(thumbMaxLeft, clickX - thumbWidth / 2),
  );

  if (thumbMaxLeft <= 0) {
    return 0;
  }

  return (targetThumbLeft / thumbMaxLeft) * maxScrollLeft;
}

export function getScrollLeftForThumbDrag({
  deltaX,
  maxScrollLeft,
  railWidth,
  startScrollLeft,
  thumbWidth,
}: {
  deltaX: number;
  maxScrollLeft: number;
  railWidth: number;
  startScrollLeft: number;
  thumbWidth: number;
}): number {
  const thumbMaxLeft = Math.max(0, railWidth - thumbWidth);

  if (thumbMaxLeft <= 0) {
    return startScrollLeft;
  }

  const scrollDelta = (deltaX / thumbMaxLeft) * maxScrollLeft;
  return Math.max(0, Math.min(maxScrollLeft, startScrollLeft + scrollDelta));
}

export interface BoostChartScrollOptions {
  fightDurationMs: number;
  attackTimestamps: number[];
  showAttackAnimations: boolean;
  isMobile: boolean;
}

export function getMinPlotWidthForAttackSpacing(
  fightDurationMs: number,
  attackTimestamps: number[],
): number {
  if (fightDurationMs <= 0 || attackTimestamps.length < 2) {
    return 0;
  }

  const sorted = [...attackTimestamps].sort((a, b) => a - b);
  let minPlotWidth = 0;

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const deltaMs = sorted[index + 1] - sorted[index];
    if (deltaMs <= 0) {
      continue;
    }

    minPlotWidth = Math.max(
      minPlotWidth,
      (BOOST_ATTACK_ICON_MIN_SPACING * fightDurationMs) / deltaMs,
    );
  }

  return minPlotWidth;
}

export function getBoostChartScrollWidth({
  fightDurationMs,
  attackTimestamps,
  showAttackAnimations,
  isMobile,
}: BoostChartScrollOptions): number | null {
  if (!showAttackAnimations || fightDurationMs <= 0) {
    return null;
  }

  const baseMinWidth = isMobile ? 360 : 520;
  const minPlotWidth = getMinPlotWidthForAttackSpacing(
    fightDurationMs,
    attackTimestamps,
  );

  if (minPlotWidth <= 0) {
    return null;
  }

  const desiredWidth = Math.ceil(minPlotWidth + BOOST_CHART_HORIZONTAL_MARGIN);

  if (desiredWidth <= baseMinWidth) {
    return null;
  }

  return desiredWidth;
}
