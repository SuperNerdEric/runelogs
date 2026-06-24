import {ColosseumModifierData} from './colosseumModifiers';

export interface ToaExtraInfo {
    raidLevel: number;
}

export interface FightGroupExtraInfo {
    colosseum?: ColosseumModifierData;
    toa?: ToaExtraInfo;
}
