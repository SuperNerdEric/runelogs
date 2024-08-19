import {Fight, FightMetaData} from "./Fight";
import { Encounter } from "./LogLine";

export interface Wave {
    name: string;
    waveNumber: number;
    waveFights: Fight[]
}

export function isWave(e: Encounter): e is Wave {
    return (e as Wave).waveNumber !== undefined;
}

export interface WaveMetaData {
    name: string;
    waveFights: FightMetaData[]
}

export function isWaveMetadata(metaData: FightMetaData | WaveMetaData | null): metaData is WaveMetaData {
    if(metaData === null) {
        return false;
    } else {
        return (metaData as WaveMetaData).waveFights !== undefined;
    }
}

export function getWaveMetadata(fight: Wave): WaveMetaData {
    return {
        name: fight.name,
        waveFights: fight.waveFights.map(fight => fight.metaData)
    };
}