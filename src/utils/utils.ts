import {Fight} from "../models/Fight";
import {LogLine, LogTypes} from "../models/LogLine";
import moment from "moment/moment";
import {npcIdMap} from '../lib/npcIdMap';
import {Actor} from "../models/Actor";


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

export const ticksToTime = (ticks: number): string => {
    const totalSeconds = Math.round(ticks * 0.6);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const mm = minutes.toString().padStart(2, '0');
    const ss = seconds.toString().padStart(2, '0');


    return hours > 0
        ? `${hours}:${mm}:${ss}`
        : `${minutes}:${ss}`;
};

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

/**
 * Get an actor from a given string. If the actor is a monster, the string should be in the format "id-index".
 *
 * @param {string} actorString A string representing the actor
 * @returns {Actor} An object representing the actor
 */
export const getActor = (actorString: string): Actor => {
    const [id, index] = actorString.split("-");
    if (index) {
        const monster = npcIdMap[Number(id)];
        if (!monster) {
            return {
                name: actorString,
            }
        }
        return {
            name: monster.name,
            id: Number(id),
            index: Number(index),
        };
    }

    return {
        name: actorString,
    }
}

export const displayUsername = (username: string): string => {
    return username.replace(/_/g, ' ');
};

export const getRankColor = (rank: number): string => {
    let rankColor = "#9d9d9d"; // Default color for ranks below 60

    if (rank <= 3) {
        rankColor = "#e5cc80";
    } else if (rank <= 10 && rank > 3) {
        rankColor = "#f48cba";
    } else if (rank <= 20 && rank > 10) {
        rankColor = "#ff8000";
    } else if (rank <= 100 && rank > 20) {
        rankColor = "#a335ee";
    } else if (rank <= 200 && rank > 100) {
        rankColor = "#0070dd";
    } else if (rank <= 500 && rank > 200) {
        rankColor = "#1eff00";
    } else if (rank > 500) {
        rankColor = "#9d9d9d";
    }
    return rankColor;
}