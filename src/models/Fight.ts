import {LogLine} from "./LogLine";

export interface Fight {
    name: string;
    data: LogLine[];
    enemies: string[];
    loggedInPlayer: string;

    // Just for easy reference later
    firstLine: LogLine;
    lastLine: LogLine;
}