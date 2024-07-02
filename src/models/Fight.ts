import {LogLine} from "./LogLine";

export interface Fight {
    fightTitle: string; // Unique fight name with a number appended to it
    mainEnemyName: string; // The name of the main enemy in the fight to be used for wiki link
    isNpc: boolean;
    metaData?: FightMetaData;
    data: LogLine[];
    enemies: string[];
    loggedInPlayer: string;

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