import React from 'react';
import {Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {BoostedLevels, Fight, LogLine} from '../../FileParser';
import { pairs as d3Pairs } from 'd3-array';

interface DPSChartProps {
    fight: Fight;
}

const CustomTooltip: React.FC<any> = ({active, payload, label}) => {
    if (active && payload && payload.length) {

        return (
            <div
                style={{
                    background: '#1c1c1c',
                    padding: '5px',
                    border: '1px solid #ccc',
                    borderRadius: '1px',
                }}
            >
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
    const startTime = fight.firstLine?.date + " " + fight.firstLine?.time;
    const endTime = fight.lastLine?.date + " " + fight.lastLine?.time;
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const totalTimeInSeconds = (endDate.getTime() - startDate.getTime()) / 1000;

    const pairs = d3Pairs(fight.data);

    // Create one more pair between the last and end of the fight
    pairs.push([fight.data[fight.data.length -1], fight.lastLine!])

    pairs.forEach(pair => {
        const startTime = pair[0].date + " " + pair[0].time;
        const endTime = pair[1].date + " " + pair[1].time;
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        const timeDiffInSeconds = (endDate.getTime() - startDate.getTime()) / 1000;

        for (const key in pair[0].boostedLevels) {
            const value1 = pair[0].boostedLevels[key as keyof BoostedLevels];
            const weightedValue = value1 * (timeDiffInSeconds / totalTimeInSeconds);

            const existingStat = weightedValues.find(item => item.stat === key as keyof BoostedLevels);
            if (existingStat) {
                existingStat.values.push({ weightedValue });
            } else {
                weightedValues.push({ stat: key as keyof BoostedLevels, values: [{ weightedValue }] });
            }
        }
    })


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

    let boostedLevelsData = fight.data.map((log: LogLine) => ({
        timestamp: log.time,
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
        timestamp: fight.lastLine!.time,
    });
    const averages = calculateWeightedAverages(fight);

    return (
        <div>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={boostedLevelsData} margin={{top: 11, left: 60, bottom: 50}}>
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
                    />
                    <Legend/>
                    <Line type="stepAfter" dataKey="attack" stroke="#C69B6D" dot={false}/>
                    <Line type="stepAfter" dataKey="strength" stroke="#C41E3A" dot={false}/>
                    <Line type="stepAfter" dataKey="defence" stroke="#0070DD" dot={false}/>
                    <Line type="stepAfter" dataKey="ranged" stroke="#AAD372" dot={false}/>
                    <Line type="stepAfter" dataKey="magic" stroke="#3FC7EB" dot={false}/>
                    <Tooltip content={(props) => <CustomTooltip {...props} />} cursor={{fill: '#3c3226'}}/>
                </LineChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={boostedLevelsData} margin={{top: 11, left: 60, bottom: 50}}>
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
                    />
                    <Legend/>
                    <Line type="stepAfter" dataKey="hitpoints" stroke="red" dot={false}/>
                    <Line type="stepAfter" dataKey="prayer" stroke="yellow" dot={false}/>
                    <Tooltip content={(props) => <CustomTooltip {...props} />} cursor={{fill: '#3c3226'}}/>
                </LineChart>
            </ResponsiveContainer>
            <div style={{ marginTop: '20px', fontSize: '20px', color: 'white', textAlign: 'center' }}>
                <h2 style={{ fontSize: '25px', marginBottom: '10px' }}>Average Stats</h2>
                <div style={{ margin: '0 auto', width: '100px' }}>
                    <table style={{ width: '100%', textAlign: 'center' }}>
                        <tbody>
                        {Object.entries(averages).map(([stat, average]) => (
                            <tr key={stat}>
                                <td style={{ color: getStatColor(stat as keyof BoostedLevels) }}>{stat}:</td>
                                <td>{average.toFixed(3)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
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
