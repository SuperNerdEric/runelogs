import {Fight} from "../../models/Fight";
import React, {useEffect, useState} from "react";
import {Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from "@mui/material";
import TableColumnHeaderTooltip from "../TableColumnHeaderTooltip";
import {COLUMN_TOOLTIPS} from "../../utils/columnTooltips";
import {DamageLog, LogTypes} from "../../models/LogLine";
import {getFightPerformanceByPlayer, getPercentColor} from "../../utils/TickActivity";
import {isUnknownPlayer} from "../../utils/actorUtils";
import {getPlayerDpsDisplayColor} from "../../utils/percentile";
import {BOAT_IDS, BOAT_ID_TO_NAME} from "../../utils/constants";
import {calculatePlayerDps, getFightDurationSeconds} from "../../utils/dpsCalculation";
import {ActorFilter} from "../../utils/actorFilter";
import {Actor} from "../../models/Actor";
import {colors} from "../../theme";

interface DPSMeterBarChartProps {
    fight: Fight;
    filteredFight: Fight;
    type: "damage-done" | "damage-taken";
    dpsPercentiles?: Record<string, number>;
    onSelectSourceFilter: (filter: ActorFilter) => void;
    onSelectTargetFilter: (filter: ActorFilter) => void;
}

interface DPSData {
    actor: Actor;
    totalDamage: number;
    totalHits: number;
    successfulHits: number;
    activity: number;
    accuracy: number;
    dps: number;
}

const getDPSData = (fight: Fight, filteredFight: Fight, type: "damage-done" | "damage-taken"): Record<string, DPSData> => {
    const dpsData: Record<string, DPSData> = {};

    for (const logLine of filteredFight.data) {
        if (logLine.type === LogTypes.DAMAGE) {
            const damageLog = logLine as DamageLog;
            let actorName: string;
            let actor: Actor;
            
            if (type === "damage-done") {
                actorName = damageLog.source.name;
                actor = damageLog.source;
            } else {
                // For damage-taken, check if target is a boat and use mapped name
                if (damageLog.target.id && BOAT_IDS.includes(damageLog.target.id)) {
                    const boatName = BOAT_ID_TO_NAME[damageLog.target.id] || "Boat";
                    actorName = damageLog.target.index !== undefined 
                        ? `${boatName}-${damageLog.target.index}` 
                        : boatName;
                    actor = {
                        ...damageLog.target,
                        name: actorName,
                    };
                } else {
                    actorName = damageLog.target.name;
                    actor = damageLog.target;
                }
            }

            if (!dpsData[actorName]) {
                dpsData[actorName] = {
                    actor,
                    accuracy: 0,
                    dps: 0,
                    totalDamage: 0,
                    totalHits: 0,
                    successfulHits: 0,
                    activity: 0,
                };
            }

            dpsData[actorName].totalDamage += damageLog.damageAmount;
            dpsData[actorName].totalHits += 1;
            if (damageLog.damageAmount > 0) {
                dpsData[actorName].successfulHits += 1;
            }
        }
    }

    if (type === "damage-done") {
        const performanceMap = getFightPerformanceByPlayer(fight);

        for (const [player, playerPerformance] of performanceMap.entries()) {
            const percentage = playerPerformance.activeTicks / fight.metaData.fightDurationTicks;

            if (dpsData[player]) {
                dpsData[player].activity = Number((percentage * 100).toFixed(2));
            }
        }

        const playerDpsByName = new Map(
            calculatePlayerDps(fight, filteredFight.data).map((entry) => [entry.playerName, entry.dps]),
        );
        for (const [playerName, dps] of playerDpsByName) {
            if (dpsData[playerName]) {
                dpsData[playerName].dps = Number(dps.toFixed(3));
            }
        }
    }

    const fightDurationSeconds = getFightDurationSeconds(fight);

    const dpsArray = Object.entries(dpsData).map(([actor, data]: [string, DPSData]) => {
        const accuracy = (data.successfulHits / data.totalHits) * 100;
        const dps = type === "damage-done" && fight.players.includes(actor)
            ? data.dps
            : data.totalDamage / fightDurationSeconds;
        return {actor, damage: data.totalDamage, accuracy, dps};
    });

    for (const dpsDataKey in dpsData) {
        const dpsDataValue = dpsData[dpsDataKey];
        const dpsDataEntry = dpsArray.find(entry => entry.actor === dpsDataKey);
        if (dpsDataEntry) {
            dpsDataValue.accuracy = Number(dpsDataEntry.accuracy.toFixed(2));
            dpsDataValue.dps = Number(dpsDataEntry.dps.toFixed(3));
        }
    }

    return dpsData;
}

const DPSMeterTable: React.FC<DPSMeterBarChartProps> = ({
    fight,
    filteredFight,
    type,
    dpsPercentiles,
    onSelectSourceFilter,
    onSelectTargetFilter,
}) => {
    const loggedInPlayer = fight.loggedInPlayer;

    const dpsData = getDPSData(fight, filteredFight, type);
    const totalDamage = Object.values(dpsData).reduce((acc, cur) => acc + cur.totalDamage, 0);

    const [maxWidth, setMaxWidth] = useState<number>(0);

    useEffect(() => {
        const handleResize = () => {
            // Handle this better
            let vwWidth = window.innerWidth * 0.7 - 300;
            if (vwWidth > 540) {
                vwWidth = 540;
            }
            setMaxWidth(vwWidth);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const calculateBarWidth = (damage: number) => {
        const highestDamage = Math.max(...Object.values(dpsData).map(data => data.totalDamage));
        return `${(damage / highestDamage) * maxWidth}px`;
    };

    const sortedDPSData = Object.entries(dpsData).sort((a, b) => b[1].totalDamage - a[1].totalDamage);

    return (
        <TableContainer
            sx={{
                '& .MuiTableCell-root': {
                    fontSize: '13px',
                    '@media (max-width: 768px)': {
                        fontSize: '12px',
                        padding: '2px 3px',
                    },
                },
            }}
        >
            <Table style={{tableLayout: 'auto', width: '100%'}}>
                <TableHead>
                    <TableRow>
                        <TableCell style={{width: '100px', textAlign: 'center'}}>Name</TableCell>
                        <TableCell style={{textAlign: 'center', paddingBottom: '2px'}}>Amount</TableCell>
                        {type === "damage-done" && (
                            <TableCell style={{width: '100px', textAlign: 'center'}}>
                                <TableColumnHeaderTooltip
                                    label="Activity"
                                    tooltip={COLUMN_TOOLTIPS.activity}
                                />
                            </TableCell>
                        )}
                        <TableCell style={{width: '100px', textAlign: 'center'}}>
                            <TableColumnHeaderTooltip
                                label="Accuracy"
                                tooltip={COLUMN_TOOLTIPS.accuracy}
                            />
                        </TableCell>
                        <TableCell style={{width: '70px', textAlign: 'center'}}>
                            <TableColumnHeaderTooltip
                                label="DPS"
                                tooltip={COLUMN_TOOLTIPS.dps}
                            />
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedDPSData.map(([source, data]: [string, DPSData], index: number) => {
                        const damagePercentage = Number(((data.totalDamage / totalDamage) * 100).toFixed(2));
                        const unknown = isUnknownPlayer(source);
                        const dpsDisplay = getPlayerDpsDisplayColor(
                            source,
                            type === 'damage-done' ? dpsPercentiles?.[source] : undefined,
                        );

                        return (
                            <TableRow key={index} className={index % 2 === 0 ? 'even-row' : 'odd-row'}
                                      style={{cursor: 'default'}}
                                      onMouseEnter={(e) => e.currentTarget.classList.add('highlighted-row')}
                                      onMouseLeave={(e) => e.currentTarget.classList.remove('highlighted-row')}>
                                <TableCell
                                    style={{width: '100px', textAlign: 'left'}}
                                    className={
                                        unknown
                                            ? 'unknown-text'
                                            : source === loggedInPlayer
                                                ? 'logged-in-player-text'
                                                : 'other-text'
                                    }
                                >
                                    <span
                                        className="link"
                                        onClick={() => {
                                            const filterActor = dpsData[source].actor;
                                            const filter = {name: filterActor.name};
                                            if (type === "damage-done") {
                                                onSelectSourceFilter(filter);
                                            } else {
                                                onSelectTargetFilter(filter);
                                            }
                                        }}
                                    >
                                        {source}
                                    </span>
                                </TableCell>
                                <TableCell style={{textAlign: 'center'}}>
                                    <div style={{display: 'flex', alignItems: 'center'}}>
                                            <span
                                                style={{
                                                    textAlign: 'left',
                                                    minWidth: '50px',
                                                    marginRight: '5px'
                                                }}>{damagePercentage ? `${damagePercentage}%` : ``}</span>
                                        <div style={{
                                            backgroundColor: unknown
                                                ? colors.text.unknown
                                                : source === loggedInPlayer
                                                    ? colors.text.player
                                                    : colors.dpsMeter.playerHighlight,
                                            height: '14px',
                                            marginRight: '10px',
                                            marginTop: '3px',
                                            marginBottom: '3px',
                                            width: calculateBarWidth(data.totalDamage)
                                        }}/>
                                        {data.totalDamage}
                                    </div>
                                </TableCell>
                                {type === "damage-done" && (
                                    <TableCell style={{
                                        width: '60px',
                                        textAlign: 'right',
                                        color: unknown ? colors.text.unknown : getPercentColor(data.activity),
                                    }}>
                                        {unknown ? "-" : `${data.activity}%`}
                                    </TableCell>
                                )}
                                <TableCell style={{width: '70px', textAlign: 'right'}}>{data.accuracy}%</TableCell>
                                <TableCell
                                    style={{
                                        width: '70px',
                                        textAlign: 'right',
                                        color: type === 'damage-done' ? dpsDisplay.color : undefined,
                                    }}
                                    className={type === 'damage-done' && dpsDisplay.useDpsTextClass ? 'dps-text' : undefined}
                                >
                                    {data.dps}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default DPSMeterTable;