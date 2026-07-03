import { LogLine, LogTypes } from "../models/LogLine";
import { ActorFilter } from "./actorFilter";

export interface EquipmentFilter {
  id: number;
  name: string;
}

type EquipmentSnapshot = { fightTimeMs: number; equipment: string[] };

export const serializeEquipmentFilter = (filter: EquipmentFilter): string => {
  return `${filter.id}|${filter.name}`;
};

export const deserializeEquipmentFilter = (
  value: string | null,
): EquipmentFilter | null => {
  if (!value) {
    return null;
  }

  const pipeIndex = value.indexOf("|");
  if (pipeIndex === -1) {
    const id = Number(value);
    if (Number.isNaN(id)) {
      return null;
    }
    return { id, name: "" };
  }

  const id = Number(value.slice(0, pipeIndex));
  const name = value.slice(pipeIndex + 1);
  if (Number.isNaN(id)) {
    return null;
  }

  return { id, name };
};

export const buildEquipmentTimelines = (
  logs: LogLine[],
): Map<string, EquipmentSnapshot[]> => {
  const timelines = new Map<string, EquipmentSnapshot[]>();

  for (const log of logs) {
    if (
      log.type !== LogTypes.PLAYER_EQUIPMENT ||
      !log.source?.name ||
      !log.playerEquipment
    ) {
      continue;
    }

    const snapshots = timelines.get(log.source.name) ?? [];
    snapshots.push({
      fightTimeMs: log.fightTimeMs ?? 0,
      equipment: log.playerEquipment,
    });
    timelines.set(log.source.name, snapshots);
  }

  for (const snapshots of timelines.values()) {
    snapshots.sort((a, b) => a.fightTimeMs - b.fightTimeMs);
  }

  return timelines;
};

const getEquipmentAtTime = (
  timelines: Map<string, EquipmentSnapshot[]>,
  playerName: string,
  timeMs: number,
): string[] | null => {
  const snapshots = timelines.get(playerName);
  if (!snapshots?.length) {
    return null;
  }

  let result: string[] | null = null;
  for (const snapshot of snapshots) {
    if (snapshot.fightTimeMs <= timeMs) {
      result = snapshot.equipment;
    } else {
      break;
    }
  }

  return result;
};

export const playerHasEquipmentAtTime = (
  timelines: Map<string, EquipmentSnapshot[]>,
  playerName: string,
  timeMs: number,
  itemId: number,
): boolean => {
  const equipment = getEquipmentAtTime(timelines, playerName, timeMs);
  if (!equipment) {
    return false;
  }

  return equipment.some((id) => parseInt(id, 10) === itemId);
};

export const matchesEquipmentFilter = (
  log: LogLine,
  timelines: Map<string, EquipmentSnapshot[]>,
  equipmentFilter: EquipmentFilter | null,
  sourceFilter: ActorFilter | null,
  targetFilter: ActorFilter | null,
): boolean => {
  if (!equipmentFilter) {
    return true;
  }

  const timeMs = log.fightTimeMs;
  if (timeMs === undefined) {
    return true;
  }

  const playersToCheck = new Set<string>();

  if (sourceFilter) {
    playersToCheck.add(sourceFilter.name);
  }
  if (targetFilter) {
    playersToCheck.add(targetFilter.name);
  }
  if (!sourceFilter && !targetFilter) {
    if ("source" in log && log.source?.name) {
      playersToCheck.add(log.source.name);
    }
    if ("target" in log && log.target?.name) {
      playersToCheck.add(log.target.name);
    }
  }

  if (playersToCheck.size === 0) {
    for (const playerName of timelines.keys()) {
      if (
        playerHasEquipmentAtTime(
          timelines,
          playerName,
          timeMs,
          equipmentFilter.id,
        )
      ) {
        return true;
      }
    }
    return false;
  }

  return Array.from(playersToCheck).some((playerName) =>
    playerHasEquipmentAtTime(timelines, playerName, timeMs, equipmentFilter.id),
  );
};
