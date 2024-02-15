import {Fight} from "./models/Fight";

export function calculateDPS(fight: Fight): number {
    const startTime = fight.data[0]?.date + ' ' + fight.data[0]?.time;
    const endTime = fight.data[fight.data.length - 1]?.date + ' ' + fight.data[fight.data.length - 1]?.time;

    if (!startTime || !endTime) {
        return 0;
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    // Calculate the time difference in seconds
    const timeDiffInSeconds = (endDate.getTime() - startDate.getTime()) / 1000;

    const totalDamage = fight.data.reduce(
        (sum, log) => sum + (log.damageAmount || 0),
        0
    );

    const dps = totalDamage / timeDiffInSeconds;

    return dps;
}
