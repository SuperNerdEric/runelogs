import { Actor } from "../models/Actor";
import { Fight } from "../models/Fight";
import { LogTypes } from "../models/LogLine";
import { getVerzikMeleeFailureSeries } from "./verzikMeleeEvents";
import { getBossHealingFailureSeries } from "./bossHealingEvents";

/**
 * One occurrence of a trackable fight “failure” (melee hit, missed mechanic, etc.).
 * Source-specific detectors populate these; the summary counter stays generic.
 */
export interface FailureEvent {
  fightTimeMs: number;
  /** Who was targeted / affected — shown in the expanded timeline. */
  subjectLabel: string;
  source?: Actor;
  target?: Actor;
  animationId?: number;
  /** Defaults to PLAYER_ATTACK_ANIMATION when building Events deep-links. */
  eventType?: LogTypes;
  attackSpecial?: string;
  tick?: number;
  /** Optional numeric magnitude (e.g. heal amount) shown in the expanded timeline. */
  amount?: number;
}

export interface FailureEventSeries {
  id: string;
  singularLabel: string;
  pluralLabel: string;
  iconUrl: string;
  events: FailureEvent[];
  /**
   * Optional value shown in the badge instead of the event count (e.g. the summed
   * heal amount). The label always uses {@link pluralLabel} when this is set.
   */
  displayValue?: number;
}

export function getFailureSubjectLabel(target: Actor | undefined): string {
  if (target?.name) {
    return target.name;
  }
  if (target?.id != null) {
    return `NPC ${target.id}`;
  }
  return "Unknown";
}

/**
 * Collects all failure series for a fight. Detectors return null/empty when
 * the failure type does not apply; the header renders only non-empty series.
 */
export function getEncounterFailureSeries(fight: Fight): FailureEventSeries[] {
  return [
    getVerzikMeleeFailureSeries(fight),
    getBossHealingFailureSeries(fight),
  ].filter(
    (series): series is FailureEventSeries =>
      series != null && series.events.length > 0,
  );
}
