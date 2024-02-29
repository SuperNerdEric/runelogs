import {
    AttackAnimationLog,
    BoostedLevelsLog,
    DamageLog,
    DeathLog,
    LoggedInPlayerLog,
    LogTypes,
    TargetChangeLog
} from "../models/LogLine";
import {parseLogLine} from "../utils/FileParser";

describe('parseLogLine', () => {
    test('should parse a death log line', () => {
        const logLine = '02-04-2024 01:19:01.807 CST\tScurrius dies';
        const expectedParsedData: DeathLog = {
            type: LogTypes.DEATH,
            date: '02-04-2024',
            time: '01:19:01.807',
            timezone: 'CST',
            target: 'Scurrius',
        };

        const parsedData = parseLogLine(logLine);

        expect(parsedData).toEqual(expectedParsedData);
    });

    test('should parse a target change log line', () => {
        const logLine = '02-04-2024 01:19:22.804 CST\tScurrius changes target to Million Pies';
        const expectedParsedData: TargetChangeLog = {
            type: LogTypes.TARGET_CHANGE,
            date: '02-04-2024',
            time: '01:19:22.804',
            timezone: 'CST',
            source: 'Scurrius',
            target: 'Million Pies',
        };

        const parsedData = parseLogLine(logLine);

        expect(parsedData).toEqual(expectedParsedData);
    });

    test('should parse a hitsplat log line', () => {
        const logLine = '02-04-2024 01:18:11.404 CST\tScurrius\tDAMAGE_ME\t15';
        const expectedParsedData: DamageLog = {
            type: LogTypes.DAMAGE,
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

    test('should parse a player logged in log line', () => {
        const logLine = '02-06-2024 15:55:30.219 CST\tLogged in player is Million Pies';
        const expectedParsedData: LoggedInPlayerLog = {
            type: LogTypes.LOGGED_IN_PLAYER,
            date: '02-06-2024',
            time: '15:55:30.219',
            timezone: 'CST',
            loggedInPlayer: "Million Pies",
        };

        const parsedData = parseLogLine(logLine);

        expect(parsedData).toEqual(expectedParsedData);
    });

    test('should parse a boosted levels log line', () => {
        const logLine = '02-14-2024 10:12:23.702 CST\tBoosted levels are [1, 2, 3, 40, 99, 89, 71]';
        const expectedParsedData: BoostedLevelsLog = {
            type: LogTypes.BOOSTED_LEVELS,
            date: '02-14-2024',
            time: '10:12:23.702',
            timezone: 'CST',
            boostedLevels: {
                attack: 1,
                strength: 2,
                defence: 3,
                ranged: 40,
                magic: 99,
                hitpoints: 89,
                prayer: 71
            }
        };

        const parsedData = parseLogLine(logLine);

        expect(parsedData).toEqual(expectedParsedData);
    });

    test('should parse a player attack animation log line', () => {
        const logLine = '02-14-2024 10:12:23.702 CST\tPlayer attack animation\t428\tScurrius';
        const expectedParsedData: AttackAnimationLog = {
            type: LogTypes.PLAYER_ATTACK_ANIMATION,
            date: '02-14-2024',
            time: '10:12:23.702',
            timezone: 'CST',
            animationId: 428,
            target: 'Scurrius',
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