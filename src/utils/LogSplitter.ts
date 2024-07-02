import {DamageLog, LogLine, LogTypes, TargetChangeLog} from "../models/LogLine";
import {DamageMaxMeHitsplats, DamageMeHitsplats} from "../HitsplatNames";
import {Fight} from "../models/Fight";
import {BoostedLevels} from "../models/BoostedLevels";
import moment from 'moment';
import {
    BLOOD_MOON_REGION,
    BLUE_MOON_REGION,
    BOSS_NAMES,
    ECLIPSE_MOON_REGION,
    NEYPOTZLI_REGION_1, NEYPOTZLI_REGION_2, NEYPOTZLI_REGION_3,
    PLAYER_HOUSE_REGION_1,
    PLAYER_HOUSE_REGION_2
} from "./constants";
import {SECONDS_PER_TICK} from "../models/Constants";


export function isMine(hitsplatName: string) {
    return Object.values(DamageMeHitsplats).includes(hitsplatName) ||
        Object.values(DamageMaxMeHitsplats).includes(hitsplatName) ||
        hitsplatName === 'BLOCK_ME';
}

/**
 * If it is the logged in player that dealt/attempted the damage
 */
function playerAttemptsDamage(log: DamageLog) {
    return isMine(log.hitsplatName!);
}

/**
 * If a boss targets the logged in player
 */
function bossTargetsMe(player: string, log: TargetChangeLog) {
    return log.target.name === player && BOSS_NAMES.includes(log.source.name);
}

