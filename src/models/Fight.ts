import {LogLine} from "./LogLine";

export interface Fight {
    name: string;
    metaData: FightMetaData;
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