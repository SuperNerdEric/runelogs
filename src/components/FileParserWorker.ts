import {Fight} from "../models/Fight";
import {parseFileContent} from "../utils/FileParser";
import localforage from 'localforage';

const fightsStorage = localforage.createInstance({
    name: 'myFightData'
});

function parseFileWithProgress(fileContent: string) {
    const parseResults = parseFileContent(fileContent, (progress) => {
        postMessage({type: 'progress', progress});
    });

    const fightMetadata = parseResults?.map(fight => fight.metaData) || [];
    const parseResultMessage = {
        fightMetadata,
        firstResult: parseResults![0],
    }

    postMessage({type: 'parseResult', parseResultMessage});
    fightsStorage.setItem('fightData', parseResults);
}

function getSpecificItem(index: number) {
    fightsStorage.getItem<Fight[]>('fightData').then((parseResults: Fight[] | null) => {
        if (parseResults && index >= 0 && index < parseResults.length) {
            return parseResults[index];
        }
        return null;
    }).then((item) => {
        postMessage({type: 'item', item});
    }).catch((error) => {
        console.error("Error getting specific item:", error);
    });
}

onmessage = (event) => {
    const {type, fileContent, index} = event.data;
    if (type === 'parse') {
        parseFileWithProgress(fileContent);
    } else if (type === 'getItem') {
        getSpecificItem(index);
    }
};
