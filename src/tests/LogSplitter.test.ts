import {Encounter, LogLine, LogTypes} from "../models/LogLine";
import {logSplitter} from "../utils/LogSplitter";
import {Fight} from "../models/Fight";
import {Raid} from "../models/Raid";


describe("logSplitter", () => {
    const generateDamage = (target: string, damageAmount: number, time?: Date): LogLine => {
        const currentTime = time || new Date();
        const formattedTime = `${currentTime.getUTCHours()}:${currentTime.getUTCMinutes()}:${currentTime.getUTCSeconds()}.${currentTime.getUTCMilliseconds()}`;

        return {
            type: LogTypes.DAMAGE,
            date: "02-04-2024",  // You might want to update this as well
            time: formattedTime,
            timezone: "",
            source: {name: "Million Pies"},
            target: {name: target},
            damageAmount,
            hitsplatName: "DAMAGE_ME",
        };
    };

    const generatedeath = (target: string): LogLine => ({
        type: LogTypes.DEATH,
        date: "02-04-2024",
        time: new Date().toLocaleTimeString(),
        timezone: "",
        target: {name: target},
    });


    it("should split logs when a target dies", () => {
        const fightData: LogLine[] = [
            generateDamage("Monster1", 10),
            generateDamage("Monster1", 5),
            generatedeath("Monster1"),
            generateDamage("Monster2", 8),
            generateDamage("Monster2", 0),
            generatedeath("Monster2"),
        ];

        const result: (Encounter)[] = logSplitter(fightData);

        // Expecting three fights: Monster1, Monster2, Monster1
        expect(result.length).toBe(2);
        expect(result[0].name).toBe("Monster1 - 1");
        expect(result[1].name).toBe("Monster2 - 1");
    });

    it("should include fight even if didn't succeed in doing damage", () => {
        const fightData: LogLine[] = [
            generateDamage("Monster1", 0),
            generateDamage("Monster1", 0),
            generateDamage("Monster1", 0),
            generatedeath("Monster1"),
        ];

        const result: (Encounter)[] = logSplitter(fightData);

        expect(result.length).toBe(1);
    });

    it("should not split fights if a boss is encountered first", () => {
        const fightData: LogLine[] = [
            generateDamage("Scurrius", 20),
            generateDamage("Giant rat", 15),
            generatedeath("Giant rat"),
            generateDamage("Scurrius", 20),
            generatedeath("Scurrius"),
        ];

        const result: (Encounter)[] = logSplitter(fightData);

        expect(result.length).toBe(1);
        expect(result[0].name).toBe("Scurrius - 1");
    });

    it("should not split fights if a boss is encountered second", () => {
        const fightData: LogLine[] = [
            generateDamage("Giant rat", 15),
            generateDamage("Scurrius", 20),
            generatedeath("Giant rat"),
            generateDamage("Scurrius", 20),
            generatedeath("Scurrius"),
        ];

        const result: (Encounter)[] = logSplitter(fightData);

        expect(result.length).toBe(1);
        expect(result[0].name).toBe("Scurrius - 1");
    });

    it("should split fights if there is a gap of over 60 seconds", () => {
        const fightData: LogLine[] = [
            generateDamage("Scurrius", 1),
            generateDamage("Scurrius", 2, new Date(new Date().getTime() + 90 * 1000)),
            generatedeath("Scurrius"),
        ];

        const result: (Encounter)[] = logSplitter(fightData);

        expect(result.length).toBe(2);
        expect(result[0].name).toBe("Scurrius - Incomplete - 1");
    });

    it("should end the current fight when player goes to their house region", () => {
        const fightData: LogLine[] = [
            generateDamage("Monster1", 10),
            generateDamage("Monster1", 5),
            {
                type: LogTypes.PLAYER_REGION,
                date: "02-04-2024",
                time: new Date().toLocaleTimeString(),
                timezone: "",
                playerRegion: 7769,
            },
            generateDamage("Monster1", 5),
        ];

        const result: (Encounter)[] = logSplitter(fightData);

        expect(result.length).toBe(2);
        // @ts-ignore
        expect(result[0].metaData.success).toBe(false);
    });
});
