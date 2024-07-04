import {Fight} from "../../models/Fight";
import {parseFileContent} from "../../utils/FileParser";
import * as fs from "fs";
import {Raid} from "../../models/Raid";

const MOCK_DATA_DIRECTORY = "./src/tests/mocks/";

/**
 * Utility function to get mock fights from file name
 * @param fileName The name of the file in the mock directory
 * @returns The array of fights parsed from the file content, or null if parsing fails.
 */
export function getMockFights(fileName: string): (Fight | Raid)[] | null {
    try {
        const fileContent = fs.readFileSync(MOCK_DATA_DIRECTORY + fileName, 'utf-8');
        const fights: (Fight | Raid)[] | null = parseFileContent(fileContent, () => {
        });
        return fights;
    } catch (error) {
        console.error(`Error reading or parsing file: ${error}`);
        return null;
    }
}