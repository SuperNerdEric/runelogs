import { Actor } from "../models/Actor";
import { LogLine } from "../models/LogLine";
import { BOSS_IDS, BOAT_IDS, BOAT_ID_TO_NAME } from "./constants";

export const UNKNOWN_PLAYER_NAME = "Unknown";

export function isUnknownPlayer(playerId: string): boolean {
  return playerId === UNKNOWN_PLAYER_NAME;
}

export function getPlayerNameTextClass(
  playerName: string,
  loggedInPlayer: string,
): string {
  if (playerName === loggedInPlayer) {
    return "logged-in-player-text";
  }
  if (isUnknownPlayer(playerName)) {
    return "unknown-text";
  }
  return "other-text";
}

export const getActorName = (
  log: LogLine,
  key: "source" | "target",
): string => {
  if (key in log) {
    // @ts-expect-error https://github.com/microsoft/TypeScript/issues/56389
    const actor: Actor = log[key];
    if (actor && actor.id && BOAT_IDS.includes(actor.id)) {
      if (key === "source") {
        return UNKNOWN_PLAYER_NAME;
      } else {
        const boatName = BOAT_ID_TO_NAME[actor.id] || "Boat";
        return actor.index !== undefined
          ? `${boatName}-${actor.index}`
          : boatName;
      }
    }
    if (actor && "index" in actor && !BOSS_IDS.includes(actor.id!)) {
      return `${actor.name} - ${actor.index}`;
    } else if (actor) {
      return actor.name;
    }
  }
  return "";
};

export const getActorFromLog = (
  log: LogLine,
  key: "source" | "target",
): Actor | undefined => {
  if (key in log) {
    // @ts-expect-error https://github.com/microsoft/TypeScript/issues/56389
    const actor: Actor = log[key];
    if (!actor) {
      return undefined;
    }
    if (actor.id && BOAT_IDS.includes(actor.id)) {
      if (key === "source") {
        return { ...actor, name: UNKNOWN_PLAYER_NAME };
      }
      const boatName = BOAT_ID_TO_NAME[actor.id] || "Boat";
      return {
        ...actor,
        name:
          actor.index !== undefined ? `${boatName}-${actor.index}` : boatName,
      };
    }
    return actor;
  }
  return undefined;
};

export const getActorSpecificIds = (
  logs: LogLine[],
  key: "source" | "target",
  name: string,
): number[] => {
  const idSet = new Set<number>();

  for (const log of logs) {
    const actor = getActorFromLog(log, key);
    if (!actor || actor.name !== name) {
      continue;
    }
    if (actor.index !== undefined) {
      idSet.add(actor.index);
    }
  }

  return Array.from(idSet).sort((a, b) => a - b);
};
