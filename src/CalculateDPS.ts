import {Fight} from "./models/Fight";
import {filterByType, LogTypes} from "./models/LogLine";
import {convertTimeToMillis} from "./utils/utils";

export function calculateDPS(fight: Fight): number {
    const startTime = convertTimeToMillis(fight.firstLine.fightTime!);
    const endTime = convertTimeToMillis(fight.lastLine.fightTime!);

    // Calculate the time difference in seconds
    const timeDiffInSeconds = (endTime - startTime) / 1000;

    const filteredLogs = filterByType(fight.data, LogTypes.DAMAGE);
    const totalDamage = filteredLogs.reduce(
        (sum, log) => sum + (log.damageAmount),
        0
    );

    const dps = totalDamage / timeDiffInSeconds;

    return dps;
}
