import { ColosseumModifierData } from "./colosseumModifiers";
import { GearSetup } from "../models/GearSetup";

export interface ToaExtraInfo {
  raidLevel: number;
}

export interface FightGroupExtraInfo {
  colosseum?: ColosseumModifierData;
  toa?: ToaExtraInfo;
  mokhaiotl?: {
    delve1to8DurationTicks?: number;
    deepDelve?: {
      level: number;
      durationTicks: number;
    };
  };
  /**
   * Gear setup snapshots from the start of the first fight in the run, one per
   * player with complete data (logged-in player first).
   */
  gearSetups?: GearSetup[];
}
