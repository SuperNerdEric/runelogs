export const COLUMN_TOOLTIPS = {
  activity:
    "Percent of ticks where you attacked, factoring in attack speed. 100% means no missed ticks.",
  accuracy: "Percent of hits that are not 0.",
  dps: "Average damage per second.",
  npcId:
    "The game ID for this NPC. Monsters with the same name can have different IDs.",
  npcIndex:
    "The index number for one specific instance of an NPC. Use this to tell apart different copies with the same ID.",
} as const;
