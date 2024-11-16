import {isMine, logSplitter} from "./LogSplitter";
import {Encounter, LogLine, LogTypes} from "../models/LogLine";
import {getActor} from "./utils";
import {Actor} from "../models/Actor";
import * as semver from 'semver';

export const parseLogLine = (logLine: string, player?: string, logVersion?: string): LogLine | null => {
    const TICK_PATTERN = '\\b\\d+\\b';
    const DATE_PATTERN = '\\d{2}-\\d{2}-\\d{4}';
    const TIME_PATTERN = '\\d{2}:\\d{2}:\\d{2}\\.\\d{3}';
    const TIMEZONE_PATTERN = '\\w+';
    const ANYTHING_PATTERN = '.*';
    const ANYTHING_BUT_TAB_PATTERN = '[^\\t]*';

    const pattern = new RegExp(`^(${DATE_PATTERN}) (${TIME_PATTERN}) (${TIMEZONE_PATTERN})\t(${ANYTHING_PATTERN})`);

    const NEW_TIME_PATTERN = '\\d{2}:\\d{2}:\\d{2}';
    const newPattern = new RegExp(`^(${TICK_PATTERN}) (${DATE_PATTERN}) (${NEW_TIME_PATTERN})\t(${ANYTHING_PATTERN})`);

    let match = logLine.match(pattern);
    let date = "";
    let time = "";
    let timezone = "";
    let action = "";
    let tick = -1;

    if (!match) {
        match = logLine.match(newPattern);
        if (match) {
            tick = Number(match[1]);
            date = match[2];
            time = match[3];
            action = match[4];
        } else {
            console.error('Invalid log line format:', logLine);
            return null;
        }
    } else {
        [, date, time, timezone, action] = match;
    }

    let logVersionPattern = new RegExp(`Log Version (${ANYTHING_PATTERN})`);
    match = action.match(logVersionPattern);
    if (match) {
        const [, logVersion] = match;
        console.log(`Log Version ${logVersion}`);
        return {
            type: LogTypes.LOG_VERSION,
            date,
            time,
            timezone,
            logVersion,
            tick
        };
    }

    const loggedInPlayerPattern = new RegExp(`Logged in player is (${ANYTHING_PATTERN})`);
    match = action.match(loggedInPlayerPattern);
    if (match) {
        const [, loggedInPlayer] = match;
        return {
            type: LogTypes.LOGGED_IN_PLAYER,
            date,
            time,
            timezone,
            tick,
            loggedInPlayer
        };
    }

    const playerRegionPattern = new RegExp(`Player region (${ANYTHING_PATTERN})`);
    match = action.match(playerRegionPattern);
    if (match) {
        const [, playerRegion] = match;
        return {
            type: LogTypes.PLAYER_REGION,
            date,
            time,
            timezone,
            tick,
            playerRegion: Number(playerRegion)
        };
    }

    const boostedLevelsPattern = new RegExp(`Boosted levels are \\[(\\d+), (\\d+), (\\d+), (\\d+), (\\d+), (\\d+), (\\d+)\\]`);
    match = action.match(boostedLevelsPattern);
    if (match) {
        const [, attack, strength, defence, ranged, magic, hitpoints, prayer] = match.map(Number);

        return {
            type: LogTypes.BOOSTED_LEVELS,
            date,
            time,
            timezone,
            tick,
            boostedLevels: {
                attack,
                strength,
                defence,
                ranged,
                magic,
                hitpoints,
                prayer
            }
        };
    }

    const playerEquipmentPattern = new RegExp(`Player equipment is (${ANYTHING_PATTERN})`);
    match = action.match(playerEquipmentPattern);
    if (match) {
        const [, equpimentString] = match;
        const playerEquipment: string[] = JSON.parse(equpimentString).map((item: number) => item.toString());
        return {
            type: LogTypes.PLAYER_EQUIPMENT,
            date,
            time,
            timezone,
            tick,
            playerEquipment
        };
    }

    const diesPattern = new RegExp(`^(${ANYTHING_PATTERN}) dies`);
    match = action.match(diesPattern);
    if (match) {
        let [, target] = match;
        return {
            type: LogTypes.DEATH,
            date,
            time,
            timezone,
            tick,
            target: getActor(target),
        };
    }

    const changedTargetPattern = new RegExp(`^(${ANYTHING_PATTERN}) changes target to (${ANYTHING_PATTERN})`);
    match = action.match(changedTargetPattern);
    if (match) {
        let [, source, target] = match;
        return {
            type: LogTypes.TARGET_CHANGE,
            date,
            time,
            timezone,
            tick,
            source: getActor(source),
            target: getActor(target),
        };
    }

    const infernoWaveStartedPattern = new RegExp(`<col=${ANYTHING_PATTERN}>Wave: (${ANYTHING_PATTERN})</col>`);
    match = action.match(infernoWaveStartedPattern);
    if (match) {
        let [, wave] = match;
        return {
            type: LogTypes.WAVE_START,
            date,
            time,
            timezone,
            tick,
            waveNumber: parseInt(wave, 10),
        };
    }

    const infernoWaveEndedPattern = new RegExp(`Wave completed!`);
    match = action.match(infernoWaveEndedPattern);
    if (match) {
        return {
            type: LogTypes.WAVE_END,
            date,
            time,
            timezone,
            tick,
        };
    }

    if (logVersion && semver.gte(logVersion, "1.1.2")) {
        const playerAttackAnimationPattern = new RegExp(`^(${ANYTHING_PATTERN}) attack animation (${ANYTHING_BUT_TAB_PATTERN})\t(${ANYTHING_BUT_TAB_PATTERN})`);
        match = action.match(playerAttackAnimationPattern);
        if (match) {
            let [, source, animationId, target] = match;
            return {
                type: LogTypes.PLAYER_ATTACK_ANIMATION,
                date,
                time,
                timezone,
                tick,
                animationId: parseInt(animationId, 10),
                source: getActor(source),
                target: getActor(target),
            };
        }
    } else {
        const playerAttackAnimationPattern = new RegExp(`Player attack animation\t(${ANYTHING_BUT_TAB_PATTERN})\t(${ANYTHING_BUT_TAB_PATTERN})`);
        match = action.match(playerAttackAnimationPattern);
        if (match) {
            let [, animationId, target] = match;
            return {
                type: LogTypes.PLAYER_ATTACK_ANIMATION,
                date,
                time,
                timezone,
                tick,
                animationId: parseInt(animationId, 10),
                target: getActor(target),
            };
        }
    }

    if (logVersion && semver.gte(logVersion, "1.3.0")) {
        const positionLogPattern = new RegExp(`(${ANYTHING_BUT_TAB_PATTERN})\tPOSITION\t\\((\\d+), (\\d+), (\\d+)\\)$`);

        match = action.match(positionLogPattern);
        if (match) {
            const [, actorName, x, y, plane] = match;
            return {
                type: LogTypes.POSITION,
                date,
                time,
                timezone,
                tick,
                source: getActor(actorName),
                position: {
                    x: parseInt(x, 10),
                    y: parseInt(y, 10),
                    plane: parseInt(plane, 10),
                },
            };
        }
    } else {
        const positionLogPattern = new RegExp(`(${ANYTHING_BUT_TAB_PATTERN}) position \\((\\d+), (\\d+), (\\d+)\\)$`);

        match = action.match(positionLogPattern);
        if (match) {
            const [, playerName, x, y, plane] = match;
            return {
                type: LogTypes.POSITION,
                date,
                time,
                timezone,
                tick,
                source: getActor(playerName),
                position: {
                    x: parseInt(x, 10),
                    y: parseInt(y, 10),
                    plane: parseInt(plane, 10),
                },
            };
        }
    }

    const despawnedPattern = new RegExp(`^(${ANYTHING_BUT_TAB_PATTERN})\tDESPAWNED$`);
    match = action.match(despawnedPattern);
    if (match) {
        let [, target] = match;
        return {
            type: LogTypes.NPC_DESPAWNED,
            date,
            time,
            timezone,
            tick,
            source: getActor(target),
        };
    }

    if (logVersion && semver.gte(logVersion, "1.1.0")) {
        const defaultPattern = new RegExp(`^(${ANYTHING_BUT_TAB_PATTERN})\t(${ANYTHING_BUT_TAB_PATTERN})\t(${ANYTHING_BUT_TAB_PATTERN})\t(${ANYTHING_BUT_TAB_PATTERN})`);

        match = action.match(defaultPattern);
        if (!match) {
            console.error('Invalid log line format:', logLine);
            return null;
        }
        let [, sourceString, hitsplatName, target, amount] = match;
        let source: Actor = {name: sourceString};
        if (hitsplatName === "HEAL") {
            return {
                type: LogTypes.HEAL,
                date,
                time,
                timezone,
                tick,
                source,
                target: getActor(target),
                hitsplatName,
                healAmount: parseInt(amount, 10),
            }
        }
        return {
            type: LogTypes.DAMAGE,
            date,
            time,
            timezone,
            tick,
            source,
            target: getActor(target),
            hitsplatName,
            damageAmount: parseInt(amount, 10),
        };
    } else {
        const defaultPattern = new RegExp(`^(${ANYTHING_BUT_TAB_PATTERN})\t(${ANYTHING_BUT_TAB_PATTERN})\t(${ANYTHING_BUT_TAB_PATTERN})`);

        match = action.match(defaultPattern);
        if (!match) {
            console.error('Invalid log line format:', logLine);
            return null;
        }
        let [, target, hitsplatName, amount] = match;
        let source: Actor = {name: "Unknown"};
        if (player && target !== player && isMine(hitsplatName)) {
            source = {name: player};
        }
        if (hitsplatName === "HEAL") {
            return {
                type: LogTypes.HEAL,
                date,
                time,
                timezone,
                tick,
                source,
                target: getActor(target),
                hitsplatName,
                healAmount: parseInt(amount, 10),
            }
        }
        return {
            type: LogTypes.DAMAGE,
            date,
            time,
            timezone,
            tick,
            source,
            target: getActor(target),
            hitsplatName,
            damageAmount: parseInt(amount, 10),
        };
    }
};

export function parseFileContent(fileContent: string, progressCallback: (progress: number) => void): (Encounter)[] | null {
    try {
        const lines = fileContent.split('\n');
        let parsedLines = 0;
        let fightData: LogLine[] = [];
        let loggedInPlayer = "";
        let logVersion: string = "";

        for (const line of lines) {
            const logLine = parseLogLine(line.trim(), loggedInPlayer, logVersion);

            if (logLine) {
                fightData.push(logLine);
                if (logLine.type === LogTypes.LOGGED_IN_PLAYER) {
                    loggedInPlayer = logLine.loggedInPlayer;
                }
                if (logLine.type === LogTypes.LOG_VERSION) {
                    logVersion = logLine.logVersion;
                }
            }

            parsedLines++;
            if (progressCallback && parsedLines % 200 === 0) {
                const progress = (parsedLines / lines.length) * 30;
                progressCallback(progress);
            }
        }

        let fights: (Encounter)[] = logSplitter(fightData, progressCallback);

        return fights;
    } catch (error) {
        console.error('Error parsing file content:', error);
        return null;
    }
}

