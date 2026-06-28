import React, {useEffect, useState} from 'react';
import TableColumnHeaderTooltip from '../TableColumnHeaderTooltip';
import {COLUMN_TOOLTIPS} from '../../utils/columnTooltips';
import {colors} from '../../theme';
import {isUnknownPlayer} from '../../utils/actorUtils';

export interface DamageMeterRow {
    key: string;
    name: React.ReactNode;
    damageDealt: number;
    dps: number;
    dpsColor?: string;
    useDpsTextClass?: boolean;
    nameClassName?: string;
}

interface DamageMeterTableProps {
    rows: DamageMeterRow[];
}

const DamageMeterTable: React.FC<DamageMeterTableProps> = ({rows}) => {
    const [maxWidth, setMaxWidth] = useState(0);
    const totalDamage = rows.reduce((sum, row) => sum + row.damageDealt, 0);
    const highestDamage = Math.max(...rows.map((row) => row.damageDealt), 0);

    useEffect(() => {
        const handleResize = () => {
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
        if (highestDamage === 0) {
            return '0px';
        }
        return `${(damage / highestDamage) * maxWidth}px`;
    };

    const sortedRows = [...rows].sort((a, b) => b.damageDealt - a.damageDealt);

    return (
        <div className="app-table-container">
            <table className="app-table" style={{tableLayout: 'auto', width: '100%'}}>
                <thead>
                    <tr>
                        <th style={{width: '100px', textAlign: 'center'}}>Name</th>
                        <th style={{textAlign: 'center', paddingBottom: '2px'}}>Amount</th>
                        <th style={{width: '70px', textAlign: 'center'}}>
                            <TableColumnHeaderTooltip
                                label="DPS"
                                tooltip={COLUMN_TOOLTIPS.dps}
                            />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedRows.map((row, index) => {
                        const damagePercentage = totalDamage > 0
                            ? Number(((row.damageDealt / totalDamage) * 100).toFixed(2))
                            : 0;
                        const unknown = isUnknownPlayer(row.key);

                        return (
                            <tr
                                key={row.key}
                                className={index % 2 === 0 ? 'even-row' : 'odd-row'}
                                style={{cursor: 'default'}}
                                onMouseEnter={(e) => e.currentTarget.classList.add('highlighted-row')}
                                onMouseLeave={(e) => e.currentTarget.classList.remove('highlighted-row')}
                            >
                                <td
                                    style={{width: '100px', textAlign: 'left'}}
                                    className={unknown ? 'unknown-text' : (row.nameClassName ?? 'other-text')}
                                >
                                    {row.name}
                                </td>
                                <td style={{textAlign: 'center'}}>
                                    <div style={{display: 'flex', alignItems: 'center'}}>
                                        <span
                                            style={{
                                                textAlign: 'left',
                                                minWidth: '50px',
                                                marginRight: '5px',
                                            }}
                                        >
                                            {damagePercentage ? `${damagePercentage}%` : ''}
                                        </span>
                                        <div
                                            style={{
                                                backgroundColor: unknown
                                                    ? colors.text.unknown
                                                    : colors.dpsMeter.playerHighlight,
                                                height: '14px',
                                                marginRight: '10px',
                                                marginTop: '3px',
                                                marginBottom: '3px',
                                                width: calculateBarWidth(row.damageDealt),
                                            }}
                                        />
                                        {row.damageDealt}
                                    </div>
                                </td>
                                <td
                                    style={{
                                        width: '70px',
                                        textAlign: 'right',
                                        color: unknown ? colors.text.unknown : row.dpsColor,
                                    }}
                                    className={!unknown && row.useDpsTextClass ? 'dps-text' : undefined}
                                >
                                    {row.dps.toFixed(3)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default DamageMeterTable;
