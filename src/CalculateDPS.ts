import {Fight} from "./FileParser";

export function calculateDPS(fight: Fight): number {
    const startTime = fight.data[0]?.date + ' ' + fight.data[0]?.time;
    const endTime = fight.data[fight.data.length - 1]?.date + ' ' + fight.data[fight.data.length - 1]?.time;

    if (!startTime || !endTime) {
        // Invalid data or empty fight
        return 0;
    }

    // Convert date and time strings to Date objects
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    // Calculate the time difference in seconds
    const timeDiffInSeconds = (endDate.getTime() - startDate.getTime()) / 1000;

    // Filter log lines with hitsplatName DAMAGE_ME or DAMAGE_MAX_ME
    const damageLogs = fight.data.filter(
        (log) =>
            log.hitsplatName === 'DAMAGE_ME' || log.hitsplatName === 'DAMAGE_MAX_ME'
    );

    // Calculate total damage
    const totalDamage = damageLogs.reduce(
        (sum, log) => sum + (log.damageAmount || 0),
        0
    );

    // Calculate DPS
    const dps = totalDamage / timeDiffInSeconds;

    return dps;
}
