import { Fight } from "../models/Fight";
import { AttackAnimationLog, filterByType, LogTypes } from "../models/LogLine";
import {
  FailureEvent,
  FailureEventSeries,
  getFailureSubjectLabel,
} from "./failureEvents";
import { NPC_ATTACK_SPECIAL_META } from "./npcAttackAnimationNames";
import { getTrackedNpcAttackNpc } from "./trackedNpcAttackNpcs";

/** {@link AnimationID#VERZIK_PHASE3_ATTACK_MELEE} */
export const VERZIK_P3_MELEE_ANIMATION_ID = 8123;

export function isVerzikMeleeLog(log: AttackAnimationLog): boolean {
  if (getTrackedNpcAttackNpc(log.source?.id)?.family !== "verzik") {
    return false;
  }
  if (log.animationId === VERZIK_P3_MELEE_ANIMATION_ID) {
    return true;
  }
  // Legacy timed specials used animationId 0 + attackSpecial MELEE.
  return log.animationId === 0 && log.attackSpecial === "MELEE";
}

export function getVerzikMeleeEvents(fight: Fight): FailureEvent[] {
  return filterByType(fight.data, LogTypes.PLAYER_ATTACK_ANIMATION)
    .filter((log): log is AttackAnimationLog => log.fightTimeMs != null)
    .filter(isVerzikMeleeLog)
    .map((log) => ({
      fightTimeMs: log.fightTimeMs!,
      subjectLabel: getFailureSubjectLabel(log.target),
      source: log.source,
      target: log.target,
      animationId:
        log.animationId > 0 ? log.animationId : VERZIK_P3_MELEE_ANIMATION_ID,
      attackSpecial: log.attackSpecial,
      tick: log.tick,
      eventType: LogTypes.PLAYER_ATTACK_ANIMATION,
    }))
    .sort((a, b) => a.fightTimeMs - b.fightTimeMs);
}

export function getVerzikMeleeFailureSeries(
  fight: Fight,
): FailureEventSeries | null {
  const events = getVerzikMeleeEvents(fight);
  if (events.length === 0) {
    return null;
  }

  const iconUrl = NPC_ATTACK_SPECIAL_META.MELEE.imageUrl;
  if (!iconUrl) {
    return null;
  }

  return {
    id: "verzik-melee",
    singularLabel: "Melee",
    pluralLabel: "Melees",
    iconUrl,
    events,
  };
}
