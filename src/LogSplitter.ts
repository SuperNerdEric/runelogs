import { Fight, LogLine } from "./FileParser";
import {DamageMaxMeHitsplats, DamageMeHitsplats} from "./HitsplatNames";
import {PLAYER_NAME} from "./components/App";
import {convertTimeToMillis} from "./components/charts/DPSChart";

const BOSS_NAMES = [
    "Scurrius"
];

function doesAttemptDamage(log: LogLine) {
    return Object.values(DamageMeHitsplats).includes(log.hitsplatName!) ||
        Object.values(DamageMaxMeHitsplats).includes(log.hitsplatName!) ||
        log.hitsplatName === 'BLOCK_ME';
}

export function logSplitter(fightData: LogLine[]): Fight[] {
    const fights: Fight[] = [];
    let currentFight: Fight | null = null;

    for (const logLine of fightData) {

        // If there's a gap of over 60 seconds end the fight
        if (currentFight && convertTimeToMillis(logLine.time) - convertTimeToMillis(currentFight.data[currentFight.data.length - 1].time) > 60000) {
            currentFight.name += " - Incomplete";
            fights.push(currentFight);
            currentFight = null;
        }

        // If the current fight is null, start a new fight
        if (!currentFight && doesAttemptDamage(logLine) && logLine.target !== PLAYER_NAME) {
            currentFight = {
                name: logLine.target,
                data: [logLine],
            };
        } else if(currentFight) {
            // Rename the fight if we encounter a boss in the middle of it
            if(BOSS_NAMES.includes(logLine.target) && currentFight.name !== logLine.target){
                currentFight.name = logLine.target;
            }
            currentFight.data.push(logLine);
        }

        if (logLine.target && logLine.hitsplatName === "DEATH") {
            // If the fight name dies, end the current fight
            if (currentFight && logLine.target === currentFight.name) {
                fights.push(currentFight);
                currentFight = null;
            }
        }
    }

    if(currentFight){
        fights.push(currentFight);
    }

    // Filter out fights with no damage
    return fights.filter((fight) => fight.data.some((log) =>
        doesAttemptDamage(log)
    ));
}
