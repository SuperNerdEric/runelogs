import {Fight, LogLine} from "../FileParser";
import {logSplitter} from "../LogSplitter";


describe("logSplitter", () => {
    const generateDamage = (target: string, damageAmount: number): LogLine => ({
        date: "02-04-2024",
        time: new Date().toLocaleTimeString(),
        timezone: "",
        target,
        damageAmount,
        hitsplatName: "DAMAGE_ME",
    });

    const generatedeath = (target: string): LogLine => ({
        date: "02-04-2024",
        time: new Date().toLocaleTimeString(),
        timezone: "",
        target,
        hitsplatName: "DEATH",
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

        const result: Fight[] = logSplitter(fightData);

        // Expecting three fights: Monster1, Monster2, Monster1
        expect(result.length).toBe(2);
        expect(result[0].name).toBe("Monster1");
        expect(result[1].name).toBe("Monster2");
    });

    it("should include fight even if didn't succeed in doing damage", () => {
        const fightData: LogLine[] = [
            generateDamage("Monster1", 0),
            generateDamage("Monster1", 0),
            generateDamage("Monster1", 0),
            generatedeath("Monster1"),
        ];

        const result: Fight[] = logSplitter(fightData);

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

        const result: Fight[] = logSplitter(fightData);

        expect(result.length).toBe(1);
        expect(result[0].name).toBe("Scurrius");
    });

    it("should not split fights if a boss is encountered second", () => {
        const fightData: LogLine[] = [
            generateDamage("Giant rat", 15),
            generateDamage("Scurrius", 20),
            generatedeath("Giant rat"),
            generateDamage("Scurrius", 20),
            generatedeath("Scurrius"),
        ];

        const result: Fight[] = logSplitter(fightData);

        expect(result.length).toBe(1);
        expect(result[0].name).toBe("Scurrius");
    });
});
