import { CoxExtraInfo } from "./fightGroupExtraInfo";

export function hasCoxRaidData(cox?: CoxExtraInfo | null): cox is CoxExtraInfo {
  return (
    cox != null &&
    typeof cox.partySize === "number" &&
    typeof cox.teamPoints === "number" &&
    typeof cox.playerPoints === "number"
  );
}

export function formatCoxPoints(points: number): string {
  return points.toLocaleString();
}

export function formatCoxRaidScale(partySize: number): string {
  return String(partySize);
}
