import React from 'react';
import AppTooltip from './AppTooltip';

interface TableColumnHeaderTooltipProps {
    label: string;
    tooltip: string;
}

const TableColumnHeaderTooltip: React.FC<TableColumnHeaderTooltipProps> = ({label, tooltip}) => (
    <AppTooltip title={tooltip} side="top">
        <span
            className="inline-block align-middle leading-none"
            style={{cursor: 'help', borderBottom: '1px dotted currentColor'}}
        >
            {label}
        </span>
    </AppTooltip>
);

export default TableColumnHeaderTooltip;
