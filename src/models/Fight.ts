import {Encounter, LogLine} from "./LogLine";

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
}

export interface FightMetaData {
    name: string;
    startTime: string;
    fightDurationTicks: number;
    success: boolean;
}

export function isFight(fight: Encounter): fight is Fight {
    return (fight as Fight).loggedInPlayer !== undefined;
}