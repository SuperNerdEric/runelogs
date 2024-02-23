import {Fight} from "./models/Fight";
import {filterByType, LogTypes} from "./models/LogLine";

export function calculateDPS(fight: Fight): number {
    const startTime = fight.data[0]?.date + ' ' + fight.data[0]?.fightTime;
    const endTime = fight.data[fight.data.length - 1]?.date + ' ' + fight.data[fight.data.length - 1]?.fightTime;

    if (!startTime || !endTime) {
        return 0;
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    // Calculate the time difference in seconds
    const timeDiffInSeconds = (endDate.getTime() - startDate.getTime()) / 1000;

    const filteredLogs = filterByType(fight.data, LogTypes.DAMAGE);
    const totalDamage = filteredLogs.reduce(
        (sum, log) => sum + (log.damageAmount),
        0
    );

    const dps = totalDamage / timeDiffInSeconds;

    return dps;
}
