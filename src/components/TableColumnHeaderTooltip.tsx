import React from 'react';
import AppTooltip from './AppTooltip';

interface TableColumnHeaderTooltipProps {
    label: string;
    tooltip: string;
}

const TableColumnHeaderTooltip: React.FC<TableColumnHeaderTooltipProps> = ({label, tooltip}) => (
    <AppTooltip title={tooltip} arrow placement="top">
        <span style={{cursor: 'help', borderBottom: '1px dotted currentColor'}}>
            {label}
        </span>
    </AppTooltip>
);

export default TableColumnHeaderTooltip;
