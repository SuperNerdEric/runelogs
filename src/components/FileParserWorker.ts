import {Fight, isFight} from "../models/Fight";
import {parseFileContent} from "../utils/FileParser";
import localforage from 'localforage';
import {getRaidMetadata, isRaid} from "../models/Raid";
import {Encounter, LogLine} from "../models/LogLine";
import {getWavesMetaData} from "../models/Waves";

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
            if (isFight(result)) {
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

function getAggregateItems(fightIndices: number[]) {
    fightsStorage
        .getItem<Encounter[]>('fightData')
        .then((parseResults) => {
            if (!parseResults) {
                postMessage({ type: 'item', item: null });
                return;
            }

            const selectedFights: Fight[] = fightIndices
                .map((idx) => {
                    if (idx >= 0 && idx < parseResults.length) {
                        const result = parseResults[idx];
                        if (isFight(result)) {
                            return result;
                        }
                    }
                    return null;
                })
                .filter(Boolean) as Fight[];

            const item = createAggregateFight(selectedFights);
            postMessage({ type: 'item', item });
        })
        .catch((error) => {
            console.error("Error getting items:", error);
            postMessage({ type: 'item', aggregate: null });
        });
}

onmessage = (event) => {
    const {type, fileContent, index, raidIndex, subIndex, indices} = event.data;
    if (type === 'parse') {
        parseFileWithProgress(fileContent);
    } else if (type === 'getItem') {
        getSpecificItem(index, raidIndex, subIndex);
    } else if (type === 'getAggregateItems') {
        getAggregateItems(indices);
    }
};

function createAggregateFight(fights: Fight[]): Fight {
    if (fights.length === 0) {
        throw new Error("No fights to aggregate");
    }
    const first = fights[0];

    const aggregatedData: LogLine[] = [];
    let currentTickOffset = 0;

    const totalLengthMs = fights.reduce(
        (acc, f) => acc + f.metaData.fightLengthMs,
        0
    );

    const anySuccess = fights.some((f) => f.metaData.success);

    for (let i = 0; i < fights.length; i++) {
        const fight = fights[i];

        const maxTickInThisFight = fight.metaData.fightLengthMs / 600;

        for (const originalLine of fight.data) {
            const newLine: LogLine = {
                ...originalLine,
                tick: (originalLine.tick ?? 0) + currentTickOffset,
                fightTimeMs: (originalLine.fightTimeMs ?? 0) + currentTickOffset * 600,
            };
            aggregatedData.push(newLine);
        }
        currentTickOffset += (maxTickInThisFight + 1);
    }

    const aggregated: Fight = {
        name: `${first.mainEnemyName} - Aggregate of ${fights.length} fights`,
        mainEnemyName: first.mainEnemyName,
        isNpc: first.isNpc,
        metaData: {
            ...first.metaData,
            name: `${first.mainEnemyName} - Aggregate of ${fights.length} fights`,
            fightLengthMs: totalLengthMs,
            success: anySuccess,
        },
        data: aggregatedData,
        enemyNames: [...first.enemyNames],
        loggedInPlayer: first.loggedInPlayer,
        logVersion: first.logVersion,

        firstLine: first.firstLine,
        lastLine: aggregatedData[aggregatedData.length - 1],
    };

    return aggregated;
}