export function logSplitter(fightData: LogLine[], progressCallback?: (progress: number) => void): Fight[] {
    const totalLines = fightData.length;
    let parsedLines = 0;

    const fights: Fight[] = [];
    let currentFight: Fight | null = null;
    let player: string = ""; //todo support multiple players
    let lastDamage: { time: number, index: number } | null = null;
    let boostedLevels: BoostedLevels | undefined;
    let playerEquipment: string[] | undefined;
    let playerRegion: number | undefined;
    let fightStartTime: Date;
    let fightStartTick: number = -1;

    function endFight(lastLine: LogLine, success: boolean, nullFight: boolean = true) {
        currentFight!.lastLine = lastLine;

        currentFight!.metaData = {
            date: currentFight!.firstLine.date,
            fightLengthMs: currentFight!.lastLine.fightTimeMs! - currentFight!.firstLine.fightTimeMs!,
            name: currentFight!.fightTitle,
            success: success,
            time: currentFight!.firstLine.time
        }
        fights.push(currentFight!);
        if (nullFight) {
            currentFight = null;
        }
        lastDamage = null;
    }

    for (const logLine of fightData) {
        if (logLine.type === LogTypes.LOGGED_IN_PLAYER) {
            player = logLine.loggedInPlayer;
        }

        if (logLine.type === LogTypes.BOOSTED_LEVELS) {
            boostedLevels = logLine.boostedLevels;
        }

        if (logLine.type === LogTypes.PLAYER_EQUIPMENT) {
            playerEquipment = logLine.playerEquipment;
        }

        // If there's a gap of over 60 seconds end the current fight
        if (currentFight && lastDamage && moment(`${logLine.date} ${logLine.time}`, 'MM-DD-YYYY HH:mm:ss.SSS').toDate().getTime() - lastDamage.time > 60000) {
            // eslint-disable-next-line no-loop-func
            currentFight.data = currentFight.data.filter((log, index) => index <= lastDamage!.index);
            currentFight.fightTitle += " - Incomplete";
            endFight(currentFight.data[currentFight.data.length - 1], false);
        }

        // If the current fight is null, start a new fight
        if (!currentFight && (
            logLine.type === LogTypes.PLAYER_ATTACK_ANIMATION ||
            (logLine.type === LogTypes.DAMAGE && playerAttemptsDamage(logLine) && logLine.target.name !== player) ||
            (logLine.type === LogTypes.TARGET_CHANGE && bossTargetsMe(player, logLine))
        )) {
            fightStartTime = moment(`${logLine.date} ${logLine.time}`, 'MM-DD-YYYY HH:mm:ss.SSS').toDate();
            if (logLine.tick !== undefined && logLine.tick !== -1) {
                fightStartTick = logLine.tick;
            }
            logLine.fightTimeMs = 0;

            const initialData: LogLine[] = [];

            // Include current boosted levels at the beginning of the fight
            if (boostedLevels) {
                initialData.push({
                    type: LogTypes.BOOSTED_LEVELS,
                    date: logLine.date,
                    time: logLine.time,
                    timezone: logLine.timezone,
                    boostedLevels: boostedLevels,
                    fightTimeMs: 0
                });
            }

            // Include current player equipment at the beginning of the fight
            if (playerEquipment) {
                initialData.push({
                    type: LogTypes.PLAYER_EQUIPMENT,
                    date: logLine.date,
                    time: logLine.time,
                    timezone: logLine.timezone,
                    playerEquipment: playerEquipment,
                    fightTimeMs: 0
                });
            }

            currentFight = {
                fightTitle: logLine.target.name,
                mainEnemyName: logLine.target.name,
                isNpc: !!logLine.target.id,
                enemies: [logLine.target.name],
                data: [
                    ...initialData,
                    logLine
                ],
                loggedInPlayer: player,
                firstLine: logLine,
                lastLine: logLine
            };
        } else if (currentFight) {
            // Rename the fight if we encounter a boss in the middle of it
            if ("target" in logLine && BOSS_NAMES.includes(logLine.target.name!) && currentFight.fightTitle !== logLine.target.name) {
                currentFight.fightTitle = logLine.target!.name;
                currentFight.mainEnemyName = logLine.target!.name;
                currentFight.isNpc = !!logLine.target.id;
            }
            // Add target to list of enemies
            if (logLine.type === LogTypes.DAMAGE && playerAttemptsDamage(logLine) && logLine.target.name !== player && !currentFight.enemies.includes(logLine.target.name!)) {
                currentFight.enemies.push(logLine.target!.name);
            }

            // Subtract the start time from the log's timestamp to get the relative time within the fight
            const logDate = moment(`${logLine.date} ${logLine.time}`, 'MM-DD-YYYY HH:mm:ss.SSS').toDate();
            logLine.fightTimeMs = logDate.getTime() - fightStartTime!.getTime();

            if (fightStartTick !== -1 && logLine.tick && logLine.tick !== -1) {
                const tickDifference = logLine.tick - fightStartTick;
                logLine.fightTimeMs = Math.round(tickDifference * SECONDS_PER_TICK * 10000) / 10;
            }
            currentFight.data.push(logLine);
        }

        if (currentFight && logLine.type === LogTypes.DAMAGE && playerAttemptsDamage(logLine)) {
            lastDamage = {
                time: moment(`${logLine.date} ${logLine.time}`, 'MM-DD-YYYY HH:mm:ss.SSS').toDate().getTime(),
                index: currentFight.data.length - 1
            };
        }

        if (logLine.type === LogTypes.DEATH && logLine.target) {
            // If the player or the fight name dies, end the current fight
            if (currentFight) {
                if (logLine.target.name === currentFight.fightTitle) {
                    endFight(logLine, true);
                } else if (logLine.target.name === currentFight.loggedInPlayer) {
                    endFight(logLine, false);
                }
            }
        }

        // If the player goes to their house region, end the current fight
        if (logLine.type === LogTypes.PLAYER_REGION) {
            if (logLine.playerRegion === PLAYER_HOUSE_REGION_1 || logLine.playerRegion === PLAYER_HOUSE_REGION_2) {
                if (currentFight) {
                    endFight(logLine, false);
                }
            }
            if (logLine.playerRegion === BLOOD_MOON_REGION || logLine.playerRegion === BLUE_MOON_REGION || logLine.playerRegion === ECLIPSE_MOON_REGION) {
                if (currentFight) {
                    endFight(logLine, false);
                }
            }
            if (playerRegion && (playerRegion === BLOOD_MOON_REGION || playerRegion === BLUE_MOON_REGION || playerRegion === ECLIPSE_MOON_REGION)) {
                if (logLine.playerRegion === NEYPOTZLI_REGION_1 || logLine.playerRegion === NEYPOTZLI_REGION_2 || logLine.playerRegion === NEYPOTZLI_REGION_3) {
                    // We left one of the boss rooms into the Neypotzli region, assume we beat the boss
                    if (currentFight) {
                        endFight(logLine, true);
                    }
                }
            }
            playerRegion = logLine.playerRegion;
        }

        parsedLines++;
        if (progressCallback && parsedLines % 200 === 0) {
            const progress = 50 + (parsedLines / totalLines) * 50;
            progressCallback(progress);
        }
    }

    // If we reach the end of the logs, end the current fight
    if (currentFight) {
        endFight(currentFight.data[currentFight.data.length - 1], false, false);
    }

    const fightNameCounts: Map<string, number> = new Map(); // Map to store counts of each fight name

    const filteredFights = fights.filter((fight) => {
        // If the fight has no damage logs from the player, discard it
        const hasPlayerDamage = fight.data.some((logLine) =>
            logLine.type === LogTypes.DAMAGE && playerAttemptsDamage(logLine)
        );
        if (!hasPlayerDamage) {
            return false;
        }

        // Make fight names unique
        let count = 1;
        if (fightNameCounts.has(fight.fightTitle)) {
            count = fightNameCounts.get(fight.fightTitle)! + 1;
        }
        fightNameCounts.set(fight.fightTitle, count);
        fight.fightTitle = `${fight.fightTitle} - ${count}`;

        return true;
    });

    return filteredFights;
}
