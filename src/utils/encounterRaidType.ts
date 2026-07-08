import { Fight } from "../models/Fight";
import { COX_MONSTERS, TOA_MONSTERS } from "../models/Constants";

export type EncounterRaidType = "toa" | "cox" | "default";

export function getEncounterRaidType(fight: Fight): EncounterRaidType {
  const toa = fight.enemyNames.some((enemy) => TOA_MONSTERS.includes(enemy));
  if (toa) {
    return "toa";
  }

  const cox = fight.enemyNames.some((enemy) => COX_MONSTERS.includes(enemy));
  if (cox) {
    return "cox";
  }

  return "default";
}
