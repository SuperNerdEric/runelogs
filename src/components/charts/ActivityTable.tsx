import {Fight} from "../../models/Fight";
import React from "react";
import TableColumnHeaderTooltip from "../TableColumnHeaderTooltip";
import {COLUMN_TOOLTIPS} from "../../utils/columnTooltips";
import {FightPerformance, getFightPerformanceByPlayer, getPercentColor} from "../../utils/TickActivity";
import {calculateWeightedAveragesByPlayer} from "./Boosts";
import {Levels} from "../../models/Levels";
import {statImages} from "../EventsTable";
import {useIsMobile} from "../../hooks/useMediaQuery";

interface ActivityTableProps {
    fight: Fight;
}

const ActivityTable: React.FC<ActivityTableProps> = ({fight}) => {
    const performanceByPlayer = getFightPerformanceByPlayer(fight);
    const averageLevelsByPlayer = calculateWeightedAveragesByPlayer(fight);
    const isMobile = useIsMobile();

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
        <div className="app-table-container">
            <table className="app-table" style={{tableLayout: 'auto', width: '100%'}}>
                <thead>
                    <tr>
                        <th style={{width: '100px', textAlign: 'center'}}>Name</th>
                        <th style={{width: '100px', textAlign: 'center'}}>
                            <TableColumnHeaderTooltip
                                label="Activity"
                                tooltip={COLUMN_TOOLTIPS.activity}
                            />
                        </th>
                        <th style={{width: '100px', textAlign: 'center'}}>Boosted Hits</th>
                        <th colSpan={Object.keys(statImages).length} style={{textAlign: 'center'}}>
                            Averages
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {[...performanceByPlayer.entries()]
                        .sort(([, a], [, b]) => getActivityPercent(b) - getActivityPercent(a))
                        .map(([player, perf], index) => {
                            const activity = getActivityPercent(perf);
                            const boosted = getBoostedPercent(perf);
                            const avgLevels = averageLevelsByPlayer.get(player);

                            return (
                                <tr
                                    key={player}
                                    className={index % 2 === 0 ? 'even-row' : 'odd-row'}
                                    style={{cursor: 'default'}}
                                    onMouseEnter={(e) => e.currentTarget.classList.add('highlighted-row')}
                                    onMouseLeave={(e) => e.currentTarget.classList.remove('highlighted-row')}
                                >
                                    <td style={{textAlign: 'center'}}>{player}</td>
                                    <td style={{
                                        textAlign: 'center',
                                        color: getPercentColor(activity),
                                    }}>{formatPercent(activity)}</td>
                                    <td style={{
                                        textAlign: 'center',
                                        color: !perf.hasBoostedLevels ? undefined : getPercentColor(boosted),
                                    }}>
                                        {!perf.hasBoostedLevels ? "-" : formatPercent(boosted)}
                                    </td>
                                    {Object.keys(statImages).map((stat, statIndex, array) => {
                                        const value = avgLevels?.[stat as keyof Levels];
                                        const isLast = statIndex === array.length - 1;

                                        return (
                                            <td
                                                key={stat}
                                                style={{
                                                    textAlign: 'left',
                                                    whiteSpace: 'nowrap',
                                                    padding: '2px 8px',
                                                    borderLeft: 'none',
                                                    borderRight: 'none',
                                                    verticalAlign: 'middle',
                                                    width: isLast ? 'auto' : '50px',
                                                }}
                                            >
                                                {value != null && !isNaN(value) ? (
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            flexDirection: isMobile ? 'column' : 'row',
                                                            gap: isMobile ? '2px' : '5px',
                                                        }}
                                                    >
                                                        <img
                                                            src={statImages[stat as keyof Levels]}
                                                            alt={stat}
                                                            style={{
                                                                height: '18px',
                                                                verticalAlign: 'middle',
                                                                marginLeft: '0px',
                                                            }}
                                                        />
                                                        <span style={{verticalAlign: 'middle'}}>
                                                            {Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                </tbody>
            </table>
        </div>
    );
};

export default ActivityTable;
