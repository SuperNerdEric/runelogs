import { describe, expect, it } from "vitest";
import {
  isSpecialAttack,
  SPECIAL_ATTACK_DEFINITIONS,
  SPECIAL_ATTACK_PAIRS,
} from "../utils/specialAttackAnimations";

describe("specialAttackAnimations", () => {
  it("exports flattened weapon+animation pairs from definitions", () => {
    const expectedCount = SPECIAL_ATTACK_DEFINITIONS.reduce(
      (total, definition) =>
        total + definition.weaponIds.length * definition.animationIds.length,
      0,
    );

    expect(SPECIAL_ATTACK_PAIRS).toHaveLength(expectedCount);
  });

  it("detects known special attack pairs", () => {
    expect(isSpecialAttack(11802, 7644)).toBe(true);
    expect(isSpecialAttack(13652, 7514)).toBe(true);
    expect(isSpecialAttack(27690, 11275)).toBe(true);
    expect(isSpecialAttack(24424, 8532)).toBe(true);
  });

  it("detects additional special attack pairs", () => {
    expect(isSpecialAttack(27660, 9963)).toBe(true);
    expect(isSpecialAttack(27287, 9544)).toBe(true);
    expect(isSpecialAttack(13265, 3300)).toBe(true);
    expect(isSpecialAttack(13263, 3299)).toBe(true);
    expect(isSpecialAttack(21009, 7515)).toBe(true);
    expect(isSpecialAttack(8872, 4198)).toBe(true);
    expect(isSpecialAttack(28338, 10173)).toBe(true);
    expect(isSpecialAttack(11838, 1132)).toBe(true);
    expect(isSpecialAttack(12809, 1133)).toBe(true);
    expect(isSpecialAttack(10887, 5870)).toBe(true);
    expect(isSpecialAttack(11283, 6696)).toBe(true);
    expect(isSpecialAttack(4153, 1667)).toBe(true);
    expect(isSpecialAttack(1434, 1060)).toBe(true);
    expect(isSpecialAttack(7158, 3157)).toBe(true);
    expect(isSpecialAttack(1305, 1058)).toBe(true);
    expect(isSpecialAttack(4587, 12031)).toBe(true);
    expect(isSpecialAttack(1249, 1064)).toBe(true);
    expect(isSpecialAttack(11061, 6147)).toBe(true);
    expect(isSpecialAttack(861, 1074)).toBe(true);
    expect(isSpecialAttack(8880, 7557)).toBe(true);
    expect(isSpecialAttack(31583, 13145)).toBe(true);
    expect(isSpecialAttack(24425, 8532)).toBe(true);
  });

  it("avoids animation-only false positives", () => {
    expect(isSpecialAttack(13576, 1378)).toBe(true);
    expect(isSpecialAttack(27690, 1378)).toBe(true);
    expect(isSpecialAttack(13576, 11275)).toBe(false);
    expect(isSpecialAttack(27690, 401)).toBe(false);
  });

  it("does not treat blowpipe auto animations as specs", () => {
    expect(isSpecialAttack(12926, 5061)).toBe(false);
    expect(isSpecialAttack(28688, 10656)).toBe(false);
    expect(isSpecialAttack(31583, 13144)).toBe(false);
    expect(isSpecialAttack(31575, 13142)).toBe(false);
    expect(isSpecialAttack(31579, 13143)).toBe(false);
  });

  it("detects rosewood blowpipe spec with distinct animation", () => {
    expect(isSpecialAttack(31583, 13145)).toBe(true);
    expect(isSpecialAttack(31583, 13144)).toBe(false);
  });

  it("does not treat zcb auto animation as spec", () => {
    expect(isSpecialAttack(26374, 9168)).toBe(false);
  });
});
