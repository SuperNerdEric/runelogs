import {LogLine, parseLogLine} from "../FileParser";

describe('parseLogLine', () => {
    test('should parse a death log line', () => {
        const logLine = '02-04-2024 01:19:01.807 CST\tScurrius dies';
        const expectedParsedData: LogLine = {
            date: '02-04-2024',
            time: '01:19:01.807',
            timezone: 'CST',
            target: 'Scurrius',
            hitsplatName: 'DEATH',
        };

        const parsedData = parseLogLine(logLine);

        expect(parsedData).toEqual(expectedParsedData);
    });

    test('should parse a target change log line', () => {
        const logLine = '02-04-2024 01:19:22.804 CST\tScurrius changes target to Million Pies';
        const expectedParsedData: LogLine = {
            date: '02-04-2024',
            time: '01:19:22.804',
            timezone: 'CST',
            source: 'Scurrius',
            target: 'Million Pies',
            hitsplatName: 'CHANGE_TARGET',
        };

        const parsedData = parseLogLine(logLine);

        expect(parsedData).toEqual(expectedParsedData);
    });

    test('should parse a hitsplat log line', () => {
        const logLine = '02-04-2024 01:18:11.404 CST\tScurrius\tDAMAGE_ME\t15';
        const expectedParsedData: LogLine = {
            date: '02-04-2024',
            time: '01:18:11.404',
            timezone: 'CST',
            target: 'Scurrius',
            hitsplatName: 'DAMAGE_ME',
            damageAmount: 15,
        };

        const parsedData = parseLogLine(logLine);

        expect(parsedData).toEqual(expectedParsedData);
    });

    test('should return null for an invalid log line', () => {
        const invalidLogLine = 'Invalid log line';
        const parsedData = parseLogLine(invalidLogLine);

        expect(parsedData).toBeNull();
    });
});