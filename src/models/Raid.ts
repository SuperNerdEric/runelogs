import {Fight, FightMetaData} from "./Fight";

export interface Raid {
    name: string;
    fights: Fight[]
}

export interface RaidMetaData {
    name: string;
    //todo: add more fields to display in FightSelector or title (so you can know if you beat it and how long it took)
    //date: string;
    //time: string;
    //success: boolean;
    //lengthMs: number;
    fights: FightMetaData[]
}

export function isRaidMetaData(metaData: FightMetaData | RaidMetaData | null): metaData is RaidMetaData {
    if(metaData === null) {
        return false;
    } else {
        return (metaData as RaidMetaData).fights !== undefined;
    }
}