import type {MouseEvent} from 'react';
import type {NavigateFunction} from 'react-router-dom';
import type {TableRowProps} from '@mui/material';

export type EncounterLinkOptions = {
    encounterType?: 'fight' | 'fightGroup';
    fightKey?: string;
    durationResultType?: 'fight' | 'fightGroup';
};

/** User-facing URL segment for raid/wave run summary pages. */
export const RUN_SUMMARY_PATH = '/run';

export function getRunSummaryHref(id: string): string {
    return `${RUN_SUMMARY_PATH}/${id}`;
}

export function getEncounterHref(
    encounterId: string,
    options?: EncounterLinkOptions,
): string {
    if (options?.durationResultType === 'fightGroup') {
        return getRunSummaryHref(encounterId);
    }
    if (
        options?.encounterType === 'fightGroup' &&
        (!options.fightKey || options.fightKey === 'Overall')
    ) {
        return getRunSummaryHref(encounterId);
    }
    return `/encounter/${encounterId}`;
}

export function encounterTableRowProps(
    navigate: NavigateFunction,
    encounterId: string | undefined,
    options?: EncounterLinkOptions,
): Partial<TableRowProps> {
    if (!encounterId) {
        return {};
    }

    return {
        hover: true,
        onClick: () => navigate(getEncounterHref(encounterId, options)),
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
