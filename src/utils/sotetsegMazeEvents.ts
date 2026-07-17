import { Fight } from "../models/Fight";
import { Actor } from "../models/Actor";
import { LogLine } from "../models/LogLine";

/**
 * Sotetseg noncombat-form ids (maze start). Sotetseg turns into its noncombat
 * form when a maze begins and back into its combat form when the maze ends, so
 * its current form is a reliable phase signal even for logs recorded before
 * boss-HP tracking existed.
 */
export const SOTETSEG_MAZE_START_IDS: ReadonlySet<number> = new Set([
  8387, // regular noncombat
  10864, // entry noncombat
  10867, // hard noncombat
]);

/** Sotetseg combat-form ids (maze end / normal combat). */
export const SOTETSEG_MAZE_END_IDS: ReadonlySet<number> = new Set([
  8388, // regular combat
  10865, // entry combat
  10868, // hard combat
]);

export interface SotetsegMazeWindow {
  /** 1-based order of this maze within the fight. */
  mazeNumber: number;
  /** Fight-time ms when Sotetseg turned into its noncombat (maze) form. */
  startFightTimeMs: number;
  /** Absolute log tick of the maze start. */
  startTick: number;
  /**
   * Fight-time ms when Sotetseg turned back into its combat form, or fight end
   * when the fight ends mid-maze.
   */
  endFightTimeMs: number;
  /** Absolute log tick of the maze end. */
  endTick: number;
  /** True when the maze closed with a combat-form transition (not fight end). */
  endsWithCombat: boolean;
}

/** Actors referenced by a log line that could be Sotetseg. */
function actorsInLog(log: LogLine): Actor[] {
  const actors: Actor[] = [];
  const record = log as unknown as {
    source?: Actor;
    target?: Actor;
    oldNpc?: Actor;
    newNpc?: Actor;
  };
  if (record.source) {
    actors.push(record.source);
  }
  if (record.target) {
    actors.push(record.target);
  }
  if (record.oldNpc) {
    actors.push(record.oldNpc);
  }
  if (record.newNpc) {
    actors.push(record.newNpc);
  }
  return actors;
}

/** Which Sotetseg form (if any) a log line references. */
function sotetsegFormInLog(log: LogLine): "maze" | "combat" | null {
  for (const actor of actorsInLog(log)) {
    if (actor?.id == null) {
      continue;
    }
    if (SOTETSEG_MAZE_START_IDS.has(actor.id)) {
      return "maze";
    }
    if (SOTETSEG_MAZE_END_IDS.has(actor.id)) {
      return "combat";
    }
  }
  return null;
}

/**
 * Maze windows for Sotetseg damage charts. A window opens when Sotetseg is first
 * seen in its noncombat (maze) form and closes when it is next seen in its
 * combat form; a window still open at the end of the fight extends to fight end.
 */
export function getSotetsegMazeWindows(fight: Fight): SotetsegMazeWindow[] {
  const sightings: {
    fightTimeMs: number;
    tick: number;
    form: "maze" | "combat";
  }[] = [];

  for (const log of fight.data) {
    const fightTimeMs = log.fightTimeMs;
    if (fightTimeMs == null || log.tick == null) {
      continue;
    }
    const form = sotetsegFormInLog(log);
    if (form) {
      sightings.push({ fightTimeMs, tick: log.tick, form });
    }
  }

  if (sightings.length === 0) {
    return [];
  }

  sightings.sort((a, b) => a.fightTimeMs - b.fightTimeMs);

  const lastSighting = sightings[sightings.length - 1];
  const fightEndMs = fight.lastLine.fightTimeMs ?? lastSighting.fightTimeMs;
  const fightEndTick = fight.lastLine.tick ?? lastSighting.tick;

  const windows: SotetsegMazeWindow[] = [];
  let open: { startFightTimeMs: number; startTick: number } | null = null;

  for (const sighting of sightings) {
    if (sighting.form === "maze") {
      if (open == null) {
        open = {
          startFightTimeMs: sighting.fightTimeMs,
          startTick: sighting.tick,
        };
      }
    } else if (open != null) {
      windows.push({
        mazeNumber: windows.length + 1,
        startFightTimeMs: open.startFightTimeMs,
        startTick: open.startTick,
        endFightTimeMs: sighting.fightTimeMs,
        endTick: sighting.tick,
        endsWithCombat: true,
      });
      open = null;
    }
  }

  if (open != null) {
    windows.push({
      mazeNumber: windows.length + 1,
      startFightTimeMs: open.startFightTimeMs,
      startTick: open.startTick,
      endFightTimeMs: fightEndMs,
      endTick: fightEndTick,
      endsWithCombat: false,
    });
  }

  return windows;
}
