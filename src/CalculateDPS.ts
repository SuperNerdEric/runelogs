import {Fight} from "./models/Fight";
import {filterByType, LogTypes} from "./models/LogLine";

export function calculateDPS(fight: Fight): number {
    // Calculate the time difference in seconds
    const timeDiffInSeconds = (fight.lastLine.fightTimeMs! - fight.firstLine.fightTimeMs!) / 1000;

    const filteredLogs = filterByType(fight.data, LogTypes.DAMAGE);
    const totalDamage = filteredLogs.reduce(
        (sum, log) => sum + (log.damageAmount),
        0
    );

    const dps = totalDamage / timeDiffInSeconds;

    return dps;
}
