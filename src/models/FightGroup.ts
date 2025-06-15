import {Fight, FightMetaData} from "./Fight";
import { Encounter, EncounterMetaData } from "./LogLine";

/**
 * A fight group is a collection of fights that belong to a single piece of content such as a Raid (CoX, ToB, ToA) or a Wave based fight (Inferno, Colosseum).
 */
export interface FightGroup {
    name: string;
    fights: Fight[]
}

export function isFightGroup(e: Encounter): e is FightGroup {
    return (e as FightGroup).fights !== undefined;
}

export interface FightGroupMetaData {
    name: string;
    officialDurationTicks?: number;
    fights: FightMetaData[]
}

export function isFightGroupMetadata(metaData: EncounterMetaData | null): metaData is FightGroupMetaData {
    if(metaData === null) {
        return false;
    } else {
        return (metaData as FightGroupMetaData).fights !== undefined;
    }
}

export function getFightGroupMetadata(fight: FightGroup): FightGroupMetaData {
    return {
        name: fight.name,
        fights: fight.fights.map(fight => fight.metaData)
    };
}