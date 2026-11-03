import { Fight } from "../models/Fight";
import { LogLine, LogTypes } from "../models/LogLine";

/** Mechanic hitsplats are hidden unless this query param is "show". */
export const MECHANIC_HITSPLATS_PARAM = "mechanicHitsplats";

export const showsMechanicHitsplats = (value: string | null): boolean =>
  value === "show";

export const isMechanicDamage = (log: LogLine): boolean =>
  log.type === LogTypes.DAMAGE && log.isMechanicDamage === true;

export const countMechanicDamage = (fight: Fight): number => {
  let count = 0;
  for (const log of fight.data) {
    if (isMechanicDamage(log)) {
      count++;
    }
  }
  return count;
};

/** Returns the same fight object when there is nothing to hide. */
export const withoutMechanicDamage = (fight: Fight): Fight => {
  if (countMechanicDamage(fight) === 0) {
    return fight;
  }
  return { ...fight, data: fight.data.filter((log) => !isMechanicDamage(log)) };
};

export const formatMechanicHitsplatsLabel = (shown: boolean): string =>
  shown ? "Hide invalid hitsplats" : "Hiding invalid hitsplats";

export const formatMechanicHitsplatsTooltip = (count: number): string =>
  "Hitsplats that are not real damage dealt by a player. They are hidden " +
  "by default and never count toward DPS. " +
  `This fight has ${count} invalid ${count === 1 ? "hitsplat" : "hitsplats"}.`;
