import {Fight, isFight} from "../models/Fight";
import {parseFileContent} from "../utils/FileParser";
import localforage from 'localforage';
import {Raid, RaidMetaData} from "../models/Raid";

const fightsStorage = localforage.createInstance({
    name: 'myFightData'
});

export function parseFileWithProgress(fileContent: string) {
    const parseResults = parseFileContent(fileContent, (progress) => {
        postMessage({type: 'progress', progress});
    });

    const fightMetadata = parseResults?.map(fight => {
        if (isFight(fight)) {
            return fight.metaData;
        } else {
            return {
                name: fight.name,
                fights: fight.fights.map(fight => fight.metaData)
            } as RaidMetaData;
        }

    }) || [];
    const parseResultMessage = {
        fightMetadata,
        firstResult: parseResults![0],
    }

    postMessage({type: 'parseResult', parseResultMessage});
    fightsStorage.setItem('fightData', parseResults);
}

function getSpecificItem(fightIndex: number, raidIndex?: number) {
    fightsStorage.getItem<Fight[]>('fightData').then((parseResults: (Fight | Raid)[] | null) => {
        if (parseResults && fightIndex >= 0 && fightIndex < parseResults.length) {
            if(isFight(parseResults[fightIndex])) {
                return parseResults[fightIndex];
            } else {
               // @ts-ignore
                return  parseResults[fightIndex].fights[raidIndex!];
            }
        }
        return null;
    }).then((item) => {
        postMessage({type: 'item', item});
    }).catch((error) => {
        console.error("Error getting specific item:", error);
    });
}

onmessage = (event) => {
    const {type, fileContent, index, raidIndex} = event.data;
    if (type === 'parse') {
        parseFileWithProgress(fileContent);
    } else if (type === 'getItem') {
        getSpecificItem(index, raidIndex);
    }
};
