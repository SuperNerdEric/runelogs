import {Fight, FightMetaData} from "./Fight";
import { Encounter, EncounterMetaData } from "./LogLine";

export interface Raid {
    name: string;
    fights: Fight[]
}

export function isRaid(e: Encounter): e is Raid {
    return (e as Raid).fights !== undefined;
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

export function isRaidMetaData(metaData: EncounterMetaData | null): metaData is RaidMetaData {
    if(metaData === null) {
        return false;
    } else {
        return (metaData as RaidMetaData).fights !== undefined;
    }
}

export function getRaidMetadata(fight: Raid): RaidMetaData {
    return {
        name: fight.name,
        fights: fight.fights.map(fight => fight.metaData)
    };
}