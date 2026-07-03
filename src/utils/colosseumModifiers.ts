export const HANDICAP_LEVEL_VALUE_INCREMENT = 30;

export interface ColosseumModifierInfo {
  name: string;
  description: string;
}

const MODIFIER_DETAILS: Record<number, ColosseumModifierInfo> = {
  2: {
    name: "Bees!",
    description:
      "A Bee Swarm will drift around the arena, slowly converging on the player at a speed of 12 ticks. If beneath the player, it will deal up to 10 unblockable poison damage every tick, and inflict poison starting at 1 damage. They have 1 Hitpoint and will respawn 30 seconds after being killed.",
  },
  32: {
    name: "Bees! (II)",
    description: "The amount of bee swarms is increased to two.",
  },
  62: {
    name: "Bees! (III)",
    description: "The amount of bee swarms is increased to three.",
  },
  4: {
    name: "Blasphemy",
    description:
      "The player's prayer points are drained by 20% of damage taken from enemies.",
  },
  34: {
    name: "Blasphemy (II)",
    description: "Prayer drain is increased to 40% of damage taken.",
  },
  64: {
    name: "Blasphemy (III)",
    description: "Prayer drain is increased to 60% of damage taken.",
  },
  8: {
    name: "Doom",
    description:
      "A stack of Doom is gained whenever damage is taken. The player is killed upon gaining 15 stacks. Stacks of doom are cleared after completing a wave.",
  },
  38: {
    name: "Doom (II)",
    description: "The player is now killed upon gaining 10 stacks.",
  },
  68: {
    name: "Doom (III)",
    description: "The player is now killed upon gaining 5 stacks.",
  },
  9: {
    name: "Dynamic Duo",
    description:
      "Shockwave Colossi will now spawn in pairs. The paired Colossus spawns near the main Colossus, but not necessarily on one of the 12 default spawns. Will not be given as an option after wave 11.",
  },
  12: {
    name: "Frailty",
    description:
      "The player's base Hitpoints are reduced by 10%, and overhealing is disabled.",
  },
  42: {
    name: "Frailty (II)",
    description: "Base Hitpoints are reduced by 20%.",
  },
  72: {
    name: "Frailty (III)",
    description: "Base Hitpoints are reduced by 40%.",
  },
  0: {
    name: "Mantimayhem",
    description:
      "Manticores now add an additional projectile per orb, effectively attacking twice per attack cycle. Will not be given as an option after wave 11.",
  },
  30: {
    name: "Mantimayhem (II)",
    description:
      "Manticores are now venomous, applying it if its attacks are not prayed against. Venom is cured at the end of each wave. Will not be given as an option after wave 11.",
  },
  60: {
    name: "Mantimayhem (III)",
    description:
      "The manticore's attack patterns is now less predictable, now being set in any order of magic, range, and melee. Will not be given as an option after wave 11.",
  },
  11: {
    name: "Myopia",
    description:
      "The player's attack range is reduced by two tiles. Manually casted spells are unaffected.",
  },
  41: {
    name: "Myopia (II)",
    description:
      "Attack range is now reduced by four tiles. Manually casted spells are unaffected.",
  },
  71: {
    name: "Myopia (III)",
    description:
      "Attack range is now reduced by six tiles. Manually casted spells are unaffected.",
  },
  1: {
    name: "Reentry",
    description:
      "Javelins launched into the air by Javelin Colossi will now leave a temporary pool of molten sand where they land, disappearing after the wave ends. Will not be given as an option after wave 11.",
  },
  31: {
    name: "Reentry (II)",
    description:
      "The molten sand is now permanent, and now includes the targeted tile and the tile south-west of it, if accessible. This will also cause the sand created from the explosion of Volatility III to become permanent. Will not be given as an option after wave 11.",
  },
  61: {
    name: "Reentry (III)",
    description:
      "The tiles where molten sand is left behind now includes the tile west of the targeted tile. Will not be given as an option after wave 11.",
  },
  13: {
    name: "Red Flag",
    description:
      "Minotaurs now have advanced NPC pathing, allowing them to move around obstacles and making them impossible to safespot. Will not be given as an option after wave 11.",
  },
  5: {
    name: "Relentless",
    description:
      "Enemy attacks will now bypass 33% of the player's Defence level, and have their max hit increased by 1.",
  },
  35: {
    name: "Relentless (II)",
    description:
      "Attacks now bypass 66% of the player's Defence, and max hits are now increased by 3.",
  },
  65: {
    name: "Relentless (III)",
    description:
      "Enemies will fully ignore accuracy checks, and max hits are now increased by 6.",
  },
  10: {
    name: "Solarflare",
    description:
      "A damaging orb circles around the pillars, moving every 2 ticks, then stopping for 7 ticks when it reaches a corner. During wave 12, they will circle around a set pattern within the allotted arena.",
  },
  40: {
    name: "Solarflare (II)",
    description:
      "The orb now moves every two ticks without stopping, and deals more damage.",
  },
  70: {
    name: "Solarflare (III)",
    description:
      "The orb now moves every tick, stopping for 2 ticks when it reaches a corner. It will also now disable prayers if hit, alongside dealing even more damage.",
  },
  6: {
    name: "Quartet",
    description: "An extra random Fremennik Warbander spawns every wave.",
  },
  7: {
    name: "Totemic",
    description:
      "When an enemy is reduced to 50% hitpoints or below, a healing totem will appear near them, and send healing projectiles to the target, healing them for a 30% their health every few ticks. They have 1 Hitpoint and will respawn two minutes after being destroyed, or after the enemy dies. Additionally, it will not heal the enemy if they are destroyed before their healing projectile reaches them. During wave 12, after the first totem appears at 50%, an additional totem will spawn once every two minutes until the fight concludes.",
  },
  3: {
    name: "Volatility",
    description:
      "Upon death, the enemy will explode one tile greater than their size. For example, a manticore, whose size is 3x3 tiles, will explode in a 5x5 radius.",
  },
  33: {
    name: "Volatility (II)",
    description:
      "The explosion radius is now two tiles greater, ex. a 3x3 monster will now explode in a 7x7 radius.",
  },
  63: {
    name: "Volatility (III)",
    description:
      "The tile at the centre of the explosion now leaves behind a temporary pool of molten sand, disappearing after the wave ends. Reentry II or III will cause this pool of molten sand to become permanent.",
  },
};

