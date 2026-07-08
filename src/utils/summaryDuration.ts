import { Fight } from "../models/Fight";
import { getFightDurationSeconds } from "./dpsCalculation";

export function getSummaryDurationParts(fight: Fight): {
  hours: number;
  minutes: string;
  seconds: string;
  showHours: boolean;
} {
  const ticks =
    fight.metaData.fightDurationTicks > 0
      ? fight.metaData.fightDurationTicks
      : Math.round(getFightDurationSeconds(fight) / 0.6);
  const totalSeconds = Math.round(ticks * 0.6);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours,
    minutes: minutes.toString().padStart(2, "0"),
    seconds: seconds.toString().padStart(2, "0"),
    showHours: hours > 0,
  };
}

export function getSummaryDuration(fight: Fight): string {
  const { hours, minutes, seconds, showHours } = getSummaryDurationParts(fight);

  if (showHours) {
    return `${hours}:${minutes}:${seconds}`;
  }

  return `${Number(minutes)}:${seconds}`;
}

export function hasSummaryDuration(fight: Fight): boolean {
  if (fight.metaData.fightDurationTicks > 0) {
    return true;
  }

  return getFightDurationSeconds(fight) > 0;
}
