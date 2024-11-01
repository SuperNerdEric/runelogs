import {LogLine} from "./LogLine";
import {Raid} from "./Raid";

export interface Fight {
    name: string; // Unique fight name with a number appended to it
    mainEnemyName: string; // The name of the main enemy in the fight to be used for wiki link
    isNpc: boolean;
    metaData: FightMetaData;
    data: LogLine[];
    enemyNames: string[];
    loggedInPlayer: string;
    logVersion: string;

    // Just for easy reference later
    firstLine: LogLine;
    lastLine: LogLine;
}

export interface FightMetaData {
    name: string;
    date: string;
    time: string;
    fightLengthMs: number;
    success: boolean;
}

export function isFight(fight: Fight | Raid): fight is Fight {
    return (fight as Fight).metaData !== undefined;
}