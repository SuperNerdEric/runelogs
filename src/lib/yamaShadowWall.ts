/**
 * Yama shadow wall replay (gfx 3264/3265/3266).
 *
 * Combat logs record one spawn and despawn per tile. Purple crest and fading shadow
 * are not separate events; we synthesize them from spotanim timing.
 *
 * Wave cadence: a new diagonal front every 15 client cycles (half a game tick), so
 * two fronts land per 30-cycle tick. Each tile lives ~28 cycles in logs; we model
 * 15 cycles active (purple line) then 15 cycles fade (black shadow). With 28-cycle
 * lifetimes and 15-cycle spacing, ~two diagonal rows overlap at steady state.
 *
 * Gfx id selects orientation: 3264/3266 are ne-sw, 3265 is nw-se (different attack phases).
 */
import L from "leaflet";
import { GraphicsObjectState } from "../components/replay/GameState";
import { Position } from "../utils/Position";
import {
  getGraphicObjectAnimationCyclesElapsed,
  isGraphicObjectVisible,
} from "./replayTiming";
import shadowWallActive from "../assets/graphicObjects/yamaWall/shadow_wall_active.png";
import shadowWallActiveMirror from "../assets/graphicObjects/yamaWall/shadow_wall_active_mirror.png";
import shadowWallFade from "../assets/graphicObjects/yamaWall/shadow_wall_fade.png";
import shadowWallFadeMirror from "../assets/graphicObjects/yamaWall/shadow_wall_fade_mirror.png";

/** Custom-rendered Yama shadow wall spotanim IDs. */
export const YAMA_SHADOW_WALL_IDS = new Set([3264, 3265, 3266]);

/** Active purple crest for the first half-tick. */
export const YAMA_SHADOW_WALL_ACTIVE_CYCLES = 15;

/** Full visible lifetime: active crest then fading shadow. */
export const YAMA_SHADOW_WALL_TOTAL_CYCLES = 30;

/** Extend each tile overlay along its diagonal into neighbours (fraction of a tile). */
export const YAMA_WALL_TILE_OVERFLOW = 0.22;

export type YamaWallDiagonal = "ne-sw" | "nw-se";
export type YamaWallPhase = "active" | "fade";

/** Gfx id encodes wall orientation in the Yama arena. */
const YAMA_WALL_DIAGONAL_BY_GFX_ID: Record<number, YamaWallDiagonal> = {
  3264: "ne-sw",
  3265: "nw-se",
  3266: "ne-sw",
};

export function isYamaShadowWallGraphic(id: number): boolean {
  return YAMA_SHADOW_WALL_IDS.has(id);
}

export function getYamaWallDiagonal(gfxId: number): YamaWallDiagonal {
  return YAMA_WALL_DIAGONAL_BY_GFX_ID[gfxId] ?? "ne-sw";
}

export function getYamaShadowWallPhase(
  cyclesElapsed: number,
): YamaWallPhase | null {
  if (cyclesElapsed < 0 || cyclesElapsed >= YAMA_SHADOW_WALL_TOTAL_CYCLES) {
    return null;
  }
  return cyclesElapsed < YAMA_SHADOW_WALL_ACTIVE_CYCLES ? "active" : "fade";
}

/** Opacity ramps from 1 to 0 across the fade half-tick. */
export function getYamaShadowWallFadeOpacity(cyclesElapsed: number): number {
  const fadeElapsed = cyclesElapsed - YAMA_SHADOW_WALL_ACTIVE_CYCLES;
  return Math.max(0, 1 - fadeElapsed / YAMA_SHADOW_WALL_ACTIVE_CYCLES);
}

export function isYamaShadowWallVisible(
  currentTimeSeconds: number,
  timing: { startCycle?: number; endCycle?: number; spawnTick: number },
  initialTick: number,
  fightEpochCycle: number | undefined,
): boolean {
  return isGraphicObjectVisible(
    currentTimeSeconds,
    timing,
    initialTick,
    fightEpochCycle,
    YAMA_SHADOW_WALL_TOTAL_CYCLES,
  );
}

export function getYamaShadowWallImageUrl(
  phase: YamaWallPhase,
  diagonal: YamaWallDiagonal,
): string {
  if (phase === "active") {
    return diagonal === "ne-sw" ? shadowWallActive : shadowWallActiveMirror;
  }
  return diagonal === "ne-sw" ? shadowWallFade : shadowWallFadeMirror;
}

/**
 * Tile bounds expanded along the wall diagonal so adjacent overlays overlap
 * and read as one continuous line.
 */
export function getYamaShadowWallTileBounds(
  map: L.Map,
  x: number,
  y: number,
  diagonal: YamaWallDiagonal,
  overflow: number = YAMA_WALL_TILE_OVERFLOW,
): L.LatLngBounds {
  let xMin = x;
  let yMin = y;
  let xMax = x + 1;
  let yMax = y + 1;

  if (diagonal === "ne-sw") {
    xMin -= overflow;
    yMin -= overflow;
    xMax += overflow;
    yMax += overflow;
  } else {
    xMin -= overflow;
    yMax += overflow;
    xMax += overflow;
    yMin -= overflow;
  }

  const southWest = Position.toLatLng(map, xMin, yMin);
  const northEast = Position.toLatLng(map, xMax, yMax);
  return L.latLngBounds(southWest, northEast);
}

export function getYamaShadowWallTileCyclesElapsed(
  currentTimeSeconds: number,
  tile: GraphicsObjectState,
  initialTick: number,
  fightEpochCycle: number | undefined,
): number {
  return getGraphicObjectAnimationCyclesElapsed(
    currentTimeSeconds,
    {
      startCycle: tile.startCycle,
      spawnTick: tile.spawnTick,
    },
    initialTick,
    fightEpochCycle,
  );
}
