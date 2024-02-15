import {Fight} from "../models/Fight";
import {LogLine} from "../models/LogLine";

export function getFightDuration(selectedLog: Fight) {
    const fightDurationMilliseconds = calculateFightDuration(selectedLog!.data);
    const duration = new Date(Date.UTC(0, 0, 0, 0, 0, 0, fightDurationMilliseconds));
    const minutes = duration.getUTCMinutes();
    const seconds = duration.getUTCSeconds();
    const milliseconds = duration.getUTCMilliseconds();

    const formattedDuration = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${milliseconds}`;
    return formattedDuration;
}

const calculateFightDuration = (logs: LogLine[]) => {
    if (logs.length === 0) {
        return 0;
    }

    const startTime = convertTimeToMillis(logs[0].time);
    const endTime = convertTimeToMillis(logs[logs.length - 1].time);

    return endTime - startTime;
};

export const convertTimeToMillis = (time: string): number => {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    const milliseconds = hours * 3600000 + minutes * 60000 + seconds * 1000;
    return milliseconds;
};