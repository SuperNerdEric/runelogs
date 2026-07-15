import { Fight } from "../models/Fight";
import { LogLine, LogTypes } from "../models/LogLine";
import moment from "moment/moment";
import { npcIdMap } from "../lib/npcIdMap";
import { Actor } from "../models/Actor";

/**
 * Formats a given number of milliseconds into a string in the format "HH:mm:ss".
 * Hours are only included if the duration is at least 1 hour long.
 * If the `includeMs` parameter is true, milliseconds are included in the format "HH:mm:ss.SSS".
 *
 * @param {number} milliseconds - The number of milliseconds to format.
 * @param {boolean} includeMs - A boolean indicating whether to include milliseconds in the output.
 * @returns {string} A string representing the formatted time.
 */
export function formatHHmmss(milliseconds: number, includeMs: boolean): string {
  if (!includeMs) {
    // Round milliseconds to the nearest second
    milliseconds = Math.round(milliseconds / 1000) * 1000;
  }

  const duration = moment.utc(milliseconds);
  let formatString = duration.hours() > 0 ? "HH:mm:ss" : "mm:ss";
  if (includeMs) {
    formatString += ".SSS";
  }
  return duration.format(formatString);
}

export const ticksToTime = (ticks: number): string => {
  const totalSeconds = Math.round(ticks * 0.6);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = minutes.toString().padStart(2, "0");
  const ss = seconds.toString().padStart(2, "0");

  return hours > 0 ? `${hours}:${mm}:${ss}` : `${minutes}:${ss}`;
};

export function calculateAccuracy(fight: Fight) {
  const hitsplatsCount = fight.data.filter(
    (log) => log.type === LogTypes.DAMAGE,
  ).length;
  const successfulHitsplatsCount = fight.data.filter(
    (log) =>
      log.type === LogTypes.DAMAGE &&
      (
        log as LogLine & {
          type: LogTypes.DAMAGE;
        }
      ).damageAmount > 0,
  ).length;
  const accuracyPercentage =
    hitsplatsCount > 0 ? (successfulHitsplatsCount / hitsplatsCount) * 100 : 0;
  return accuracyPercentage;
}

export const convertTimeToMillis = (time: string): number => {
  const [hours, minutes, seconds] = time.split(":").map(Number);
  const milliseconds = hours * 3600000 + minutes * 60000 + seconds * 1000;
  return milliseconds;
};

/**
 * Get an actor from a given string. If the actor is a monster, the string should be in the format "id-index".
 *
 * @param {string} actorString A string representing the actor
 * @returns {Actor} An object representing the actor
 */
export const getActor = (actorString: string): Actor => {
  if (/^\d+-\d+$/.test(actorString)) {
    const [id, index] = actorString.split("-");
    const monster = npcIdMap[Number(id)];
    return {
      name: monster?.name || actorString,
      id: Number(id),
      index: Number(index),
    };
  }

  return {
    name: actorString,
  };
};

/**
 * Formats an Auth0 username for display when the value did not come from the
 * API (Auth0 JWT claims, route params). Auth0 stores usernames lowercase with
 * underscores; API responses already format uploaderId. Do not use for OSRS
 * player names.
 */
export const formatDisplayUsername = (username: string): string => {
  return username
    .replace(/_/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/** @deprecated Use formatDisplayUsername */
export const displayUsername = formatDisplayUsername;

/** Auth0 usernames use underscores; display may use spaces — restore for paths. */
export const usernameToPathSegment = (username: string): string => {
  return username.trim().replace(/\s+/g, "_");
};

export const usernamesEqual = (
  a: string | undefined | null,
  b: string | undefined | null,
): boolean => {
  if (!a || !b) return false;
  const normalize = (s: string) =>
    s.replace(/_/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
  return normalize(a) === normalize(b);
};
