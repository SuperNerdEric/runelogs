import {Fight, LogLine} from "./FileParser";
import {DamageMaxMeHitsplats, DamageMeHitsplats} from "./HitsplatNames";
import {convertTimeToMillis} from "./components/charts/DPSChart";

const BOSS_NAMES = [
    "Scurrius",
    "Kree'arra",
    "Commander Zilyana",
    "General Graardor",
    "K'ril Tsutsaroth",
    "Nex",
    "Kalphite Queen",
    "Sarachnis",
    "Scorpia",
    "Abyssal Sire"
];

function doesAttemptDamage(log: LogLine) {
    return Object.values(DamageMeHitsplats).includes(log.hitsplatName!) ||
        Object.values(DamageMaxMeHitsplats).includes(log.hitsplatName!) ||
        log.hitsplatName === 'BLOCK_ME';
}

export function logSplitter(fightData: LogLine[], progressCallback?: (progress: number) => void): Fight[] {
    const totalLines = fightData.length;
    let parsedLines = 0;

    const fights: Fight[] = [];
    let currentFight: Fight | null = null;
    let player: string = ""; //todo support multiple players
    let lastDamage: { time: string, index: number } | null = null;

    for (const logLine of fightData) {
        if (logLine.loggedInPlayer) {
            player = logLine.loggedInPlayer;
        }

        // If there's a gap of over 60 seconds end the fight
        if (currentFight && lastDamage && convertTimeToMillis(logLine.time) - convertTimeToMillis(lastDamage.time) > 60000) {
            // eslint-disable-next-line no-loop-func
            currentFight.data = currentFight.data.filter((log, index) => index <= lastDamage!.index);
            currentFight.name += " - Incomplete";
            fights.push(currentFight);
            currentFight = null;
            lastDamage = null;

            // todo Right now I'm not supporting noncombat events at all
            // But when I do I need to remember that any noncombat events after incomplete fight need to be carried forward to the next fight
        }

        if (currentFight && doesAttemptDamage(logLine)) {
            lastDamage = {
                time: logLine.time,
                index: currentFight.data.length - 1
            };
        }

        // If the current fight is null, start a new fight
        if (!currentFight && doesAttemptDamage(logLine) && logLine.target !== player) {
            currentFight = {
                name: logLine.target!,
                enemies: [logLine.target!],
                data: [logLine],
                loggedInPlayer: player,
            };
        } else if (currentFight) {
            // Rename the fight if we encounter a boss in the middle of it
            if (BOSS_NAMES.includes(logLine.target!) && currentFight.name !== logLine.target) {
                currentFight.name = logLine.target!;
            }
            // Add target to list of enemies
            if (doesAttemptDamage(logLine) && logLine.target !== player && !currentFight.enemies.includes(logLine.target!)) {
                currentFight.enemies.push(logLine.target!);
            }
            currentFight.data.push(logLine);
        }

        if (logLine.target && logLine.hitsplatName === "DEATH") {
            // If the fight name dies, end the current fight
            if (currentFight && (logLine.target === currentFight.name || logLine.target === currentFight.loggedInPlayer)) {
                fights.push(currentFight);
                currentFight = null;
            }
        }

        parsedLines++;
        if (progressCallback && parsedLines % 200 === 0) {
            const progress = 50 + (parsedLines / totalLines) * 50;
            progressCallback(progress);
        }
    }

    if (currentFight) {
        fights.push(currentFight);
    }

    // Filter out fights with no damage
    return fights.filter((fight) => fight.data.some((log) =>
        doesAttemptDamage(log)
    ));
}
