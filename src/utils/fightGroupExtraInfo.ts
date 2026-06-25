import {ColosseumModifierData} from './colosseumModifiers';

export interface ToaExtraInfo {
    raidLevel: number;
}

export interface FightGroupExtraInfo {
    colosseum?: ColosseumModifierData;
    toa?: ToaExtraInfo;
    mokhaiotl?: {
        delve1to8DurationTicks?: number;
        deepDelve?: {
            level: number;
            durationTicks: number;
        };
    };
}
