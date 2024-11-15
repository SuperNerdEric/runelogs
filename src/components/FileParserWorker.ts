import {Fight, isFight} from "../models/Fight";
import {parseFileContent} from "../utils/FileParser";
import localforage from 'localforage';
import {getRaidMetadata, isRaid} from "../models/Raid";
import { Encounter } from "../models/LogLine";
import { getWavesMetaData } from "../models/Waves";

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
        } else if (isRaid(fight)) {
            return getRaidMetadata(fight);
        } else {
            return getWavesMetaData(fight);
        }
    }) || [];
    const parseResultMessage = {
        fightMetadata,
        firstResult: parseResults![0],
    }

    postMessage({type: 'parseResult', parseResultMessage});
    fightsStorage.setItem('fightData', parseResults);
}

// subIndex may be the wave number within a waves list
function getSpecificItem(fightIndex: number, raidIndex?: number, subIndex?: number) {
    fightsStorage.getItem<Fight[]>('fightData').then((parseResults: (Encounter)[] | null) => {
        if (parseResults && fightIndex >= 0 && fightIndex < parseResults.length) {
            const result = parseResults[fightIndex];
            if(isFight(result)) {
                return result;
            } else if (isRaid(result)) {
                return result.fights[raidIndex!];
            } else {
                return result.waves[raidIndex!].fights[subIndex!];
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
    const {type, fileContent, index, raidIndex, subIndex} = event.data;
    if (type === 'parse') {
        parseFileWithProgress(fileContent);
    } else if (type === 'getItem') {
        getSpecificItem(index, raidIndex, subIndex);
    }
};
