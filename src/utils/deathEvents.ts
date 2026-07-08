import { Fight } from "../models/Fight";
import { Actor } from "../models/Actor";
import { DeathLog, filterByType, LogTypes } from "../models/LogLine";

export interface DeathEvent {
  target: DeathLog["target"];
  fightTimeMs: number;
}

export function isPlayerDeathTarget(fight: Fight, target: Actor): boolean {
  return fight.players.includes(target.name);
}

export function getDeathEvents(fight: Fight): DeathEvent[] {
  return filterByType(fight.data, LogTypes.DEATH)
    .filter((log): log is DeathLog => log.fightTimeMs != null)
    .filter((log) => isPlayerDeathTarget(fight, log.target))
    .map((log) => ({
      target: log.target,
      fightTimeMs: log.fightTimeMs!,
    }))
    .sort((a, b) => a.fightTimeMs - b.fightTimeMs);
}
