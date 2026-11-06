import { describe, expect, it } from "vitest";
import { Fight } from "../models/Fight";
import { LogLine, LogTypes } from "../models/LogLine";
import {
  normalizeAttackAnimationRows,
  UNKNOWN_ATTACK_TARGET,
} from "../utils/attackAnimationRows";
import { getAttackAnimationBreakdown } from "../utils/attackAnimationBreakdown";

const PLAYER = { name: "Alice", isPlayer: true };
const OCELLUS = { name: "Ocellus", id: 16675, index: 1, isPlayer: false };
const OBLIGATOR = "34715";

const attack = (animationId: number, target: object, source: object = PLAYER) =>
  ({
    type: LogTypes.PLAYER_ATTACK_ANIMATION,
    fightTimeMs: 600,
    tick: 1,
    animationId,
    source,
    target,
  }) as unknown as LogLine;

const makeFight = (data: LogLine[]): Fight =>
  ({ players: ["Alice"], data }) as unknown as Fight;

describe("normalizeAttackAnimationRows", () => {
  it.each([1666, 15133, 15134])("removes hit reaction %i", (animationId) => {
    const thrust = attack(15123, OCELLUS);
    const result = normalizeAttackAnimationRows(
      makeFight([attack(animationId, OCELLUS), thrust]),
    );
    expect(result.data).toEqual([thrust]);
  });

  it("names the target of a player attack logged without one", () => {
    const result = normalizeAttackAnimationRows(
      makeFight([attack(15123, { name: "", isPlayer: false })]),
    );
    expect(result.data[0]).toMatchObject({
      animationId: 15123,
      target: UNKNOWN_ATTACK_TARGET,
    });
  });

  it("leaves NPC rows alone, including a shared id or no target", () => {
    const npc = { name: "Pestilent Bloat", id: 8359, isPlayer: false };
    const rows = [
      attack(1666, PLAYER, npc),
      attack(8082, { name: "", isPlayer: false }, npc),
    ];
    const fight = makeFight(rows);
    expect(normalizeAttackAnimationRows(fight)).toBe(fight);
  });

  it("returns the same fight when there is nothing to change", () => {
    const fight = makeFight([attack(15123, OCELLUS), attack(426, OCELLUS)]);
    expect(normalizeAttackAnimationRows(fight)).toBe(fight);
  });

  it("does not mutate the original rows", () => {
    const rows = [attack(15133, OCELLUS), attack(15123, { name: "" })];
    normalizeAttackAnimationRows(makeFight(rows));
    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({ target: { name: "" } });
  });

  it("keeps blocks out of the attack breakdown", () => {
    const equipment = {
      type: LogTypes.PLAYER_EQUIPMENT,
      fightTimeMs: 0,
      tick: 0,
      source: PLAYER,
      playerEquipment: ["-1", "-1", "-1", OBLIGATOR],
    } as unknown as LogLine;
    const [alice] = getAttackAnimationBreakdown(
      normalizeAttackAnimationRows(
        makeFight([
          equipment,
          attack(15133, OCELLUS),
          attack(15123, { name: "", isPlayer: false }),
        ]),
      ),
    );
    expect(alice.totalAttacks).toBe(1);
    expect(alice.events[0].targetName).toBe("Unknown target");
  });
});
