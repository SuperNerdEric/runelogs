import React, {useEffect, useState} from 'react';
import {Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {pairs as d3Pairs} from 'd3-array';
import {Fight} from "../../models/Fight";
import {Levels} from "../../models/Levels";
import {BoostedLevelsLog, filterByType, LogLine, LogTypes} from "../../models/LogLine";
import {formatHHmmss} from "../../utils/utils";
import {MAGE_ANIMATION, MELEE_ANIMATIONS, RANGED_ANIMATIONS} from "../../models/Constants";
import {alpha, Box, FormControl, FormControlLabel, MenuItem, Select, SelectChangeEvent, Switch} from '@mui/material';
import {styled} from "@mui/material/styles";
import ActivityTable from "./ActivityTable";
import SectionBox from "../SectionBox";


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

export function calculateWeightedAveragesByPlayer(fight: Fight): Map<string, Levels> {
    const startTime = fight.firstLine.fightTimeMs!;
    const endTime = fight.lastLine.fightTimeMs!;
    const totalTimeInSeconds = (endTime - startTime) / 1000;

    const playerLogs = new Map<string, BoostedLevelsLog[]>();

    for (const log of filterByType(fight.data, LogTypes.BOOSTED_LEVELS)) {
        const player = log.source?.name;
        if (!player) continue;
        if (!playerLogs.has(player)) {
            playerLogs.set(player, []);
        }
        playerLogs.get(player)!.push(log);
    }

    const result = new Map<string, Levels>();

    for (const [player, logs] of playerLogs.entries()) {
        const statValues: Record<keyof Levels, number[]> = {
            attack: [],
            strength: [],
            defence: [],
            ranged: [],
            magic: [],
            hitpoints: [],
            prayer: [],
        };

        const statSums: Partial<Record<keyof Levels, number>> = {};
        const statCounts: Partial<Record<keyof Levels, number>> = {};

        const pairs: [BoostedLevelsLog, LogLine][] = d3Pairs(logs);
        if (pairs.length > 0) {
            pairs.push([logs[logs.length - 1], fight.lastLine]);
        }

        for (const [from, to] of pairs) {
            const dt = (to.fightTimeMs! - from.fightTimeMs!) / 1000;
            const weight = dt / totalTimeInSeconds;

            for (const stat of Object.keys(from.boostedLevels) as (keyof Levels)[]) {
                const val = from.boostedLevels[stat];
                if (!statSums[stat]) statSums[stat] = 0;
                statSums[stat]! += val * weight;
            }
        }

        result.set(player, statSums as Levels);
    }

    return result;
}

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

const Boosts: React.FC<DPSChartProps> = ({fight}) => {
    const [selectedPlayer, setSelectedPlayer] = useState<string>(fight.loggedInPlayer);
    const [boostedLevelsData, setBoostedLevelsData] = useState<any[] | undefined>();
    const [attackAnimationData, setAttackAnimationData] = useState<any[] | undefined>();
    const [showAttackAnimations, setShowAttackAnimations] = useState<boolean>(true); // State variable to control visibility

    useEffect(() => {
        if (!selectedPlayer) return;

        let currentBoost: Levels;
        let tempBoost: any[] = [];
        let tempAttack: any[] = [];

        fight.data.forEach(log => {
            if (log.type === LogTypes.BOOSTED_LEVELS && log.source?.name === selectedPlayer) {
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

            if (log.type === LogTypes.PLAYER_ATTACK_ANIMATION && log.source?.name === selectedPlayer) {
                tempAttack.push({
                    timestamp: log.fightTimeMs,
                    formattedTimestamp: formatHHmmss(log.fightTimeMs!, true),
                    animationId: log.animationId
                });

                if (!tempBoost.find(data => data.timestamp === log.fightTimeMs)) {
                    tempBoost.push({
                        timestamp: log.fightTimeMs,
                        formattedTimestamp: formatHHmmss(log.fightTimeMs!, true),
                        attack: currentBoost?.attack || 0,
                        strength: currentBoost?.strength || 0,
                        defence: currentBoost?.defence || 0,
                        ranged: currentBoost?.ranged || 0,
                        magic: currentBoost?.magic || 0,
                        hitpoints: currentBoost?.hitpoints || 0,
                        prayer: currentBoost?.prayer || 0,
                        animationId: log.animationId
                    });
                }
            }
        });

        if (tempBoost.length > 0) {
            tempBoost.push({
                ...tempBoost[tempBoost.length - 1],
                timestamp: fight.lastLine!.fightTimeMs,
                formattedTimestamp: formatHHmmss(fight.lastLine!.fightTimeMs!, true),
            });
        }

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
        });

        setBoostedLevelsData(tempBoost);
        setAttackAnimationData(tempAttack);
    }, [fight, selectedPlayer]);

    if (!boostedLevelsData || !attackAnimationData) {
        return <div>Loading...</div>;
    }

    return (
        <div style={{maxWidth: 1000, width: '100%'}}>
            <ActivityTable fight={fight}/>
            <SectionBox>
                <Box sx={{margin: '16px 0', width: 180}}>
                    <FormControl fullWidth size="small">
                        <Select
                            labelId="player-select-label"
                            id="player-select"
                            value={selectedPlayer}
                            onChange={(e: SelectChangeEvent) => setSelectedPlayer(e.target.value)}
                        >
                            {[...new Set(
                                fight.data
                                    .filter(
                                        (log) =>
                                            (log.type === LogTypes.PLAYER_ATTACK_ANIMATION) &&
                                            log.source?.name
                                    )
                                    .map((log) => log.source!.name)
                            )].map((name) => (
                                <MenuItem key={name} value={name}>
                                    {name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={boostedLevelsData} margin={{top: 11, left: 60, bottom: 50}}>
                        <XAxis
                            dataKey="timestamp" // Use the actual timestamp as the dataKey
                            type="number" // Specify the type as "number" for numerical values
                            tickFormatter={(timestamp) => formatHHmmss(timestamp, true)}
                            domain={[0, boostedLevelsData[boostedLevelsData.length - 1]?.timestamp ?? 0]}
                        />
                        <YAxis
                            dataKey="attack"
                            label={{
                                value: 'Level',
                                position: 'insideLeft',
                                angle: -90,
                                offset: -50,
                                style: {textAnchor: 'middle'},
                            }}
                            width={1}
                            tickFormatter={(tick) => (tick !== 0 ? tick : '')}
                            domain={[0, 125]}
                        />
                        <Legend content={() => (
                            <div style={{position: 'absolute', top: 0, right: 0}}>
                                <FormControlLabel
                                    control={
                                        <TanToggle
                                            checked={showAttackAnimations}
                                            onChange={() => setShowAttackAnimations(!showAttackAnimations)}
                                            color="default"
                                        />
                                    }
                                    label="Attacks"
                                />
                            </div>
                        )}/>
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
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={boostedLevelsData} margin={{top: 11, left: 60, bottom: 10}}>
                        <XAxis
                            dataKey="timestamp" // Use the actual timestamp as the dataKey
                            type="number" // Specify the type as "number" for numerical values
                            tickFormatter={(timestamp) => formatHHmmss(timestamp, true)}
                            domain={[0, boostedLevelsData[boostedLevelsData.length - 1]?.timestamp ?? 0]}
                        />
                        <YAxis
                            dataKey="attack"
                            label={{
                                value: 'Level',
                                position: 'insideLeft',
                                angle: -90,
                                offset: -50,
                                style: {textAnchor: 'middle'},
                            }}
                            width={1}
                            tickFormatter={(tick) => (tick !== 0 ? tick : '')}
                            domain={[0, 125]}
                        />
                        <Line type="stepAfter" dataKey="hitpoints" stroke="red" dot={false} animationDuration={0}/>
                        <Line type="stepAfter" dataKey="prayer" stroke="yellow" dot={false} animationDuration={0}/>
                        <Tooltip content={(props) => <CustomTooltip {...props} />} cursor={{fill: '#3c3226'}}/>
                    </LineChart>
                </ResponsiveContainer>
            </SectionBox>
        </div>
    );
};

export default Boosts;

const TanToggle = styled(Switch)(({theme}) => ({
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