const MODIFIER_IMAGE_SLUGS: Record<number, string> = {
  0: "mantimayhem",
  1: "reentry",
  2: "bees",
  3: "volatility",
  4: "blasphemy",
  5: "relentless",
  6: "quartet",
  7: "totemic",
  8: "doom",
  9: "dynamic-duo",
  10: "solarflare",
  11: "myopia",
  12: "frailty",
  13: "red-flag",
};

export interface ColosseumWaveModifier {
  chosen: number;
  options: number[];
}

export interface ColosseumModifierData {
  activeModifiers: number[];
  waveChoices: ColosseumWaveModifier[];
}

export function getBaseHandicapId(handicapId: number): number {
  return handicapId % HANDICAP_LEVEL_VALUE_INCREMENT;
}

export function getHandicapLevel(handicapId: number): number {
  return Math.floor(handicapId / HANDICAP_LEVEL_VALUE_INCREMENT) + 1;
}

export function getModifierInfo(modifierId: number): ColosseumModifierInfo {
  const details = MODIFIER_DETAILS[modifierId];
  if (details) {
    return details;
  }

  return {
    name: formatHandicapName(modifierId),
    description: "",
  };
}

export function formatHandicapName(handicapId: number): string {
  const details = MODIFIER_DETAILS[handicapId];
  if (details) {
    return details.name;
  }

  const baseId = getBaseHandicapId(handicapId);
  const baseName = MODIFIER_DETAILS[baseId]?.name ?? `Modifier ${handicapId}`;
  const level = getHandicapLevel(handicapId);

  if (level <= 1) {
    return baseName;
  }

  const roman = level === 2 ? "II" : level === 3 ? "III" : String(level);
  return `${baseName} (${roman})`;
}

export function getModifierImageUrl(modifierId: number): string {
  const baseId = getBaseHandicapId(modifierId);
  const slug = MODIFIER_IMAGE_SLUGS[baseId];
  if (!slug) {
    return "/images/colosseum/unknown.png";
  }

  const level = getHandicapLevel(modifierId);
  if (level <= 1) {
    return `/images/colosseum/${slug}.png`;
  }

  return `/images/colosseum/${slug}-${level}.png`;
}

export function getModifierLevelLabel(modifierId: number): string | null {
  const level = getHandicapLevel(modifierId);
  if (level <= 1) {
    return null;
  }

  return level === 2 ? "II" : level === 3 ? "III" : String(level);
}

export function longestModifierDescriptionLines(
  modifierIds: number[],
  charsPerLine = 42,
): number {
  let maxLines = 1;

  for (const modifierId of modifierIds) {
    const { description } = getModifierInfo(modifierId);
    if (!description) {
      continue;
    }

    maxLines = Math.max(maxLines, Math.ceil(description.length / charsPerLine));
  }

  return maxLines;
}

export function hasColosseumModifierData(
  modifiers: ColosseumModifierData | null | undefined,
): boolean {
  return Boolean(
    modifiers &&
    (modifiers.activeModifiers.length > 0 || modifiers.waveChoices.length > 0),
  );
}
