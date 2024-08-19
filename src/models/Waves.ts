import {Fight, FightMetaData} from "./Fight";
import { Encounter } from "./LogLine";

export interface Waves {
    name: string;
    waveFights: Fight[]
}

export function isWaves(e: Encounter): e is Waves {
    return (e as Waves).waveFights !== undefined;
}

export interface WavesMetaData {
    name: string;
    waveFights: FightMetaData[]
}

export function isWaveMetadata(metaData: FightMetaData | WavesMetaData | null): metaData is WavesMetaData {
    if(metaData === null) {
        return false;
    } else {
        return (metaData as WavesMetaData).waveFights !== undefined;
    }
}

export function getWaveMetadata(fight: Waves): WavesMetaData {
    return {
        name: fight.name,
        waveFights: fight.waveFights.map(fight => fight.metaData)
    };
}