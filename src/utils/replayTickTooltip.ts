import { Levels } from "../models/Levels";

export type BoostLevelsByTick = Record<number, Record<string, Levels>>;

export function createBoostLevelResolver(boostLevelsByTick: BoostLevelsByTick) {
  const events = Object.entries(boostLevelsByTick)
    .map(([tick, players]) => ({ tick: Number(tick), players }))
    .sort((a, b) => a.tick - b.tick);

  return (tick: number, playerName: string): Levels | undefined => {
    let latest: Levels | undefined;

    for (const event of events) {
      if (event.tick > tick) {
        break;
      }

      const levels = event.players[playerName];
      if (levels) {
        latest = levels;
      }
    }

    return latest;
  };
}

export function getFightTimeMsForTick(
  tick: number,
  initialTick: number,
  fightStartMs: number,
): number {
  return (tick - initialTick) * 600 + fightStartMs;
}
