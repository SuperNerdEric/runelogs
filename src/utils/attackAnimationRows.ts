import { Actor } from "../models/Actor";
import { Fight } from "../models/Fight";
import { LogLine, LogTypes } from "../models/LogLine";

/**
 * Animations a player makes when hit, which Combat Logger before 1.7.6 logged as
 * attacks: granite maul, then the Obligator's male and female versions.
 */
const PLAYER_HIT_REACTION_ANIMATIONS: ReadonlySet<number> = new Set([
  1666, 15133, 15134,
]);

/** A player can attack without interacting with anything, as with the Obligator. */
export const UNKNOWN_ATTACK_TARGET: Actor = {
  name: "Unknown target",
  isPlayer: false,
};

const isPlayerAttackRow = (
  log: LogLine,
): log is Extract<LogLine, { type: LogTypes.PLAYER_ATTACK_ANIMATION }> =>
  log.type === LogTypes.PLAYER_ATTACK_ANIMATION &&
  log.source?.isPlayer !== false;

/**
 * Removes attack rows that are really the player being hit, and names the target
 * of attacks logged without one, so every tab and old log reads the same way.
 * Returns the same fight object when there is nothing to change.
 */
export const normalizeAttackAnimationRows = (fight: Fight): Fight => {
  let changed = false;
  const data: LogLine[] = [];

  for (const log of fight.data) {
    if (!isPlayerAttackRow(log)) {
      data.push(log);
    } else if (PLAYER_HIT_REACTION_ANIMATIONS.has(log.animationId)) {
      changed = true;
    } else if (!log.target?.name) {
      changed = true;
      data.push({ ...log, target: UNKNOWN_ATTACK_TARGET });
    } else {
      data.push(log);
    }
  }

  return changed ? { ...fight, data } : fight;
};
