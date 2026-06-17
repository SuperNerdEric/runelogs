import React from 'react';
import {Box, SxProps, Theme} from '@mui/material';
import {
    filterToolbarDividerSx,
    filterToolbarFiltersRowSx,
    filterToolbarSx,
    filterToolbarWithModeSx,
} from './filterStyles';

interface FilterToolbarProps {
    modeSelector?: React.ReactNode;
    children?: React.ReactNode;
    sx?: SxProps<Theme>;
}

const FilterToolbar: React.FC<FilterToolbarProps> = ({modeSelector, children, sx}) => {
    const hasFilters = React.Children.count(children) > 0;

    if (!modeSelector && !hasFilters) {
        return null;
    }

    const hasModeAndFilters = Boolean(modeSelector && hasFilters);

    const embeddedModeSelector = modeSelector && React.isValidElement(modeSelector)
        ? React.cloneElement(modeSelector, {embeddedEndCap: !hasFilters})
        : modeSelector;

    return (
        <Box
            sx={[
                hasModeAndFilters ? filterToolbarWithModeSx : filterToolbarSx,
                ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
            ]}
        >
            {embeddedModeSelector}
            {hasModeAndFilters && <Box sx={filterToolbarDividerSx}/>}
            {hasFilters && (
                <Box sx={filterToolbarFiltersRowSx(hasModeAndFilters)}>
                    {children}
                </Box>
            )}
        </Box>
    );
};

export default FilterToolbar;
