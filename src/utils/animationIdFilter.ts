import { AttackAnimationLog, LogLine, LogTypes } from "../models/LogLine";

export function deserializeAnimationIdFilter(
  value: string | null,
): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function serializeAnimationIdFilter(animationId: number): string {
  return String(animationId);
}

export function matchesAnimationIdFilter(
  log: LogLine,
  filter: number | null,
): boolean {
  if (filter === null) {
    return true;
  }

  if (log.type !== LogTypes.PLAYER_ATTACK_ANIMATION) {
    return false;
  }

  return (log as AttackAnimationLog).animationId === filter;
}
