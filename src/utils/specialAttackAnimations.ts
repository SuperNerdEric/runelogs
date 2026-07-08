export interface SpecialAttackDefinition {
  name: string;
  weaponIds: readonly number[];
  animationIds: readonly number[];
}

export interface SpecialAttackPair {
  weaponItemId: number;
  animationId: number;
}

/**
 * Weapon + animation pairs for special attacks.
 *
 * Excluded: blowpipe and ZCB specs that share auto animations and cannot be distinguished.
 */
export const SPECIAL_ATTACK_DEFINITIONS: readonly SpecialAttackDefinition[] = [
  {
    name: "ACCURSED_SCEPTRE_SPEC",
    weaponIds: [27665, 27679],
    animationIds: [9961],
  },
  {
    name: "AGS_SPEC",
    weaponIds: [11802, 20368, 29605],
    animationIds: [7644, 7645],
  },
  {
    name: "ARCLIGHT_SPEC",
    weaponIds: [19675],
    animationIds: [2890],
  },
  {
    name: "ATLATL_SPEC",
    weaponIds: [29000],
    animationIds: [11060],
  },
  {
    name: "BGS_SPEC",
    weaponIds: [11804, 20370],
    animationIds: [7642, 7643],
  },
  {
    name: "BURNING_CLAW_SPEC",
    weaponIds: [29577],
    animationIds: [11140],
  },
  {
    name: "CHALLY_SPEC",
    weaponIds: [23987],
    animationIds: [1203],
  },
  {
    name: "CLAW_SPEC",
    weaponIds: [13652, 28039],
    animationIds: [7514],
  },
  {
    name: "DARKLIGHT_SPEC",
    weaponIds: [6746, 8281],
    animationIds: [2890],
  },
  {
    name: "DAWN_SPEC",
    weaponIds: [22516],
    animationIds: [1167],
  },
  {
    name: "DDS_SPEC",
    weaponIds: [1215, 1231, 5680, 5698],
    animationIds: [1062],
  },
  {
    name: "DINHS_SPEC",
    weaponIds: [21015, 28682],
    animationIds: [7511],
  },
  {
    name: "DRAGON_KNIFE_SPEC",
    weaponIds: [22804, 22806, 22808, 22810],
    animationIds: [8291],
  },
  {
    name: "ELDER_MAUL_SPEC",
    weaponIds: [21003, 27100],
    animationIds: [11124],
  },
  {
    name: "EMBERLIGHT_SPEC",
    weaponIds: [29589],
    animationIds: [11138],
  },
  {
    name: "EYE_OF_AYAK_SPEC",
    weaponIds: [31113],
    animationIds: [12394],
  },
  {
    name: "FANG_SPEC",
    weaponIds: [26219, 27246],
    animationIds: [11222],
  },
  {
    name: "HAMMER_SPEC",
    weaponIds: [13576, 28035],
    animationIds: [1378],
  },
  {
    name: "SCORCHING_BOW_SPEC",
    weaponIds: [29591],
    animationIds: [11133],
  },
  {
    name: "SGS_SPEC",
    weaponIds: [11806, 20372],
    animationIds: [7640, 7641],
  },
  {
    name: "TONALZTICS_SPEC",
    weaponIds: [28922],
    animationIds: [10914],
  },
  {
    name: "VOIDWAKER_SPEC",
    weaponIds: [27690, 29607],
    animationIds: [1378, 11275],
  },
  {
    name: "VOLATILE_NM_SPEC",
    weaponIds: [24424, 29602, 29609],
    animationIds: [8532],
  },
  {
    name: "WEBWEAVER_SPEC",
    weaponIds: [27655],
    animationIds: [9964],
  },
  {
    name: "XGS_SPEC",
    weaponIds: [26233, 27184],
    animationIds: [9171],
  },
  {
    name: "ZGS_SPEC",
    weaponIds: [11808, 20374],
    animationIds: [7638, 7639],
  },

  {
    name: "URSINE_MACE_SPEC",
    weaponIds: [27657, 27660],
    animationIds: [9963],
  },
  {
    name: "KERIS_PARTISAN_OF_CORRUPTION_SPEC",
    weaponIds: [27287],
    animationIds: [9544],
  },
  {
    name: "ABYSSAL_DAGGER_SPEC",
    weaponIds: [13265, 13267, 13269, 13271, 27861, 27863, 27865, 27867],
    animationIds: [3300],
  },
  {
    name: "ABYSSAL_BLUDGEON_SPEC",
    weaponIds: [13263],
    animationIds: [3299],
  },
  {
    name: "DRAGON_SWORD_SPEC",
    weaponIds: [21009, 28029],
    animationIds: [7515],
  },
  {
    name: "BONE_DAGGER_SPEC",
    weaponIds: [8872, 8874, 8876, 8878],
    animationIds: [4198],
  },
  {
    name: "SOULREAPER_AXE_SPEC",
    weaponIds: [28338],
    animationIds: [10173],
  },
  {
    name: "SARADOMIN_SWORD_SPEC",
    weaponIds: [11838],
    animationIds: [1132],
  },
  {
    name: "BLESSED_SARADOMIN_SWORD_SPEC",
    weaponIds: [12809],
    animationIds: [1133],
  },
  {
    name: "BARRELCHEST_ANCHOR_SPEC",
    weaponIds: [10887, 10888, 27855],
    animationIds: [5870],
  },
  {
    name: "DRAGONFIRE_SHIELD_SPEC",
    weaponIds: [11283, 11284],
    animationIds: [6696],
  },
  {
    name: "GRANITE_MAUL_SPEC",
    weaponIds: [4153, 12848, 20557, 24225, 24227],
    animationIds: [1667],
  },
  {
    name: "DRAGON_MACE_SPEC",
    weaponIds: [1434, 27857, 28027],
    animationIds: [1060],
  },
  {
    name: "DRAGON_2H_SPEC",
    weaponIds: [7158, 20559, 28051],
    animationIds: [3157],
  },
  {
    name: "DRAGON_LONGSWORD_SPEC",
    weaponIds: [1305, 27859, 28033],
    animationIds: [1058],
  },
  {
    name: "DRAGON_SCIMITAR_SPEC",
    weaponIds: [4587, 20000, 20406, 28031],
    animationIds: [12031],
  },
  {
    name: "DRAGON_SPEAR_SPEC",
    weaponIds: [1249, 1263, 5716, 5730, 28041, 28043, 28045, 28047],
    animationIds: [1064],
  },
  {
    name: "ANCIENT_MACE_SPEC",
    weaponIds: [11061],
    animationIds: [6147],
  },
  {
    name: "MAGIC_SHORTBOW_SPEC",
    weaponIds: [861, 12788, 20558],
    animationIds: [1074],
  },
  {
    name: "DORGESHUUN_CROSSBOW_SPEC",
    weaponIds: [8880],
    animationIds: [7557],
  },
  {
    name: "ROSEWOOD_BLOWPIPE_SPEC",
    weaponIds: [31583, 31584],
    animationIds: [13145],
  },
  {
    name: "ELDRITCH_NM_SPEC",
    weaponIds: [24425, 29609],
    animationIds: [8532],
  },
];

function flattenSpecialAttackPairs(
  definitions: readonly SpecialAttackDefinition[],
): SpecialAttackPair[] {
  const pairs: SpecialAttackPair[] = [];

  for (const definition of definitions) {
    for (const weaponItemId of definition.weaponIds) {
      for (const animationId of definition.animationIds) {
        pairs.push({ weaponItemId, animationId });
      }
    }
  }

  return pairs;
}

export const SPECIAL_ATTACK_PAIRS: readonly SpecialAttackPair[] =
  flattenSpecialAttackPairs(SPECIAL_ATTACK_DEFINITIONS);

const specialAttackPairKeys = new Set(
  SPECIAL_ATTACK_PAIRS.map(
    (pair) => `${pair.weaponItemId}:${pair.animationId}`,
  ),
);

export function isSpecialAttack(
  weaponItemId: number,
  animationId: number,
): boolean {
  return specialAttackPairKeys.has(`${weaponItemId}:${animationId}`);
}
