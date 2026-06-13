import type {MouseEvent} from 'react';
import type {NavigateFunction} from 'react-router-dom';
import type {TableRowProps} from '@mui/material';

export function encounterTableRowProps(
    navigate: NavigateFunction,
    encounterId: string | undefined,
): Partial<TableRowProps> {
    if (!encounterId) {
        return {};
    }

    return {
        hover: true,
        onClick: () => navigate(`/encounter/${encounterId}`),
        sx: {cursor: 'pointer'},
    };
}

export function logTableRowProps(
    navigate: NavigateFunction,
    logId: string,
): Partial<TableRowProps> {
    return {
        hover: true,
        onClick: () => navigate(`/log/${logId}`),
        sx: {cursor: 'pointer'},
    };
}

export function stopRowClick(event: MouseEvent) {
    event.stopPropagation();
}
