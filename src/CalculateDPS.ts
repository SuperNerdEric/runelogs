import {Fight} from "./FileParser";
import {DamageMaxMeHitsplats, DamageMeHitsplats} from "./HitsplatNames";

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

    const damageLogs = fight.data.filter(
        (log) =>
            (Object.values(DamageMeHitsplats).includes(log.hitsplatName!) ||
                Object.values(DamageMaxMeHitsplats).includes(log.hitsplatName!)) &&
            log.target === fight.name
    );

    const totalDamage = damageLogs.reduce(
        (sum, log) => sum + (log.damageAmount || 0),
        0
    );

    const dps = totalDamage / timeDiffInSeconds;

    return dps;
}
