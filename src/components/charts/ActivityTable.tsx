import {Fight} from "../../models/Fight";
import React from "react";
import {Table, TableBody, TableCell, TableContainer, TableHead, TableRow,} from "@mui/material";
import {FightPerformance, getFightPerformanceByPlayer, getPercentColor} from "../../utils/TickActivity";
import {calculateWeightedAveragesByPlayer} from "./Boosts";
import {Levels} from "../../models/Levels";
import {statImages} from "../EventsTable";

interface ActivityTableProps {
    fight: Fight;
}

const ActivityTable: React.FC<ActivityTableProps> = ({fight}) => {
    const performanceByPlayer = getFightPerformanceByPlayer(fight);
    const averageLevelsByPlayer = calculateWeightedAveragesByPlayer(fight);

    const fightLengthMs = (fight.metaData.fightDurationTicks ?? 0) * 600;

    const formatPercent = (value: number): string => {
        if (isNaN(value)) return "N/A";
        const rounded = Math.round(value * 100) / 100;
        return rounded % 1 === 0 ? rounded.toFixed(0) + "%" : rounded.toFixed(2) + "%";
    };

    const getActivityPercent = (p: FightPerformance): number =>
        (p.activeTime / (fightLengthMs / 1000)) * 100;

    const getBoostedPercent = (p: FightPerformance): number =>
        (p.boostedHits / p.actualWeaponHits) * 100;

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
                        <TableCell style={{width: '100px', textAlign: 'center'}}>Activity</TableCell>
                        <TableCell style={{width: '100px', textAlign: 'center'}}>Boosted Hits</TableCell>
                        <TableCell colSpan={Object.keys(statImages).length} style={{textAlign: 'center'}}>
                            Averages
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {[...performanceByPlayer.entries()]
                        .sort(([, a], [, b]) => getActivityPercent(b) - getActivityPercent(a))
                        .map(([player, perf], index) => {
                            const activity = getActivityPercent(perf);
                            const boosted = getBoostedPercent(perf);
                            const avgLevels = averageLevelsByPlayer.get(player);

                            return (
                                <TableRow
                                    key={player}
                                    className={index % 2 === 0 ? 'even-row' : 'odd-row'}
                                    style={{cursor: 'default'}}
                                    onMouseEnter={(e) => e.currentTarget.classList.add('highlighted-row')}
                                    onMouseLeave={(e) => e.currentTarget.classList.remove('highlighted-row')}
                                >
                                    <TableCell style={{textAlign: 'center'}}>{player}</TableCell>
                                    <TableCell style={{
                                        textAlign: 'center',
                                        color: getPercentColor(activity)
                                    }}>{formatPercent(activity)}</TableCell>
                                    <TableCell style={{
                                        textAlign: 'center',
                                        color: !perf.hasBoostedLevels ? undefined : getPercentColor(boosted)
                                    }}>
                                        {!perf.hasBoostedLevels ? "-" : formatPercent(boosted)}
                                    </TableCell>
                                    {Object.keys(statImages).map((stat, index, array) => {
                                        const value = avgLevels?.[stat as keyof Levels];
                                        const isLast = index === array.length - 1;

                                        return (
                                            <TableCell
                                                key={stat}
                                                sx={{
                                                    textAlign: 'left',
                                                    whiteSpace: 'nowrap',
                                                    padding: '2px 8px',
                                                    borderLeft: 'none',
                                                    borderRight: 'none',
                                                    verticalAlign: 'middle',
                                                    width: isLast ? 'auto' : '50px', // allow last stat to take slack
                                                }}
                                            >
                                                {value != null && !isNaN(value) ? (
                                                    <>
                                                        <img
                                                            src={statImages[stat as keyof Levels]}
                                                            alt={stat}
                                                            style={{
                                                                height: '18px',
                                                                verticalAlign: 'middle',
                                                                marginLeft: '0px',
                                                                marginRight: '4px',
                                                            }}
                                                        />
                                                        <span style={{verticalAlign: 'middle'}}>
                                                            {Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                        );
                                    })}

                                </TableRow>
                            );
                        })}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default ActivityTable;
