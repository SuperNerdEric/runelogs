import React, {useEffect, useState} from 'react';
import {Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {pairs as d3Pairs} from 'd3-array';
import {Fight} from "../../models/Fight";
import {Levels} from "../../models/Levels";
import {BoostedLevelsLog, filterByType, LogLine, LogTypes} from "../../models/LogLine";
import {formatHHmmss} from "../../utils/utils";
import {MAGE_ANIMATION, MELEE_ANIMATIONS, RANGED_ANIMATIONS} from "../../models/Constants";
import {alpha, FormControlLabel, Switch} from '@mui/material';
import {styled} from "@mui/material/styles";

interface DPSChartProps {
    fight: Fight;
}

const CustomTooltip: React.FC<any> = ({active, payload, label, data}) => {
    if (active && payload && payload.length) {

        return (
            <div>
                {payload.map((entry: any, index: any) => (
                    <div key={`tooltip-entry-${index}`}
                         style={{marginTop: '0', marginBottom: '0', color: entry.color, lineHeight: '1'}}>
                        {entry.name}: {entry.value}
                    </div>
                ))}
                {formatHHmmss(label, true)}

                {payload[0].payload.animationId &&
                    <div>
                        Animation: {payload[0].payload.animationId}
                    </div>
                }
            </div>
        );
    }

    return null;
};

export function calculateWeightedAverages(fight: Fight) {
    const weightedValues: Array<{ stat: keyof Levels, values: Array<{ weightedValue: number }> }> = [];
    const startTime = fight.firstLine.fightTimeMs!;
    const endTime = fight.lastLine.fightTimeMs!;

    // Calculate the time difference in seconds
    const totalTimeInSeconds = (endTime - startTime) / 1000;

    const filteredLogs = filterByType(fight.data, LogTypes.BOOSTED_LEVELS);
    const pairs: [LogLine, LogLine][] = d3Pairs(filteredLogs);

    if (pairs && pairs.length > 0) {
        // Create one more pair between the last and end of the fight
        pairs.push([fight.data[fight.data.length - 1], fight.lastLine!])

        pairs.forEach(pair => {
            const startTime = pair[0].fightTimeMs!;
            const endTime = pair[1].fightTimeMs!;
            const timeDiffInSeconds = (endTime - startTime) / 1000;

            for (const key in (pair[0] as BoostedLevelsLog).boostedLevels) {
                const value1 = (pair[0] as BoostedLevelsLog).boostedLevels[key as keyof Levels];
                const weightedValue = value1 * (timeDiffInSeconds / totalTimeInSeconds);

                const existingStat = weightedValues.find(item => item.stat === key as keyof Levels);
                if (existingStat) {
                    existingStat.values.push({weightedValue});
                } else {
                    weightedValues.push({stat: key as keyof Levels, values: [{weightedValue}]});
                }
            }
        })
    }

    const averages: Partial<Levels> = {};

    for (const stat of weightedValues) {
        let totalWeightedValue = 0;
        for (const value of stat.values) {
            totalWeightedValue += value.weightedValue;
        }
        const averageWeightedValue = totalWeightedValue;
        averages[stat.stat] = averageWeightedValue;
    }

    return averages as Levels;
}

const BoostsChart: React.FC<DPSChartProps> = ({fight}) => {
    const [boostedLevelsData, setBoostedLevelsData] = useState<any[] | undefined>();
    const [attackAnimationData, setAttackAnimationData] = useState<any[] | undefined>();
    const [showAttackAnimations, setShowAttackAnimations] = useState<boolean>(true); // State variable to control visibility

    useEffect(() => {
        let currentBoost: Levels;

        let tempBoost: any[] = [];
        let tempAttack: any[] = [];

        fight.data.forEach(log => {
            if (log.type === LogTypes.BOOSTED_LEVELS && log.source?.name === fight.loggedInPlayer) {
                tempBoost.push({
                    timestamp: log.fightTimeMs,
                    formattedTimestamp: formatHHmmss(log.fightTimeMs!, true),
                    attack: log.boostedLevels?.attack || 0,
                    strength: log.boostedLevels?.strength || 0,
                    defence: log.boostedLevels?.defence || 0,
                    ranged: log.boostedLevels?.ranged || 0,
                    magic: log.boostedLevels?.magic || 0,
                    hitpoints: log.boostedLevels?.hitpoints || 0,
                    prayer: log.boostedLevels?.prayer || 0,
                });

                currentBoost = log.boostedLevels;
            }


            if (log.type === LogTypes.PLAYER_ATTACK_ANIMATION && (!log.source || log.source.name === fight.loggedInPlayer)) {
                tempAttack.push({
                    timestamp: log.fightTimeMs,
                    formattedTimestamp: formatHHmmss(log.fightTimeMs!, true),
                    animationId: log.animationId
                });

                // Add in a fake boost datapoint, only if it doesn't already exist
                if (!tempBoost.find(data => data.timestamp === log.fightTimeMs)) {
                    tempBoost.push({
                        timestamp: log.fightTimeMs,
                        formattedTimestamp: formatHHmmss(log.fightTimeMs!, true),
                        attack: currentBoost.attack || 0,
                        strength: currentBoost.strength || 0,
                        defence: currentBoost.defence || 0,
                        ranged: currentBoost.ranged || 0,
                        magic: currentBoost.magic || 0,
                        hitpoints: currentBoost?.hitpoints || 0,
                        prayer: currentBoost?.prayer || 0,
                        animationId: log.animationId
                    });
                }
            }
        })

        tempBoost.push({
            ...tempBoost[tempBoost.length - 1],
            timestamp: fight.lastLine!.fightTimeMs,
            formattedTimestamp: formatHHmmss(fight.lastLine!.fightTimeMs!, true),
        });

        const verticalMelee = "rgb(153, 38, 58)";
        const verticalRanged = "rgb(72, 84, 55)";
        const verticalMagic = "rgb(28, 95, 115)";

        tempAttack.forEach(attack => {
            if (MELEE_ANIMATIONS.includes(attack.animationId)) {
                attack.color = verticalMelee;
            } else if (RANGED_ANIMATIONS.includes(attack.animationId)) {
                attack.color = verticalRanged;
            } else if (MAGE_ANIMATION.includes(attack.animationId)) {
                attack.color = verticalMagic;
            }
        })
        setBoostedLevelsData(tempBoost);
        setAttackAnimationData(tempAttack);
    }, [fight]);


    const filteredLogs = filterByType(fight.data, LogTypes.BOOSTED_LEVELS);
    const averages = calculateWeightedAverages({
        ...fight!,
        data: filteredLogs?.filter((log) => log.boostedLevels) as BoostedLevelsLog[],
    });

    if (!boostedLevelsData || !attackAnimationData) {
        return <div>Loading...</div>;
    } else {
        /*        console.log(boostedLevelsData)
                attackAnimationData.map(data => {
                    console.log(data.formattedTimestamp);
                })*/
    }

    return (
        <div>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={boostedLevelsData} margin={{top: 11, left: 60, bottom: 20}}>
                    <XAxis
                        dataKey="timestamp" // Use the actual timestamp as the dataKey
                        type="number" // Specify the type as "number" for numerical values
                        tickFormatter={(timestamp) => formatHHmmss(timestamp, true)}
                        domain={[0, boostedLevelsData[boostedLevelsData.length - 1].timestamp]}
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
                                                    color: getStatColor(stat as keyof Levels),
                                                    marginBottom: '5px'
                                                }}>{stat}</span>
                                                <span>{average.toFixed(3)}</span>
                                            </div>
                                        ))}
                                </div>
                                <div style={{position: 'absolute', top: 0, right: 0}}>
                                    <FormControlLabel
                                        control={<TanToggle checked={showAttackAnimations}
                                                         onChange={() => setShowAttackAnimations(!showAttackAnimations)}
                                                         color="default"/>}
                                        label="Attacks"
                                    />
                                </div>
                            </div>
                        )}
                    />
                    {attackAnimationData.map((line, index) => (
                        showAttackAnimations && (
                            <ReferenceLine key={index} x={line.timestamp} stroke={line.color} strokeDasharray="10 2"
                                           ifOverflow="extendDomain"/>
                        )
                    ))}
                    <Line type="stepAfter" dataKey="attack" stroke="#C69B6D" dot={false} animationDuration={0}/>
                    <Line type="stepAfter" dataKey="strength" stroke="#C41E3A" dot={false} animationDuration={0}/>
                    <Line type="stepAfter" dataKey="defence" stroke="#0070DD" dot={false} animationDuration={0}/>
                    <Line type="stepAfter" dataKey="ranged" stroke="#AAD372" dot={false} animationDuration={0}/>
                    <Line type="stepAfter" dataKey="magic" stroke="#3FC7EB" dot={false} animationDuration={0}/>
                    <Tooltip content={(props) => <CustomTooltip {...props} data={boostedLevelsData}/>}
                             cursor={{fill: '#3c3226'}}/>
                </LineChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={boostedLevelsData} margin={{top: 11, left: 60, bottom: 20}}>
                    <XAxis
                        dataKey="timestamp" // Use the actual timestamp as the dataKey
                        type="number" // Specify the type as "number" for numerical values
                        tickFormatter={(timestamp) => formatHHmmss(timestamp, true)}
                        domain={[0, boostedLevelsData[boostedLevelsData.length - 1].timestamp]}
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
                                                    color: getStatColor(stat as keyof Levels),
                                                    marginBottom: '5px'
                                                }}>{stat}</span>
                                                <span>{average.toFixed(3)}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    />
                    <Line type="stepAfter" dataKey="hitpoints" stroke="red" dot={false} animationDuration={0}/>
                    <Line type="stepAfter" dataKey="prayer" stroke="yellow" dot={false} animationDuration={0}/>
                    <Tooltip content={(props) => <CustomTooltip {...props} />} cursor={{fill: '#3c3226'}}/>
                </LineChart>
            </ResponsiveContainer>
        </div>

    );
};

function getStatColor(stat: keyof Levels) {
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

const TanToggle = styled(Switch)(({ theme }) => ({
    '& .MuiSwitch-switchBase.Mui-checked': {
        color: "#D2B48C",
        '&:hover': {
            backgroundColor: alpha("#D2B48C", theme.palette.action.hoverOpacity),
        },
    },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
        backgroundColor: "#D2B48C",
    },
    '& .MuiSwitch-track': {
        backgroundColor: theme.palette.grey[400],
    },
}));