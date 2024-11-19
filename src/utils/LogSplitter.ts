import {
    BaseLevelsLog,
    BoostedLevelsLog,
    DamageLog,
    Encounter,
    LogLine,
    LogTypes,
    OverheadLog,
    PlayerEquipmentLog,
    PositionLog,
    PrayerLog,
    TargetChangeLog
} from "../models/LogLine";
import {DamageMaxMeHitsplats, DamageMeHitsplats} from "../HitsplatNames";
import {Fight} from "../models/Fight";
import moment from 'moment';
import {
    BLOOD_MOON_REGION,
    BLUE_MOON_REGION,
    BOSS_NAMES,
    ECLIPSE_MOON_REGION,
    MINION_TO_BOSS,
    MY_BOSS_NAMES,
    NEYPOTZLI_REGION_1,
    NEYPOTZLI_REGION_2,
    NEYPOTZLI_REGION_3,
    PLAYER_HOUSE_REGION_1,
    PLAYER_HOUSE_REGION_2,
    RAID_NAME_REGION_MAPPING,
    WAVE_BASED_REGION_MAPPING
} from "./constants";
import {SECONDS_PER_TICK} from "../models/Constants";
import {Raid} from "../models/Raid";
import {Wave, Waves} from "../models/Waves";


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

export function logSplitter(fightData: LogLine[], progressCallback?: (progress: number) => void): (Encounter)[] {
    const totalLines = fightData.length;
    let parsedLines = 0;

    const fights: Encounter[] = [];
    let logVersion: string = "";
    let currentFight: Fight | null = null;
    let player: string = ""; //todo support multiple players
    let lastDamage: { time: number, index: number } | null = null;
    let baseLevelLogs: { [name: string]: BaseLevelsLog } = {};
    let boostedLevelLogs: { [name: string]: BoostedLevelsLog } = {};
    let prayerLogs: { [name: string]: PrayerLog } = {};
    let overheadLogs: { [name: string]: OverheadLog } = {};
    let playerEquipmentLogs: { [name: string]: PlayerEquipmentLog } = {};
    let positionLogs: { [name: string]: PositionLog } = {};
    let playerRegion: number | undefined;
    let fightStartTime: Date;
    let fightStartTick: number = -1;
    let currentRaid: Raid | null = null;
    let currentWaves: Waves | null = null;
    let currentWave: Wave | null = null;
    let currentWaveStartTick: number = -1;

    const createWave = (name: string, tick: number | undefined): Wave => {
        if (tick !== undefined && tick !== -1) {
            currentWaveStartTick = tick;
        }
        return {name, fights: [], metaData: {name, fights: [], waveLengthTicks: -1, success: false}};
    };

    function endFight(lastLine: LogLine, success: boolean, nullFight: boolean = true) {
        currentFight!.lastLine = lastLine;

        const startFightTimeMs = currentFight!.firstLine.fightTimeMs!;
        // The fight might end because a wave ended, in which case we take the wave end time.
        const endFightTimeMs = currentFight!.lastLine.fightTimeMs;
        const calcWaveFightLength = () => {
            const logDate = moment(`${lastLine.date} ${lastLine.time}`, 'MM-DD-YYYY HH:mm:ss.SSS').toDate();
            return logDate.getTime() - fightStartTime!.getTime();
        }

        const fightLengthMs = (endFightTimeMs) ? endFightTimeMs - startFightTimeMs : calcWaveFightLength();
        currentFight!.metaData = {
            date: currentFight!.firstLine.date,
            fightLengthMs,
            name: currentFight!.name,
            success: success,
            time: currentFight!.firstLine.time
        }

        // If the fight has no damage logs from the player, discard it
        const hasPlayerDamage = currentFight!.data.some((logLine) =>
            logLine.type === LogTypes.DAMAGE && playerAttemptsDamage(logLine)
        );

        if (!hasPlayerDamage) {
            return;
        }

        const raidName = playerRegion ? RAID_NAME_REGION_MAPPING[playerRegion] : null;
        const wavesName = playerRegion ? WAVE_BASED_REGION_MAPPING[playerRegion] : null;
        if (raidName) {
            currentRaid = currentRaid || {name: raidName, fights: []};
            currentRaid.fights.push(currentFight as Fight);
        } else if (wavesName) {
            currentWave = currentWave || createWave(`Wave ${currentFight?.mainEnemyName}`, lastLine.tick);
            currentWaves = currentWaves || {
                name: wavesName,
                waves: [currentWave!],
                metaData: {name: wavesName, waves: [currentWave.metaData]}
            };
            currentWave.fights.push(currentFight as Fight);
        } else {
            fights.push(currentFight as Fight);
        }

        if (nullFight) {
            currentFight = null;
        }
        lastDamage = null;

        // I think Supporting Pillars aren't despawning at the end of Verzik P1, but instead being set to invisible
        // which we aren't checking for, so we need to delete their positions
        for (let positionLogsKey in positionLogs) {
            if (positionLogsKey.startsWith("8379-") || positionLogsKey.startsWith("10840-") || positionLogsKey.startsWith("10857-")) {
                delete positionLogs[positionLogsKey];
            }
        }
    }

    function endWave(lastLine: LogLine, success: boolean) {
        if (!currentWave || !currentWaves) {
            return;
        }
        // flush any existing fights (e.g. healers despawning after jads)
        if (currentFight) {
            endFight(lastLine, true, true);
        }
        currentWave.metaData.waveLengthTicks = lastLine.tick! - currentWaveStartTick;
        currentWave.metaData.success = success;
        currentWaves.waves.push(currentWave);
        currentWave = null;
        currentWaveStartTick = -1;
    }

    for (const logLine of fightData) {
        if (logLine.type === LogTypes.LOG_VERSION) {
            logVersion = logLine.logVersion;
        }

        if (logLine.type === LogTypes.LOGGED_IN_PLAYER) {
            player = logLine.loggedInPlayer;
        }

        if (logLine.type === LogTypes.BASE_LEVELS) {
            const baseLevelsLog = logLine as BaseLevelsLog;
            const playerName = baseLevelsLog.source.name;
            baseLevelLogs[playerName] = baseLevelsLog;
        }

        if (logLine.type === LogTypes.BOOSTED_LEVELS) {
            const boostedLevelsLog = logLine as BoostedLevelsLog;
            const playerName = boostedLevelsLog.source.name;
            boostedLevelLogs[playerName] = boostedLevelsLog;
        }

        if (logLine.type === LogTypes.PRAYER) {
            const prayerLog = logLine as PrayerLog;
            const playerName = prayerLog.source.name;
            prayerLogs[playerName] = prayerLog;
        }

        if (logLine.type === LogTypes.OVERHEAD) {
            const overheadLog = logLine as OverheadLog;
            const playerName = overheadLog.source.name;
            overheadLogs[playerName] = overheadLog;
        }

        if (logLine.type === LogTypes.PLAYER_EQUIPMENT) {
            const playerEquipmentLog = logLine as PlayerEquipmentLog;
            const playerName = playerEquipmentLog.source.name;
            playerEquipmentLogs[playerName] = playerEquipmentLog;
        }

        if (logLine.type === LogTypes.POSITION) {
            const positionLog = logLine as PositionLog;
            if (positionLog.source.id) {
                const key = `${positionLog.source.id}-${positionLog.source.index}`;
                positionLogs[key] = positionLog;
            } else {
                const playerName = positionLog.source.name;
                positionLogs[playerName] = positionLog;
            }
        }

        if (logLine.type === LogTypes.NPC_DESPAWNED) {
            delete positionLogs[`${logLine.source.id}-${logLine.source.index}`];
        }

        if (logLine.type === LogTypes.WAVE_START) {
            const wavesName = playerRegion ? WAVE_BASED_REGION_MAPPING[playerRegion] : null;
            currentWave = createWave(`Wave ${logLine.waveNumber}`, logLine.tick!);
            if (!currentWaves && wavesName) {
                currentWaves = {name: wavesName, waves: [], metaData: {name: wavesName, waves: []}};
            }
        }

        if (logLine.type === LogTypes.WAVE_END) {
            endWave(logLine, true);
        }

        // If there's a gap of over 60 seconds end the current fight
        if (currentFight && lastDamage && moment(`${logLine.date} ${logLine.time}`, 'MM-DD-YYYY HH:mm:ss.SSS').toDate().getTime() - lastDamage.time > 60000) {
            // eslint-disable-next-line no-loop-func
            currentFight.data = currentFight.data.filter((log, index) => index <= lastDamage!.index);
            currentFight.name += " - Incomplete";
            endFight(currentFight.data[currentFight.data.length - 1], false);
        }

        // If the current fight is null, start a new fight
        if (!currentFight && (
            (logLine.type === LogTypes.PLAYER_ATTACK_ANIMATION && logLine.source?.name === player) ||
            (logLine.type === LogTypes.DAMAGE && playerAttemptsDamage(logLine) && logLine.target.name !== player) ||
            (logLine.type === LogTypes.TARGET_CHANGE && bossTargetsMe(player, logLine)) ||
            (logLine.type === LogTypes.TARGET_CHANGE && MY_BOSS_NAMES.includes(logLine.source.name)) ||
            (logLine.type === LogTypes.DAMAGE && MY_BOSS_NAMES.includes(logLine.target.name))
        )) {
            fightStartTime = moment(`${logLine.date} ${logLine.time}`, 'MM-DD-YYYY HH:mm:ss.SSS').toDate();
            if (logLine.tick !== undefined && logLine.tick !== -1) {
                fightStartTick = logLine.tick;
            }
            logLine.fightTimeMs = 0;

            const initialData: LogLine[] = [];

            // Include current base levels at the beginning of the fight
            if (Object.keys(baseLevelLogs).length > 0) {
                const baseLevelLogValues = Object.values(baseLevelLogs);
                for (const baseLevelsLog of baseLevelLogValues) {
                    const newBaseLevelsLog: BaseLevelsLog = {
                        type: LogTypes.BASE_LEVELS,
                        date: logLine.date,
                        tick: fightStartTick,
                        time: logLine.time,
                        timezone: logLine.timezone,
                        fightTimeMs: 0,
                        source: baseLevelsLog.source,
                        baseLevels: baseLevelsLog.baseLevels
                    };
                    initialData.push(newBaseLevelsLog);
                }
            }

            // Include current boosted levels at the beginning of the fight
            if (Object.keys(boostedLevelLogs).length > 0) {
                const boostedLevelLogValues = Object.values(boostedLevelLogs);
                for (const boostedLevelsLog of boostedLevelLogValues) {
                    const newBoostedLevelsLog: BoostedLevelsLog = {
                        type: LogTypes.BOOSTED_LEVELS,
                        date: logLine.date,
                        tick: fightStartTick,
                        time: logLine.time,
                        timezone: logLine.timezone,
                        fightTimeMs: 0,
                        source: boostedLevelsLog.source,
                        boostedLevels: boostedLevelsLog.boostedLevels
                    };
                    initialData.push(newBoostedLevelsLog);
                }
            }

            // Include current prayers at the beginning of the fight
            if (Object.keys(prayerLogs).length > 0) {
                const prayerLogValues = Object.values(prayerLogs);
                for (const prayerLog of prayerLogValues) {
                    const newPrayerLog: PrayerLog = {
                        type: LogTypes.PRAYER,
                        date: logLine.date,
                        tick: fightStartTick,
                        time: logLine.time,
                        timezone: logLine.timezone,
                        fightTimeMs: 0,
                        source: prayerLog.source,
                        prayers: prayerLog.prayers
                    };
                    initialData.push(newPrayerLog);
                }
            }

            // Include current overheads at the beginning of the fight
            if (Object.keys(overheadLogs).length > 0) {
                const overheadLogValues = Object.values(overheadLogs);
                for (const overheadLog of overheadLogValues) {
                    const newOverheadLog: OverheadLog = {
                        type: LogTypes.OVERHEAD,
                        date: logLine.date,
                        tick: fightStartTick,
                        time: logLine.time,
                        timezone: logLine.timezone,
                        fightTimeMs: 0,
                        source: overheadLog.source,
                        overhead: overheadLog.overhead
                    };
                    initialData.push(newOverheadLog);
                }
            }

            // Include current player equipment at the beginning of the fight
            if (Object.keys(playerEquipmentLogs).length > 0) {
                const playerEquipmentLogValues = Object.values(playerEquipmentLogs);
                for (const playerEquipmentLog of playerEquipmentLogValues) {
                    const newPlayerEquipmentLog: PlayerEquipmentLog = {
                        type: LogTypes.PLAYER_EQUIPMENT,
                        date: logLine.date,
                        tick: fightStartTick,
                        time: logLine.time,
                        timezone: logLine.timezone,
                        fightTimeMs: 0,
                        source: playerEquipmentLog.source,
                        playerEquipment: playerEquipmentLog.playerEquipment
                    };
                    initialData.push(newPlayerEquipmentLog);
                }
            }

            // Include current positions at the beginning of the fight
            if (Object.keys(positionLogs).length > 0) {
                const positionLogValues = Object.values(positionLogs);
                for (const positionLog of positionLogValues) {
                    const newPositionLog: PositionLog = {
                        type: LogTypes.POSITION,
                        date: logLine.date,
                        tick: fightStartTick,
                        time: logLine.time,
                        timezone: logLine.timezone,
                        fightTimeMs: 0,
                        source: positionLog.source,
                        position: positionLog.position
                    };
                    initialData.push(newPositionLog);
                }
            }

            // @ts-ignore
            currentFight = {
                name: logLine.target.name,
                mainEnemyName: logLine.target.name,
                isNpc: !!logLine.target.id,
                enemyNames: [logLine.target.name],
                data: [
                    ...initialData,
                    logLine
                ],
                loggedInPlayer: player,
                logVersion: logVersion,
                firstLine: logLine,
                lastLine: logLine
            };

            const boss = MINION_TO_BOSS[logLine.target.name];
            if (boss) {
                currentFight!.name = boss;
                currentFight!.mainEnemyName = boss;
            }

        } else if (currentFight) {
            // Rename the fight if we encounter a boss in the middle of it
            if ("target" in logLine && BOSS_NAMES.includes(logLine.target.name!) && currentFight.name !== logLine.target.name) {
                currentFight.name = logLine.target!.name;
                currentFight.mainEnemyName = logLine.target!.name;
                currentFight.isNpc = !!logLine.target.id;
            }
            // Add target to list of enemies
            if (logLine.type === LogTypes.DAMAGE && playerAttemptsDamage(logLine) && logLine.target.name !== player && !currentFight.enemyNames.includes(logLine.target.name!)) {
                currentFight.enemyNames.push(logLine.target!.name);
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
                if (logLine.target.name === currentFight.name) {
                    endFight(logLine, true);
                } else if (logLine.target.name === currentFight.loggedInPlayer) {
                    endFight(logLine, false);
                    // end wave if player dies
                    endWave(logLine, false);
                }
            }
        }

        if (logLine.type === LogTypes.PLAYER_REGION) {
            // If the player goes to their house region, end the current fight
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

            if (currentRaid) {
                const raidName = playerRegion ? RAID_NAME_REGION_MAPPING[logLine.playerRegion] : null;

                // If we were in a raid and left it, end the current raid and the current fight
                if (!raidName) {
                    if (currentFight) {
                        endFight(logLine, false);
                    }
                    fights.push(currentRaid);
                    currentRaid = null;
                }
            }
            if (currentWaves) {
                // assume success if region changes, although if someone teleports out of the waves...
                endWave(logLine, true);
                fights.push(currentWaves);
                currentWaves = null;
            }

            playerRegion = logLine.playerRegion;
        }

        parsedLines++;
        if (progressCallback && parsedLines % 200 === 0) {
            const progress = 30 + (parsedLines / totalLines) * 70;
            progressCallback(progress);
        }
    }

    // If we reach the end of the logs, end the current fight
    if (currentFight) {
        endFight(currentFight.data[currentFight.data.length - 1], false, false);
        endWave(currentFight.data[currentFight.data.length - 1], false);
    }

    const fightNameCounts: Map<string, number> = new Map(); // Map to store counts of each fight name

    // Make fight names unique
    fights.forEach((fight) => {
        const count = (fightNameCounts.get(fight.name) || 0) + 1;
        fightNameCounts.set(fight.name, count);
        fight.name = `${fight.name} - ${count}`;
    });

    return fights;
}
