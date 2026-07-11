import { describe, expect, it } from "vitest";
import { computeSolLaserBeams } from "../lib/solLaserBeams";
import { GraphicsObjectState } from "../components/replay/GameState";

function tile(
  id: number,
  x: number,
  y: number,
  spawnTick: number,
): GraphicsObjectState {
  return {
    id,
    spawnTick,
    position: { x, y, plane: 0 },
  };
}

describe("computeSolLaserBeams", () => {
  it("groups horizontal scan segments (2690) into one west-east beam", () => {
    const graphics = {
      a: tile(2690, 1820, 3105, 10),
      b: tile(2690, 1821, 3105, 10),
      c: tile(2690, 1822, 3105, 10),
    };

    const beams = computeSolLaserBeams(graphics);
    expect(beams).toHaveLength(1);
    expect(beams[0]).toMatchObject({
      phase: "scan",
      orientation: "horizontal",
      fixedCoord: 3105,
      startVar: 1820,
      endVar: 1822,
      textureId: 2690,
    });
  });

  it("groups vertical scan segments (2689) into one north-south beam", () => {
    const graphics = {
      a: tile(2689, 1822, 3104, 10),
      b: tile(2689, 1822, 3105, 10),
      c: tile(2689, 1822, 3106, 10),
    };

    const beams = computeSolLaserBeams(graphics);
    expect(beams).toHaveLength(1);
    expect(beams[0]).toMatchObject({
      phase: "scan",
      orientation: "vertical",
      fixedCoord: 1822,
      startVar: 3104,
      endVar: 3106,
      textureId: 2689,
    });
  });

  it("does not connect separate vertical columns across a west-east gap", () => {
    const graphics = {
      left1: tile(2689, 1820, 3105, 10),
      left2: tile(2689, 1820, 3106, 10),
      right1: tile(2689, 1825, 3105, 10),
      right2: tile(2689, 1825, 3106, 10),
    };

    const beams = computeSolLaserBeams(graphics);
    expect(beams).toHaveLength(2);
    expect(beams.every((beam) => beam.orientation === "vertical")).toBe(true);
    expect(beams.map((beam) => beam.fixedCoord).sort()).toEqual([1820, 1825]);
  });

  it("splits gapped tiles on the same row into separate horizontal beams", () => {
    const graphics = {
      a: tile(2690, 1820, 3105, 10),
      b: tile(2690, 1821, 3105, 10),
      // gap at 1822
      c: tile(2690, 1824, 3105, 10),
      d: tile(2690, 1825, 3105, 10),
    };

    const beams = computeSolLaserBeams(graphics);
    expect(beams).toHaveLength(2);
    expect(beams).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          orientation: "horizontal",
          fixedCoord: 3105,
          startVar: 1820,
          endVar: 1821,
        }),
        expect.objectContaining({
          orientation: "horizontal",
          fixedCoord: 3105,
          startVar: 1824,
          endVar: 1825,
        }),
      ]),
    );
  });

  it("treats 2691 as a vertical scan column, not a full-arena prism", () => {
    const graphics = {
      a: tile(2691, 1820, 3101, 20),
      b: tile(2691, 1820, 3102, 20),
      c: tile(2691, 1820, 3103, 20),
    };

    const beams = computeSolLaserBeams(graphics);
    expect(beams).toHaveLength(1);
    expect(beams[0]).toMatchObject({
      orientation: "vertical",
      fixedCoord: 1820,
      startVar: 3101,
      endVar: 3103,
      textureId: 2689,
    });
  });

  it("groups vertical shot segments separately from scan", () => {
    const graphics = {
      scan: tile(2689, 1825, 3101, 30),
      scan2: tile(2689, 1825, 3102, 30),
      shot: tile(2693, 1825, 3108, 40),
      shot2: tile(2693, 1825, 3109, 40),
    };

    const beams = computeSolLaserBeams(graphics);
    expect(beams).toHaveLength(2);
    expect(beams.find((beam) => beam.spawnTick === 30)).toMatchObject({
      phase: "scan",
      orientation: "vertical",
      textureId: 2689,
    });
    expect(beams.find((beam) => beam.spawnTick === 40)).toMatchObject({
      phase: "shot",
      orientation: "vertical",
      textureId: 2693,
    });
  });
});
