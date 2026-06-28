import React from 'react';
import {cn} from '@/lib/utils';
import {
    filterToolbarClass,
    filterToolbarDividerClass,
    filterToolbarFiltersRowClass,
    filterToolbarWithModeClass,
} from './filterStyles';

interface FilterToolbarProps {
    /** Filters rendered before the mode selector (e.g. content, party size). */
    leadingFilters?: React.ReactNode;
    modeSelector?: React.ReactNode;
    /** Filters rendered after the mode selector (e.g. DPS fight picker). */
    trailingFilters?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
}

function hasToolbarContent(node?: React.ReactNode): boolean {
    if (node == null || node === false) {
        return false;
    }
    if (Array.isArray(node)) {
        return node.some(hasToolbarContent);
    }
    return true;
}

const FilterToolbar: React.FC<FilterToolbarProps> = ({
    leadingFilters,
    modeSelector,
    trailingFilters,
    children,
    className,
}) => {
    const hasLeading = hasToolbarContent(leadingFilters);
    const hasTrailing = hasToolbarContent(trailingFilters);
    const hasChildren = React.Children.count(children) > 0;
    const hasMode = Boolean(modeSelector);
    const useSplitLayout = hasLeading || hasTrailing;

    if (!hasLeading && !hasMode && !hasTrailing && !hasChildren) {
        return null;
    }

    if (useSplitLayout) {
        const sectionCount = [hasLeading, hasMode, hasTrailing].filter(Boolean).length;
        const useChipLayout = sectionCount >= 2;

        const embeddedModeSelector = modeSelector && React.isValidElement<{embeddedEndCap?: boolean}>(modeSelector)
            ? React.cloneElement(modeSelector, {embeddedEndCap: !hasTrailing})
            : modeSelector;

        return (
            <div
                className={cn(
                    useChipLayout ? filterToolbarWithModeClass : filterToolbarClass,
                    className,
                )}
            >
                {hasLeading && (
                    <div className={filterToolbarFiltersRowClass(useChipLayout)}>
                        {leadingFilters}
                    </div>
                )}
                {hasLeading && hasMode && <div className={filterToolbarDividerClass}/>}
                {embeddedModeSelector}
                {hasMode && hasTrailing && <div className={filterToolbarDividerClass}/>}
                {hasTrailing && (
                    <div className={filterToolbarFiltersRowClass(useChipLayout)}>
                        {trailingFilters}
                    </div>
                )}
            </div>
        );
    }

    const hasModeAndFilters = Boolean(modeSelector && hasChildren);

    const embeddedModeSelector = modeSelector && React.isValidElement<{embeddedEndCap?: boolean}>(modeSelector)
        ? React.cloneElement(modeSelector, {embeddedEndCap: !hasChildren})
        : modeSelector;

    return (
        <div
            className={cn(
                hasModeAndFilters ? filterToolbarWithModeClass : filterToolbarClass,
                className,
            )}
        >
            {embeddedModeSelector}
            {hasModeAndFilters && <div className={filterToolbarDividerClass}/>}
            {hasChildren && (
                <div className={filterToolbarFiltersRowClass(hasModeAndFilters)}>
                    {children}
                </div>
            )}
        </div>
    );
};

export default FilterToolbar;
