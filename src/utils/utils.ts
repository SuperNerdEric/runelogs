import {Fight} from "../models/Fight";
import {LogLine, LogTypes} from "../models/LogLine";
import moment from "moment/moment";

export function getFightDurationFormatted(selectedLog: Fight): string {
    const fightDurationMilliseconds = selectedLog.metaData.fightLengthMs;
    const duration = new Date(Date.UTC(0, 0, 0, 0, 0, 0, fightDurationMilliseconds));
    const minutes = duration.getUTCMinutes();
    const seconds = duration.getUTCSeconds();
    const milliseconds = duration.getUTCMilliseconds();

    const formattedDuration = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${milliseconds}`;
    return formattedDuration;
}

/**
 * Formats milliseconds into a string in the format "HH:mm:ss".
 * Hours are only included if they exist in the duration.
 *
 * @param milliseconds The number of milliseconds to format.
 * @returns A string representing the formatted time.
 */
export function formatHHmmss(milliseconds: number, includeMs: boolean): string {
    if (!includeMs) {
        // Round milliseconds to the nearest second
        milliseconds = Math.round(milliseconds / 1000) * 1000;
    }

    let formatString = '';
    // Add hours if they exist
    if (moment.duration(milliseconds).hours() > 0) {
        formatString += 'HH:';
    }

    // Always add minutes and seconds
    formatString += 'mm:ss';

    if (includeMs) {
        formatString += '.SSS';
    }

    const formattedDuration = moment.utc(milliseconds).format(formatString);
    return formattedDuration;
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