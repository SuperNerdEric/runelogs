import { GraphicsObjectState } from "../components/replay/GameState";

/** Colosseum Sol arena bounds (same as in-game laser prism beams). */
export const SOL_ARENA_MIN_X = 1818;
export const SOL_ARENA_MIN_Y = 3100;
export const SOL_ARENA_MAX_X = 1831;
export const SOL_ARENA_MAX_Y = 3113;

export const SOL_LASER_SCAN_IDS = new Set([2689, 2690, 2691]);
export const SOL_LASER_SHOT_IDS = new Set([2693, 2694, 2695]);
export const SOL_LASER_ALL_IDS = new Set([
  ...SOL_LASER_SCAN_IDS,
  ...SOL_LASER_SHOT_IDS,
]);

const HORIZONTAL_SEGMENT_IDS = new Set([2689, 2693]);
const VERTICAL_SEGMENT_IDS = new Set([2690, 2694]);
const PRISM_IDS = new Set([2691, 2695]);

export type SolLaserPhase = "scan" | "shot";
export type SolLaserOrientation = "horizontal" | "vertical";

export interface SolLaserBeam {
  spawnTick: number;
  phase: SolLaserPhase;
  orientation: SolLaserOrientation;
  fixedCoord: number;
  startVar: number;
  endVar: number;
  plane: number;
  /** Spotanim ID used for stretched beam texture. */
  textureId: number;
}

export function isSolLaserGraphic(id: number): boolean {
  return SOL_LASER_ALL_IDS.has(id);
}

function textureIdForBeam(
  phase: SolLaserPhase,
  orientation: SolLaserOrientation,
): number {
  if (phase === "shot") {
    return orientation === "horizontal" ? 2693 : 2694;
  }
  return orientation === "horizontal" ? 2689 : 2690;
}

function beamFromPrism(
  prismX: number,
  prismY: number,
  spawnTick: number,
  phase: SolLaserPhase,
  plane: number,
): SolLaserBeam | null {
  if (prismX <= SOL_ARENA_MIN_X) {
    return {
      spawnTick,
      phase,
      orientation: "horizontal",
      fixedCoord: prismY,
      startVar: prismX + 1,
      endVar: SOL_ARENA_MAX_X,
      plane,
      textureId: textureIdForBeam(phase, "horizontal"),
    };
  }
  if (prismX >= SOL_ARENA_MAX_X) {
    return {
      spawnTick,
      phase,
      orientation: "horizontal",
      fixedCoord: prismY,
      startVar: SOL_ARENA_MIN_X,
      endVar: prismX - 1,
      plane,
      textureId: textureIdForBeam(phase, "horizontal"),
    };
  }
  if (prismY <= SOL_ARENA_MIN_Y) {
    return {
      spawnTick,
      phase,
      orientation: "vertical",
      fixedCoord: prismX,
      startVar: prismY + 1,
      endVar: SOL_ARENA_MAX_Y,
      plane,
      textureId: textureIdForBeam(phase, "vertical"),
    };
  }
  if (prismY >= SOL_ARENA_MAX_Y) {
    return {
      spawnTick,
      phase,
      orientation: "vertical",
      fixedCoord: prismX,
      startVar: SOL_ARENA_MIN_Y,
      endVar: prismY - 1,
      plane,
      textureId: textureIdForBeam(phase, "vertical"),
    };
  }
  return null;
}

function groupLine(
  tiles: GraphicsObjectState[],
  orientation: SolLaserOrientation,
): SolLaserBeam[] {
  if (tiles.length === 0) {
    return [];
  }

  const bySpawnTick = new Map<number, GraphicsObjectState[]>();
  for (const tile of tiles) {
    const list = bySpawnTick.get(tile.spawnTick) ?? [];
    list.push(tile);
    bySpawnTick.set(tile.spawnTick, list);
  }

  const beams: SolLaserBeam[] = [];

  for (const [spawnTick, spawnTiles] of bySpawnTick) {
    const phase = spawnTiles.some((tile) => SOL_LASER_SHOT_IDS.has(tile.id))
      ? "shot"
      : "scan";
    const plane = spawnTiles[0].position.plane;

    const prismTile = spawnTiles.find((tile) => PRISM_IDS.has(tile.id));
    if (prismTile) {
      const prismBeam = beamFromPrism(
        prismTile.position.x,
        prismTile.position.y,
        spawnTick,
        phase,
        plane,
      );
      if (prismBeam) {
        beams.push(prismBeam);
        continue;
      }
    }

    const byFixedCoord = new Map<number, GraphicsObjectState[]>();
    for (const tile of spawnTiles) {
      const fixedCoord =
        orientation === "horizontal" ? tile.position.y : tile.position.x;
      const list = byFixedCoord.get(fixedCoord) ?? [];
      list.push(tile);
      byFixedCoord.set(fixedCoord, list);
    }

    for (const [fixedCoord, lineTiles] of byFixedCoord) {
      const vars = lineTiles.map((tile) =>
        orientation === "horizontal" ? tile.position.x : tile.position.y,
      );
      beams.push({
        spawnTick,
        phase,
        orientation,
        fixedCoord,
        startVar: Math.min(...vars),
        endVar: Math.max(...vars),
        plane,
        textureId: textureIdForBeam(phase, orientation),
      });
    }
  }

  return beams;
}

/**
 * Groups per-tile Sol laser graphics into continuous beam segments.
 * Spotanim variants 2689/2693 are horizontal, 2690/2694 vertical, 2691/2695 prism origins.
 */
export function computeSolLaserBeams(
  graphicsObjects: Record<string, GraphicsObjectState>,
): SolLaserBeam[] {
  const laserTiles = Object.values(graphicsObjects).filter((object) =>
    isSolLaserGraphic(object.id),
  );
  if (laserTiles.length === 0) {
    return [];
  }

  const horizontalTiles = laserTiles.filter(
    (tile) => HORIZONTAL_SEGMENT_IDS.has(tile.id) || PRISM_IDS.has(tile.id),
  );
  const verticalTiles = laserTiles.filter(
    (tile) => VERTICAL_SEGMENT_IDS.has(tile.id) || PRISM_IDS.has(tile.id),
  );

  const horizontalBeams = groupLine(horizontalTiles, "horizontal");
  const verticalBeams = groupLine(verticalTiles, "vertical");

  // Prism-only tiles can match both orientations; keep the beam with the longer span.
  const deduped = new Map<string, SolLaserBeam>();
  for (const beam of [...horizontalBeams, ...verticalBeams]) {
    const key = `${beam.spawnTick}-${beam.orientation}-${beam.fixedCoord}`;
    const existing = deduped.get(key);
    if (
      !existing ||
      beam.endVar - beam.startVar > existing.endVar - existing.startVar
    ) {
      deduped.set(key, beam);
    }
  }

  return [...deduped.values()];
}
