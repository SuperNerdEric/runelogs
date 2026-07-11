import { formatHHmmss } from "./utils";
import { fightTileCssValues } from "../theme/cssVariables";

const FIGHT_GROUP_NUMBER_SUFFIX = /\s+-\s+\d+$/;
const LABEL_CH_WIDTH_PX = 8;

export const FIGHT_TILE_MIN_PX = 160;
export const FIGHT_TILE_MAX_PX = 480;
export const FIGHT_TILE_GAP_PX = 10;
export const FIGHT_TILE_BODY_PADDING_PX = 20;

export const MAIDEN_OF_SUGADINTI_LABEL = "The Maiden of Sugadinti (02:32)";

export function formatFightDurationLabel(
  name: string,
  fightDurationTicks: number,
): string {
  const formattedDuration = formatHHmmss(fightDurationTicks * 600, false);
  return `${name} (${formattedDuration})`;
}

export function longestLabelCh(labels: string[]): number {
  if (labels.length === 0) {
    return 12;
  }

  return labels.reduce(
    (longest, label) => Math.max(longest, label.length),
    labels[0].length,
  );
}

export function estimateTileMinWidthPx(labelCh: number): number {
  const estimated = labelCh * LABEL_CH_WIDTH_PX + FIGHT_TILE_BODY_PADDING_PX;
  return Math.min(FIGHT_TILE_MAX_PX, Math.max(FIGHT_TILE_MIN_PX, estimated));
}

export function compactRowWidthPx(tileCount: number, labelCh: number): number {
  if (tileCount <= 0) {
    return 0;
  }

  const minTile = estimateTileMinWidthPx(labelCh);
  return tileCount * minTile + (tileCount - 1) * FIGHT_TILE_GAP_PX;
}

export function fightCompactRowWidth(
  tileCount: number,
  labelCh: number,
): string {
  return `${compactRowWidthPx(tileCount, labelCh)}px`;
}

export function fightTileMinTrackWidthCss(labelCh: number): string {
  return `max(var(--fight-tile-min-base), calc(${labelCh} * 1ch + 2 * var(--fight-tile-padding-x)))`;
}

function fightTileMinTrackWidthForContainerQuery(labelCh: number): string {
  const { minBase, paddingX } = fightTileCssValues;
  // Container-query conditions cannot resolve CSS variables, so thresholds use
  // the same rem values as fightTileCssValues while grid tracks keep var().
  return `max(${minBase}, calc(${labelCh} * 1ch + 2 * ${paddingX}))`;
}

export function fightCompactRowWidthCss(
  tileCount: number,
  labelCh: number,
): string {
  if (tileCount <= 0) {
    return "0px";
  }

  const trackMin = fightTileMinTrackWidthForContainerQuery(labelCh);
  const { gap, listPadding } = fightTileCssValues;
  // Container queries measure .fight-list-container; .fight-list padding
  // reduces the space available for tracks, so include both sides here.
  const listPaddingBothSides = `2 * ${listPadding}`;
  if (tileCount === 1) {
    return `calc(${trackMin} + ${listPaddingBothSides})`;
  }

  return `calc(${tileCount} * (${trackMin}) + ${tileCount - 1} * ${gap} + ${listPaddingBothSides})`;
}

export function buildFightGridCompactContainerQueryCss(
  containerName: string,
  tileCount: number,
  labelCh: number,
): string {
  const trackMin = fightTileMinTrackWidthCss(labelCh);
  const rowWidth = fightCompactRowWidthCss(tileCount, labelCh);

  return `@container ${containerName} (min-width: ${rowWidth}) {
  .fight-list-container--${containerName} .fight-list {
    grid-template-columns: repeat(${tileCount}, ${trackMin});
  }
}`;
}

/**
 * Mirrors the generated @container rule: compact when the container
 * is wide enough to fit every tile at minimum width on one row.
 */
export function shouldStretchFightTiles(
  tileCount: number,
  tileMinWidth: number,
  contentWidth: number,
  gap = FIGHT_TILE_GAP_PX,
): boolean {
  if (tileCount <= 0) {
    return false;
  }

  const rowWidthAtMin = tileCount * tileMinWidth + (tileCount - 1) * gap;
  return contentWidth < rowWidthAtMin;
}

export function shouldUseCompactFightLayout(
  tileCount: number,
  labelCh: number,
  contentWidth: number,
): boolean {
  return !shouldStretchFightTiles(
    tileCount,
    estimateTileMinWidthPx(labelCh),
    contentWidth,
  );
}

export function getFightGroupFamilyName(groupName: string): string {
  return groupName.replace(FIGHT_GROUP_NUMBER_SUFFIX, "");
}

export interface FightGroupTileInput {
  groupName: string;
  success?: boolean;
  labels: string[];
}

export interface FamilyTileLayout {
  labelCh: number;
}

export function resolveFamilyTileLayouts(
  groups: FightGroupTileInput[],
): Map<string, FamilyTileLayout> {
  const families = new Map<string, FightGroupTileInput[]>();

  for (const group of groups) {
    const family = getFightGroupFamilyName(group.groupName);
    const familyGroups = families.get(family) ?? [];
    familyGroups.push(group);
    families.set(family, familyGroups);
  }

  const result = new Map<string, FamilyTileLayout>();
  for (const [family, entries] of families) {
    const reference = entries.find((entry) => entry.success) ?? entries[0];
    result.set(family, {
      labelCh: longestLabelCh(reference.labels),
    });
  }
  return result;
}
