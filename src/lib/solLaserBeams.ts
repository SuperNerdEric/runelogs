import { GraphicsObjectState } from "../components/replay/GameState";

export const SOL_LASER_SCAN_IDS = new Set([2689, 2690, 2691]);
export const SOL_LASER_SHOT_IDS = new Set([2693, 2694, 2695]);
export const SOL_LASER_ALL_IDS = new Set([
  ...SOL_LASER_SCAN_IDS,
  ...SOL_LASER_SHOT_IDS,
]);

/**
 * Spotanim orientation from live Colosseum logs (IDs are opposite the asset names):
 * 2689/2691/2693/2695 form north-south columns; 2690/2694 form west-east rows.
 * All dumped frames are horizontal sprites — vertical beams need a 90° rotate at render.
 */
const HORIZONTAL_SEGMENT_IDS = new Set([2690, 2694]);
const VERTICAL_SEGMENT_IDS = new Set([2689, 2691, 2693, 2695]);

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
    return orientation === "horizontal" ? 2694 : 2693;
  }
  return orientation === "horizontal" ? 2690 : 2689;
}

/** Split sorted unique coords into contiguous inclusive [start, end] runs. */
function contiguousRuns(coords: number[]): Array<[number, number]> {
  if (coords.length === 0) {
    return [];
  }

  const sorted = [...new Set(coords)].sort((a, b) => a - b);
  const runs: Array<[number, number]> = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const value = sorted[i];
    if (value !== prev + 1) {
      runs.push([start, prev]);
      start = value;
    }
    prev = value;
  }
  runs.push([start, prev]);
  return runs;
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
      for (const [startVar, endVar] of contiguousRuns(vars)) {
        beams.push({
          spawnTick,
          phase,
          orientation,
          fixedCoord,
          startVar,
          endVar,
          plane,
          textureId: textureIdForBeam(phase, orientation),
        });
      }
    }
  }

  return beams;
}

/**
 * Groups per-tile Sol laser graphics into continuous beam segments.
 * 2690/2694 are west-east; 2689/2691/2693/2695 are north-south.
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

  const horizontalTiles = laserTiles.filter((tile) =>
    HORIZONTAL_SEGMENT_IDS.has(tile.id),
  );
  const verticalTiles = laserTiles.filter((tile) =>
    VERTICAL_SEGMENT_IDS.has(tile.id),
  );

  const horizontalBeams = groupLine(horizontalTiles, "horizontal");
  const verticalBeams = groupLine(verticalTiles, "vertical");

  const deduped = new Map<string, SolLaserBeam>();
  for (const beam of [...horizontalBeams, ...verticalBeams]) {
    const key = `${beam.spawnTick}-${beam.orientation}-${beam.fixedCoord}-${beam.startVar}-${beam.endVar}`;
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
