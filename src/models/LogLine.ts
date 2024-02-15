import {BoostedLevels} from "./BoostedLevels";

export interface LogLine {
    date: string;
    time: string;
    timezone: string;
    target?: string;
    loggedInPlayer?: string;
    logVersion?: string;
    hitsplatName?: string;
    damageAmount?: number;
    boostedLevels?: BoostedLevels;
    playerEquipment?: string;
    source?: string;
}
