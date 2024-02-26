import React from 'react';
import {Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {pairs as d3Pairs} from 'd3-array';
import {Fight} from "../../models/Fight";
import {BoostedLevels} from "../../models/BoostedLevels";
import {BoostedLevelsLog, filterByType, LogLine, LogTypes} from "../../models/LogLine";
import {convertTimeToMillis} from "../../utils/utils";

interface DPSChartProps {
    fight: Fight;
}

const CustomTooltip: React.FC<any> = ({active, payload, label}) => {
    if (active && payload && payload.length) {

        return (
            <div>
                {payload.map((entry: any, index: any) => (
                    <div key={`tooltip-entry-${index}`}
                         style={{marginTop: '0', marginBottom: '0', color: entry.color, lineHeight: '1'}}>
                        {entry.name}: {entry.value}
                    </div>
                ))}
                {label}
            </div>
        );
    }

    return null;
};

export function calculateWeightedAverages(fight: Fight) {
    const weightedValues: Array<{ stat: keyof BoostedLevels, values: Array<{ weightedValue: number }> }> = [];
    const startTime = convertTimeToMillis(fight.firstLine.fightTime!);
    const endTime = convertTimeToMillis(fight.lastLine.fightTime!);

    // Calculate the time difference in seconds
    const totalTimeInSeconds = (endTime - startTime) / 1000;
    console.log(totalTimeInSeconds);

    const filteredLogs = filterByType(fight.data, LogTypes.BOOSTED_LEVELS);
    const pairs: [LogLine, LogLine][] = d3Pairs(filteredLogs);

    if (pairs && pairs.length > 0) {
        // Create one more pair between the last and end of the fight
        pairs.push([fight.data[fight.data.length - 1], fight.lastLine!])

        pairs.forEach(pair => {
            const startTime = convertTimeToMillis(pair[0].fightTime!);
            const endTime = convertTimeToMillis(pair[1].fightTime!);
            const timeDiffInSeconds = (endTime - startTime) / 1000;

            for (const key in (pair[0] as BoostedLevelsLog).boostedLevels) {
                const value1 = (pair[0] as BoostedLevelsLog).boostedLevels[key as keyof BoostedLevels];
                const weightedValue = value1 * (timeDiffInSeconds / totalTimeInSeconds);

                const existingStat = weightedValues.find(item => item.stat === key as keyof BoostedLevels);
                if (existingStat) {
                    existingStat.values.push({weightedValue});
                } else {
                    weightedValues.push({stat: key as keyof BoostedLevels, values: [{weightedValue}]});
                }
            }
        })
    }

    const averages: Partial<BoostedLevels> = {};

    for (const stat of weightedValues) {
        let totalWeightedValue = 0;
        for (const value of stat.values) {
            totalWeightedValue += value.weightedValue;
        }
        const averageWeightedValue = totalWeightedValue;
        averages[stat.stat] = averageWeightedValue;
    }

    return averages as BoostedLevels;
}

const BoostsChart: React.FC<DPSChartProps> = ({fight}) => {
    const filteredLogs = filterByType(fight.data, LogTypes.BOOSTED_LEVELS);

    let boostedLevelsData = filteredLogs.map((log: BoostedLevelsLog) => ({
        timestamp: log.fightTime,
        attack: log.boostedLevels?.attack || 0,
        strength: log.boostedLevels?.strength || 0,
        defence: log.boostedLevels?.defence || 0,
        ranged: log.boostedLevels?.ranged || 0,
        magic: log.boostedLevels?.magic || 0,
        hitpoints: log.boostedLevels?.hitpoints || 0,
        prayer: log.boostedLevels?.prayer || 0,
    }));

    boostedLevelsData.push({
        ...boostedLevelsData[boostedLevelsData.length - 1],
        timestamp: fight.lastLine!.fightTime,
    });
    const averages = calculateWeightedAverages(fight);

    return (
        <div>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={boostedLevelsData} margin={{top: 11, left: 60, bottom: 20}}>
                    <XAxis
                        dataKey="timestamp"
                    />
                    <YAxis
                        dataKey="attack"
                        label={{
                            value: 'Level',
                            position: 'insideLeft',
                            angle: -90,
                            offset: -40,
                            style: {textAnchor: 'middle'},
                        }}
                        width={35}
                        tickFormatter={(tick) => (tick !== 0 ? tick : '')}
                        domain={[0, 125]}
                    />
                    <Legend
                        content={() => (
                            <div style={{marginTop: '20px', fontSize: '20px', color: 'white', textAlign: 'center'}}>
                                <div style={{display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px'}}>
                                    <span style={{gridRow: 'span 2', alignSelf: 'end'}}>Averages</span>
                                    {Object.entries(averages)
                                        .filter(([stat]) => stat === 'attack' || stat === 'strength' || stat === 'defence' || stat === 'ranged' || stat === 'magic')
                                        .map(([stat, average]) => (
                                            <div key={stat} style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center'
                                            }}>
                                                <span style={{
                                                    color: getStatColor(stat as keyof BoostedLevels),
                                                    marginBottom: '5px'
                                                }}>{stat}</span>
                                                <span>{average.toFixed(3)}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    />
                    <Line type="stepAfter" dataKey="attack" stroke="#C69B6D" dot={false}/>
                    <Line type="stepAfter" dataKey="strength" stroke="#C41E3A" dot={false}/>
                    <Line type="stepAfter" dataKey="defence" stroke="#0070DD" dot={false}/>
                    <Line type="stepAfter" dataKey="ranged" stroke="#AAD372" dot={false}/>
                    <Line type="stepAfter" dataKey="magic" stroke="#3FC7EB" dot={false}/>
                    <Tooltip content={(props) => <CustomTooltip {...props} />} cursor={{fill: '#3c3226'}}/>
                </LineChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={boostedLevelsData} margin={{top: 11, left: 60, bottom: 20}}>
                    <XAxis
                        dataKey="timestamp"
                    />
                    <YAxis
                        dataKey="attack"
                        label={{
                            value: 'Level',
                            position: 'insideLeft',
                            angle: -90,
                            offset: -40,
                            style: {textAnchor: 'middle'},
                        }}
                        width={35}
                        tickFormatter={(tick) => (tick !== 0 ? tick : '')}
                        domain={[0, 125]}
                    />
                    <Legend
                        content={() => (
                            <div style={{marginTop: '20px', fontSize: '20px', color: 'white', textAlign: 'center'}}>
                                <div style={{display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px'}}>
                                    <span style={{gridRow: 'span 2', alignSelf: 'end'}}>Averages</span>
                                    {Object.entries(averages)
                                        .filter(([stat]) => stat === 'hitpoints' || stat === 'prayer')
                                        .map(([stat, average]) => (
                                            <div key={stat} style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center'
                                            }}>
                                                <span style={{
                                                    color: getStatColor(stat as keyof BoostedLevels),
                                                    marginBottom: '5px'
                                                }}>{stat}</span>
                                                <span>{average.toFixed(3)}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    />
                    <Line type="stepAfter" dataKey="hitpoints" stroke="red" dot={false}/>
                    <Line type="stepAfter" dataKey="prayer" stroke="yellow" dot={false}/>
                    <Tooltip content={(props) => <CustomTooltip {...props} />} cursor={{fill: '#3c3226'}}/>
                </LineChart>
            </ResponsiveContainer>
        </div>

    );
};

function getStatColor(stat: keyof BoostedLevels) {
    switch (stat) {
        case 'attack':
            return '#C69B6D';
        case 'strength':
            return '#C41E3A';
        case 'defence':
            return '#0070DD';
        case 'ranged':
            return '#AAD372';
        case 'magic':
            return '#3FC7EB';
        case 'hitpoints':
            return 'red';
        case 'prayer':
            return 'yellow';
        default:
            return '#333'; // Default color
    }
}

export default BoostsChart;
