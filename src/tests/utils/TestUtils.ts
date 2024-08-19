import {parseFileContent} from "../../utils/FileParser";
import * as fs from "fs";
import { Encounter } from "../../models/LogLine";

const MOCK_DATA_DIRECTORY = "./src/tests/mocks/";

/**
 * Utility function to get mock fights from file name
 * @param fileName The name of the file in the mock directory
 * @returns The array of fights parsed from the file content, or null if parsing fails.
 */
export function getMockFights(fileName: string): (Encounter)[] | null {
    try {
        const fileContent = fs.readFileSync(MOCK_DATA_DIRECTORY + fileName, 'utf-8');
        const fights: (Encounter)[] | null = parseFileContent(fileContent, () => {
        });
        return fights;
    } catch (error) {
        console.error(`Error reading or parsing file: ${error}`);
        return null;
    }
}