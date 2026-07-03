import { Fight } from "./models/Fight";
import { calculateFightDps } from "./utils/dpsCalculation";

/** @deprecated Use calculateFightDps from utils/dpsCalculation */
export function calculateDPS(fight: Fight): number {
  return calculateFightDps(fight);
}
