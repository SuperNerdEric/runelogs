import {Fight} from "../models/Fight";
import {LogLine, LogTypes} from "../models/LogLine";
import moment from "moment/moment";
import {npcIdMap} from '../lib/npcIdMap';


/**
 * Formats a given number of milliseconds into a string in the format "HH:mm:ss".
 * Hours are only included if the duration is at least 1 hour long.
 * If the `includeMs` parameter is true, milliseconds are included in the format "HH:mm:ss.SSS".
 *
 * @param {number} milliseconds - The number of milliseconds to format.
 * @param {boolean} includeMs - A boolean indicating whether to include milliseconds in the output.
 * @returns {string} A string representing the formatted time.
 */
export function formatHHmmss(milliseconds: number, includeMs: boolean): string {
    if (!includeMs) {
        // Round milliseconds to the nearest second
        milliseconds = Math.round(milliseconds / 1000) * 1000;
    }

    const duration = moment.utc(milliseconds);
    let formatString = duration.hours() > 0 ? 'HH:mm:ss' : 'mm:ss';
    if (includeMs) {
        formatString += '.SSS';
    }
    return duration.format(formatString);
}

export function calculateAccuracy(fight: Fight) {
    const hitsplatsCount = fight.data.filter(log => log.type === LogTypes.DAMAGE).length;
    const successfulHitsplatsCount = fight.data.filter(log => log.type === LogTypes.DAMAGE && (log as LogLine & {
        type: LogTypes.DAMAGE
    }).damageAmount > 0).length;
    const accuracyPercentage = hitsplatsCount > 0 ? (successfulHitsplatsCount / hitsplatsCount) * 100 : 0;
    return accuracyPercentage;
}

export const convertTimeToMillis = (time: string): number => {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    const milliseconds = hours * 3600000 + minutes * 60000 + seconds * 1000;
    return milliseconds;
};

export const getMonsterName = (monsterId: string): string => {
    const parts: string[] = monsterId.split("-");
    const monster = npcIdMap[Number(parts[0])];
    return monster ? monster : monsterId;
}