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

export const formatMechanicHitsplatsLabel = (
  count: number,
  shown: boolean,
): string => {
  const noun =
    count === 1 ? "boss mechanic hitsplat" : "boss mechanic hitsplats";
  return shown ? `Hide ${count} ${noun}` : `Hiding ${count} ${noun}`;
};
