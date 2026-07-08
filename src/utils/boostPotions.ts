import { EncounterRaidType } from "./encounterRaidType";

export interface BoostPotionDisplay {
  id: string;

  name: string;

  itemId: number;
}

const BOOST_ITEM_IDS = {
  superCombat: 12695,

  saturatedHeart: 27641,

  rangingPotion: 2444,

  smellingSalts: 27343,

  overload: 20992,
} as const;

export function getBoostPotionsForRaid(
  raidType: EncounterRaidType,
): BoostPotionDisplay[] {
  const saturatedHeart: BoostPotionDisplay = {
    id: "saturated-heart",

    name: "Saturated heart",

    itemId: BOOST_ITEM_IDS.saturatedHeart,
  };

  if (raidType === "toa") {
    return [
      {
        id: "smelling-salts",

        name: "Smelling salts",

        itemId: BOOST_ITEM_IDS.smellingSalts,
      },

      saturatedHeart,
    ];
  }

  if (raidType === "cox") {
    return [
      {
        id: "overload",

        name: "Overload",

        itemId: BOOST_ITEM_IDS.overload,
      },

      saturatedHeart,
    ];
  }

  return [
    {
      id: "super-combat",

      name: "Super combat potion",

      itemId: BOOST_ITEM_IDS.superCombat,
    },

    saturatedHeart,

    {
      id: "ranging-potion",

      name: "Ranging potion",

      itemId: BOOST_ITEM_IDS.rangingPotion,
    },
  ];
}
