import { Fight } from "../models/Fight";
import { Actor } from "../models/Actor";
import { AttackAnimationLog, filterByType, LogTypes } from "../models/LogLine";
import { getTrackedNpcAttackNpc } from "./trackedNpcAttackNpcs";
import { TICK_DURATION_SECONDS } from "../lib/replayTiming";

/** Full Bloat sleep/down cycle length in ticks. */
export const BLOAT_DOWN_CYCLE_TICKS = 32;
/**
 * Countdown value when Stomp occurs within the down cycle.
 * Stomp is {@link BLOAT_STOMP_OFFSET_TICKS} after Down.
 */
export const BLOAT_STOMP_COUNTDOWN_TICK = 3;
/** Ticks from Down to Stomp (32 − 3). */
export const BLOAT_STOMP_OFFSET_TICKS =
  BLOAT_DOWN_CYCLE_TICKS - BLOAT_STOMP_COUNTDOWN_TICK;

const TICK_DURATION_MS = TICK_DURATION_SECONDS * 1000;

export interface BloatDownEvent {
  source: Actor;
  fightTimeMs: number;
  animationId: number;
  /** Absolute log tick when present. */
  tick?: number;
  /** 1-based index of this down within the fight. */
  downNumber: number;
  /** Present when synthesized Stomp falls within the fight. */
  stompFightTimeMs?: number;
  stompSource?: Actor;
}

export interface BloatDownWindow {
  downNumber: number;
  startFightTimeMs: number;
  /** Synthesized Stomp time when present. */
  stompFightTimeMs?: number;
  /**
   * End of the Down cycle (Stomp + 3 ticks), or fight end when the fight ends
   * during a Down.
   */
  endFightTimeMs: number;
  /** True when a Stomp was synthesized (window may still extend 3 ticks past it). */
  endsWithStomp: boolean;
}

function isBloatDownLog(log: AttackAnimationLog): boolean {
  return (
    getTrackedNpcAttackNpc(log.source?.id)?.family === "bloat" &&
    log.animationId === 8082
  );
}

function defaultBloatSource(log: AttackAnimationLog): Actor {
  return log.source ?? { name: "Pestilent Bloat", isPlayer: false };
}

/** Absolute tick of Stomp for a Down that started at {@link downTick}. */
export function getBloatStompTick(downTick: number): number {
  return downTick + BLOAT_STOMP_OFFSET_TICKS;
}

/** Absolute tick when the Down cycle ends (Stomp + {@link BLOAT_STOMP_COUNTDOWN_TICK}). */
export function getBloatDownEndTick(downTick: number): number {
  return downTick + BLOAT_DOWN_CYCLE_TICKS;
}

/** Fight-time ms of Stomp for a Down that started at {@link downFightTimeMs}. */
export function getBloatStompFightTimeMs(downFightTimeMs: number): number {
  return downFightTimeMs + BLOAT_STOMP_OFFSET_TICKS * TICK_DURATION_MS;
}

/** Fight-time ms of Down end from a known Stomp time (Stomp + 3 ticks). */
export function getBloatDownEndFightTimeMsFromStomp(
  stompFightTimeMs: number,
): number {
  return stompFightTimeMs + BLOAT_STOMP_COUNTDOWN_TICK * TICK_DURATION_MS;
}

/**
 * Numbered Downs with Stomp timing synthesized at Down +
 * {@link BLOAT_STOMP_OFFSET_TICKS} when that tick is still in-fight.
 */
export function getBloatDownEvents(fight: Fight): BloatDownEvent[] {
  const downLogs = filterByType(fight.data, LogTypes.PLAYER_ATTACK_ANIMATION)
    .filter((log): log is AttackAnimationLog => log.fightTimeMs != null)
    .filter(isBloatDownLog)
    .sort((a, b) => a.fightTimeMs! - b.fightTimeMs!);

  const fightEndMs =
    fight.lastLine.fightTimeMs ??
    downLogs[downLogs.length - 1]?.fightTimeMs ??
    0;

  return downLogs.map((log, index) => {
    const down: BloatDownEvent = {
      source: defaultBloatSource(log),
      fightTimeMs: log.fightTimeMs!,
      animationId: log.animationId,
      tick: log.tick,
      downNumber: index + 1,
    };

    const syntheticMs = getBloatStompFightTimeMs(down.fightTimeMs);
    if (syntheticMs <= fightEndMs) {
      down.stompFightTimeMs = syntheticMs;
      down.stompSource = down.source;
    }

    return down;
  });
}

/**
 * Down windows for chart markers: start at Down, end 3 ticks after Stomp
 * (full cycle), or at fight end when the fight ends mid-Down.
 */
export function getBloatDownWindows(fight: Fight): BloatDownWindow[] {
  const downs = getBloatDownEvents(fight);
  const fightEndMs = fight.lastLine.fightTimeMs;

  return downs.map((down) => {
    if (down.stompFightTimeMs != null) {
      const cycleEndMs = getBloatDownEndFightTimeMsFromStomp(
        down.stompFightTimeMs,
      );
      return {
        downNumber: down.downNumber,
        startFightTimeMs: down.fightTimeMs,
        stompFightTimeMs: down.stompFightTimeMs,
        endFightTimeMs:
          fightEndMs != null ? Math.min(cycleEndMs, fightEndMs) : cycleEndMs,
        endsWithStomp: true,
      };
    }

    return {
      downNumber: down.downNumber,
      startFightTimeMs: down.fightTimeMs,
      endFightTimeMs: fightEndMs ?? down.fightTimeMs,
      endsWithStomp: false,
    };
  });
}
