import {Fight} from "../models/Fight";
import {LogLine, LogTypes} from "../models/LogLine";

export function getFightDuration(selectedLog: Fight) {
    const fightDurationMilliseconds = calculateFightDuration(selectedLog!);
    const duration = new Date(Date.UTC(0, 0, 0, 0, 0, 0, fightDurationMilliseconds));
    const minutes = duration.getUTCMinutes();
    const seconds = duration.getUTCSeconds();
    const milliseconds = duration.getUTCMilliseconds();

    const formattedDuration = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${milliseconds}`;
    return formattedDuration;
}

const calculateFightDuration = (fight: Fight) => {
    if (fight.data.length === 0) {
        return 0;
    }

    const startTime = convertTimeToMillis(fight.firstLine.time);
    const endTime = convertTimeToMillis(fight.lastLine.time);

    return endTime - startTime;
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

export function convertMillisToTime(duration: number): string {
    const milliseconds = Math.floor(duration % 1000);
    let seconds: any = Math.floor((duration / 1000) % 60);
    let minutes: any = Math.floor((duration / (1000 * 60)) % 60);
    let hours: any = Math.floor((duration / (1000 * 60 * 60)) % 24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    const formattedMilliseconds = (milliseconds < 10) ? "00" + milliseconds : (milliseconds < 100) ? "0" + milliseconds : milliseconds;

    return hours + ":" + minutes + ":" + seconds + "." + formattedMilliseconds;
}