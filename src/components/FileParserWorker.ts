import {Fight} from "../models/Fight";
import {parseFileContent} from "../utils/FileParser";

let parseResults: Fight[] | null = null;

function parseFileWithProgress(fileContent: string) {
    parseResults = parseFileContent(fileContent, (progress) => {
        postMessage({type: 'progress', progress});
    });

    const fightNames = parseResults?.map(fight => fight.name) || [];
    const parseResultMessage = {
        fightNames,
        firstResult: parseResults![0],
    }
    postMessage({type: 'parseResult', parseResultMessage});
}

function getSpecificItem(index: number) {
    if (parseResults && index >= 0 && index < parseResults.length) {
        return parseResults[index];
    }
    return null;
}

onmessage = (event) => {
    const {type, fileContent, index} = event.data;
    if (type === 'parse') {
        parseFileWithProgress(fileContent);
    } else if (type === 'getItem') {
        const item = getSpecificItem(index);
        postMessage({type: 'item', item});
    }
};
