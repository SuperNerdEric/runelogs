import type {MouseEvent} from 'react';
import type {NavigateFunction} from 'react-router-dom';

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

export type ClickableTableRowProps = {
    className?: string;
    onClick?: () => void;
};

export function encounterTableRowProps(
    navigate: NavigateFunction,
    encounterId: string | undefined,
    options?: EncounterLinkOptions,
): ClickableTableRowProps {
    if (!encounterId) {
        return {};
    }

    return {
        className: 'app-table-row--hover',
        onClick: () => navigate(getEncounterHref(encounterId, options)),
    };
}

export function logTableRowProps(
    navigate: NavigateFunction,
    logId: string,
): ClickableTableRowProps {
    return {
        className: 'app-table-row--hover',
        onClick: () => navigate(`/log/${logId}`),
    };
}

export function stopRowClick(event: MouseEvent) {
    event.stopPropagation();
}
