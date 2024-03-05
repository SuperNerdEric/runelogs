import {logSplitter} from "./LogSplitter";
import {Fight} from "../models/Fight";
import {LogLine, LogTypes} from "../models/LogLine";

export const parseLogLine = (logLine: string): LogLine | null => {
    const DATE_PATTERN = '\\d{2}-\\d{2}-\\d{4}';
    const TIME_PATTERN = '\\d{2}:\\d{2}:\\d{2}\\.\\d{3}';
    const TIMEZONE_PATTERN = '\\w+';
    const ANYTHING_PATTERN = '.*';
    const ANYTHING_BUT_TAB_PATTERN = '[^\\t]*';

    const pattern = new RegExp(`^(${DATE_PATTERN}) (${TIME_PATTERN}) (${TIMEZONE_PATTERN})\t(${ANYTHING_PATTERN})`);

    let match = logLine.match(pattern);

    if (!match) {
        console.error('Invalid log line format:', logLine);
        return null;
    }
    const [, date, time, timezone, action] = match;


    const logVersionPattern = new RegExp(`Log Version (${ANYTHING_PATTERN})`);
    match = action.match(logVersionPattern);
    if (match) {
        const [, logVersion] = match;
        console.log(`Log Version ${logVersion}`);
        return {
            type: LogTypes.LOG_VERSION,
            date,
            time,
            timezone,
            logVersion
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
            loggedInPlayer
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
            playerEquipment
        };
    }

    const diesPattern = new RegExp(`^(${ANYTHING_PATTERN}) dies`);
    match = action.match(diesPattern);
    if (match) {
        const [, target] = match;
        return {
            type: LogTypes.DEATH,
            date,
            time,
            timezone,
            target,
        };
    }

    const changedTargetPattern = new RegExp(`^(${ANYTHING_PATTERN}) changes target to (${ANYTHING_PATTERN})`);
    match = action.match(changedTargetPattern);
    if (match) {
        const [, source, target] = match;
        return {
            type: LogTypes.TARGET_CHANGE,
            date,
            time,
            timezone,
            source,
            target
        };
    }

    const playerAttackAnimationPattern = new RegExp(`Player attack animation\t(${ANYTHING_BUT_TAB_PATTERN})\t(${ANYTHING_BUT_TAB_PATTERN})`);
    match = action.match(playerAttackAnimationPattern);
    if (match) {
        const [, animationId, target] = match;
        return {
            type: LogTypes.PLAYER_ATTACK_ANIMATION,
            date,
            time,
            timezone,
            animationId: parseInt(animationId, 10),
            target,
        };
    }

    const playerStoppedBlowpipingPattern = new RegExp(`Player stopped blowpiping`);
    match = action.match(playerStoppedBlowpipingPattern);
    if (match) {
        return {
            type: LogTypes.STOPPED_BLOWPIPING,
            date,
            time,
            timezone,
        };
    }

    const defaultPattern = new RegExp(`^(${ANYTHING_BUT_TAB_PATTERN})\t(${ANYTHING_BUT_TAB_PATTERN})\t(${ANYTHING_BUT_TAB_PATTERN})`);

    match = action.match(defaultPattern);
    if (!match) {
        console.error('Invalid log line format:', logLine);
        return null;
    }
    const [, target, hitsplatName, damageAmount] = match;

    return {
        type: LogTypes.DAMAGE,
        date,
        time,
        timezone,
        target,
        hitsplatName,
        damageAmount: parseInt(damageAmount, 10),
    };
};

export function parseFileContent(fileContent: string, progressCallback: (progress: number) => void): Fight[] | null {
    try {
        const lines = fileContent.split('\n');
        let parsedLines = 0;
        let fightData: LogLine[] = [];

        for (const line of lines) {
            const logLine = parseLogLine(line.trim());

            if (logLine) {
                fightData.push(logLine);
            }

            parsedLines++;
            if (progressCallback && parsedLines % 200 === 0) {
                const progress = (parsedLines / lines.length) * 50;
                progressCallback(progress);
            }
        }

        let fights: Fight[] = logSplitter(fightData, progressCallback);

        return fights;
    } catch (error) {
        console.error('Error parsing file content:', error);
        return null;
    }
}

