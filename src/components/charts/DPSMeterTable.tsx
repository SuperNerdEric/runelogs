import {Fight} from "../../models/Fight";
import React, {useEffect, useState} from "react";
import {Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from "@mui/material";
import {DamageLog, LogTypes} from "../../models/LogLine";

interface DPSMeterBarChartProps {
    fight: Fight;
    actor: "source" | "target";
}

interface DPSData {
    totalDamage: number;
    totalHits: number;
    successfulHits: number;
    accuracy: number;
    dps: number;
}

const getDPSData = (fight: Fight, actor: "source" | "target"): Record<string, DPSData> => {
    const dpsData: Record<string, DPSData> = {};

    for (const logLine of fight.data) {
        if (logLine.type === LogTypes.DAMAGE) {
            const damageLog = logLine as DamageLog;
            const actorName = actor === "source" ? damageLog.source.name : damageLog.target.name;

            if (!dpsData[actorName]) {
                dpsData[actorName] = {accuracy: 0, dps: 0, totalDamage: 0, totalHits: 0, successfulHits: 0};
            }

            dpsData[actorName].totalDamage += damageLog.damageAmount;
            dpsData[actorName].totalHits += 1;
            if (damageLog.damageAmount > 0) {
                dpsData[actorName].successfulHits += 1;
            }
        }
    }

    const fightDurationSeconds = (fight.lastLine.fightTimeMs! - fight.firstLine.fightTimeMs!) / 1000;

    const dpsArray = Object.entries(dpsData).map(([actor, data]: [string, DPSData]) => {
        const accuracy = (data.successfulHits / data.totalHits) * 100;
        const dps = data.totalDamage / fightDurationSeconds;
        return {actor, damage: data.totalDamage, accuracy, dps};
    });

    for (let dpsDataKey in dpsData) {
        const dpsDataValue = dpsData[dpsDataKey];
        const dpsDataEntry = dpsArray.find(entry => entry.actor === dpsDataKey);
        if (dpsDataEntry) {
            dpsDataValue.accuracy = Number(dpsDataEntry.accuracy.toFixed(2));
            dpsDataValue.dps = Number(dpsDataEntry.dps.toFixed(3));
        }
    }

    return dpsData;
}

const DPSMeterTable: React.FC<DPSMeterBarChartProps> = ({fight, actor}) => {
    const loggedInPlayer = fight.loggedInPlayer;

    const dpsData = getDPSData(fight, actor);
    const totalDamage = Object.values(dpsData).reduce((acc, cur) => acc + cur.totalDamage, 0);

    const [maxWidth, setMaxWidth] = useState<number>(0);

    useEffect(() => {
        const handleResize = () => {
            // Handle this better
            let vwWidth = window.innerWidth * 0.7 - 300;
            if (vwWidth > 600) {
                vwWidth = 600;
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
                        <TableCell style={{width: '100px', textAlign: 'center'}}>Accuracy</TableCell>
                        <TableCell style={{width: '70px', textAlign: 'center'}}>DPS</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedDPSData.map(([source, data]: [string, DPSData], index: number) => {
                        const damagePercentage = Number(((data.totalDamage / totalDamage) * 100).toFixed(2));

                        return (
                            <TableRow key={index} className={index % 2 === 0 ? 'even-row' : 'odd-row'}
                                      style={{cursor: 'default'}}
                                      onMouseEnter={(e) => e.currentTarget.classList.add('highlighted-row')}
                                      onMouseLeave={(e) => e.currentTarget.classList.remove('highlighted-row')}>
                                <TableCell
                                    style={{width: '100px', textAlign: 'left'}}
                                    className={source === loggedInPlayer ? 'logged-in-player-text' : 'other-text'}
                                >
                                    {source}
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
                                            backgroundColor: source === loggedInPlayer ? '#abd473' : '#007bff',
                                            height: '14px',
                                            marginRight: '10px',
                                            marginTop: '3px',
                                            marginBottom: '3px',
                                            width: calculateBarWidth(data.totalDamage)
                                        }}/>
                                        {data.totalDamage}
                                    </div>
                                </TableCell>
                                <TableCell style={{width: '70px', textAlign: 'right'}}>{data.accuracy}%</TableCell>
                                <TableCell style={{width: '70px', textAlign: 'right'}}
                                           className={'dps-text'}>{data.dps}</TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default DPSMeterTable;