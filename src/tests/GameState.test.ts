import { describe, expect, it } from "vitest";
import {
  createGameStates,
  getGameStateAtTick,
  getTargetTick,
} from "../components/replay/GameState";
import { Fight } from "../models/Fight";
import { LogTypes } from "../models/LogLine";
import { TICK_DURATION_SECONDS } from "../lib/replayTiming";

function makeFight(data: Fight["data"]): Fight {
  return {
    id: "test-fight",
    name: "Test",
    data,
  };
}

describe("createGameStates", () => {
  it("tracks graphics objects across ticks without mutating prior snapshots", () => {
    const fight = makeFight([
      {
        type: LogTypes.GRAPHICS_OBJECT_SPAWNED,
        tick: 10,
        id: 3264,
        position: { x: 100, y: 200, plane: 0 },
        startCycle: 300,
      },
      {
        type: LogTypes.GRAPHICS_OBJECT_DESPAWNED,
        tick: 11,
        id: 3264,
        position: { x: 100, y: 200, plane: 0 },
        endCycle: 330,
      },
      {
        type: LogTypes.GRAPHICS_OBJECT_SPAWNED,
        tick: 12,
        id: 3265,
        position: { x: 101, y: 201, plane: 0 },
      },
    ]);

    const gameStates = createGameStates(fight);
    const tick10 = gameStates.find((state) => state.tick === 10);
    const tick11 = gameStates.find((state) => state.tick === 11);
    const tick12 = gameStates.find((state) => state.tick === 12);

    expect(tick10?.graphicsObjects["3264-100-200-0"]).toMatchObject({
      id: 3264,
      spawnTick: 10,
      startCycle: 300,
    });
    expect(tick11?.graphicsObjects["3264-100-200-0"]).toMatchObject({
      despawnTick: 11,
      endCycle: 330,
    });
    expect(tick12?.graphicsObjects["3264-100-200-0"]).toBeUndefined();
    expect(tick12?.graphicsObjects["3265-101-201-0"]).toMatchObject({
      id: 3265,
      spawnTick: 12,
    });
    expect(tick10?.graphicsObjects["3264-100-200-0"]).not.toHaveProperty(
      "despawnTick",
    );
  });

  it("tracks ground objects across spawn and despawn ticks", () => {
    const fight = makeFight([
      {
        type: LogTypes.GROUND_OBJECT_SPAWNED,
        tick: 10,
        id: 32743,
        position: { x: 3169, y: 4393, plane: 1 },
      },
      {
        type: LogTypes.GROUND_OBJECT_DESPAWNED,
        tick: 12,
        id: 32743,
        position: { x: 3169, y: 4393, plane: 1 },
      },
    ]);

    const gameStates = createGameStates(fight);
    const tick10 = gameStates.find((state) => state.tick === 10);
    const tick12 = gameStates.find((state) => state.tick === 12);

    expect(tick10?.groundObjects["32743-3169-4393-1"]).toMatchObject({
      id: 32743,
      position: { x: 3169, y: 4393, plane: 1 },
    });
    expect(
      getGameStateAtTick(gameStates, 11)?.groundObjects["32743-3169-4393-1"],
    ).toMatchObject({
      id: 32743,
    });
    expect(tick12?.groundObjects["32743-3169-4393-1"]).toBeUndefined();
  });
});

describe("getGameStateAtTick", () => {
  const fight = makeFight([
    {
      type: LogTypes.POSITION,
      tick: 5,
      source: { name: "Player", id: 0, index: 0 },
      position: { x: 1, y: 2, plane: 0 },
    },
    {
      type: LogTypes.POSITION,
      tick: 8,
      source: { name: "Player", id: 0, index: 0 },
      position: { x: 3, y: 4, plane: 0 },
    },
  ]);
  const gameStates = createGameStates(fight);

  it("returns the latest state at or before the target tick", () => {
    expect(getGameStateAtTick(gameStates, 4)?.tick).toBe(5);
    expect(getGameStateAtTick(gameStates, 5)?.tick).toBe(5);
    expect(getGameStateAtTick(gameStates, 7)?.tick).toBe(5);
    expect(getGameStateAtTick(gameStates, 8)?.tick).toBe(8);
  });

  it("maps replay time to the same tick state", () => {
    const initialTick = 5;
    const currentTime = (7 - initialTick) * TICK_DURATION_SECONDS;
    expect(getTargetTick(currentTime, initialTick)).toBe(7);
    expect(
      getGameStateAtTick(gameStates, getTargetTick(currentTime, initialTick))
        ?.tick,
    ).toBe(5);
  });
});
