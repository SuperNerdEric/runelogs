import hitpointsImage from "../assets/Hitpoints.webp";
import { Fight } from "../models/Fight";
import { filterByType, HealLog, LogTypes } from "../models/LogLine";
import {
  FailureEvent,
  FailureEventSeries,
  getFailureSubjectLabel,
} from "./failureEvents";

/**
 * Heals landed on an enemy NPC. Player targets ({@link Actor#isPlayer}) are excluded so
 * this only reflects health the boss/monsters regained.
 */
function isBossHeal(log: HealLog): boolean {
  return log.target?.isPlayer === false && log.healAmount > 0;
}

export function getBossHealingEvents(fight: Fight): FailureEvent[] {
  if (!fight.isBoss) {
    return [];
  }

  return filterByType(fight.data, LogTypes.HEAL)
    .filter((log): log is HealLog => log.fightTimeMs != null)
    .filter(isBossHeal)
    .map((log) => ({
      fightTimeMs: log.fightTimeMs!,
      subjectLabel: getFailureSubjectLabel(log.target),
      target: log.target,
      eventType: LogTypes.HEAL,
      tick: log.tick,
      amount: log.healAmount,
    }))
    .sort((a, b) => a.fightTimeMs - b.fightTimeMs);
}

export function getBossHealingFailureSeries(
  fight: Fight,
): FailureEventSeries | null {
  const events = getBossHealingEvents(fight);
  if (events.length === 0) {
    return null;
  }

  const totalHealed = events.reduce(
    (sum, event) => sum + (event.amount ?? 0),
    0,
  );

  return {
    id: "boss-healing",
    singularLabel: "Boss Healing",
    pluralLabel: "Boss Healing",
    iconUrl: hitpointsImage,
    events,
    displayValue: totalHealed,
  };
}
