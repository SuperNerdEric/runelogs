import { Encounter, LogLine } from "./LogLine";
import { GearSetup } from "./GearSetup";

export interface Fight {
  id: string;
  name: string; // Unique fight name with a number appended to it
  mainEnemyName: string; // The name of the main enemy in the fight to be used for wiki link
  startTime: string;
  isNpc: boolean;
  isBoss: boolean;
  isWave: boolean; // e.g. Inferno/Colosseum waves. Usually consists of multiple NPCs in one fight
  metaData: FightMetaData;
  data: LogLine[];
  enemyNames: string[];
  loggedInPlayer: string;
  players: string[];
  logVersion: string;

  // Just for easy reference later
  firstLine: LogLine;
  lastLine: LogLine;

  /**
   * Gear setup snapshots (worn equipment, inventory, and rune pouch) at the
   * start of the fight, one per player with complete data (logged-in player
   * first). May be absent on older parsed data; the frontend falls back to
   * deriving them from {@link data}.
   */
  gearSetups?: GearSetup[];
}

export interface FightMetaData {
  name: string;
  startTime: string;
  fightDurationTicks: number;
  success: boolean;
  inProgress?: boolean;
}

export function isFight(fight: Encounter): fight is Fight {
  return (fight as Fight).loggedInPlayer !== undefined;
}
