import React from 'react';
import {Tooltip} from '@mui/material';

interface TableColumnHeaderTooltipProps {
    label: string;
    tooltip: string;
}

const TableColumnHeaderTooltip: React.FC<TableColumnHeaderTooltipProps> = ({label, tooltip}) => (
    <Tooltip
        title={tooltip}
        arrow
        placement="top"
        enterDelay={200}
        enterTouchDelay={0}
    >
        <span style={{cursor: 'help', borderBottom: '1px dotted currentColor'}}>
            {label}
        </span>
    </Tooltip>
);

export default TableColumnHeaderTooltip;
