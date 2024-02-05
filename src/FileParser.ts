export interface Fight {
    name: string;
    data: LogLine[];
}

export interface LogLine {
    date: string;
    time: string;
    timezone: string;
    target: string;
    hitsplatName?: string;
    damageAmount?: number;
    source?: string;
}

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

    const diesPattern = new RegExp(`^(${ANYTHING_PATTERN}) dies`)
    match = action.match(diesPattern);
    if(match) {
        const [, target] = match;
        return {
            date,
            time,
            timezone,
            target,
            hitsplatName: "DEATH",
        };
    }

    const changedTargetPattern = new RegExp(`^(${ANYTHING_PATTERN}) changes target to (${ANYTHING_PATTERN})`)
    match = action.match(changedTargetPattern);
    if(match) {
        const [, source, target] = match;
        return {
            date,
            time,
            timezone,
            source,
            target,
            hitsplatName: "CHANGE_TARGET",
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
        date,
        time,
        timezone,
        target,
        hitsplatName,
        damageAmount: parseInt(damageAmount, 10),
    };
};

export function parseFileContent(fileContent: string): Fight[] | null {
    try {
        const lines = fileContent.split('\n');
        let fightData: LogLine[] = [];
        const fights: Fight[] = [];

        for (const line of lines) {
            const logLine = parseLogLine(line.trim());

            if (logLine) {
                fightData.push(logLine);

                // Check for "DEATH" hitsplatName and split data accordingly
                if (logLine.hitsplatName === 'DEATH') {
                    fights.push({
                        name: logLine.target,
                        data: fightData
                    })
                    fightData = [];
                }
            }
        }

        console.log(fights);
        return fights;
    } catch (error) {
        console.error('Error parsing file content:', error);
        return null;
    }
}
