import React from 'react';
import {Box, MenuItem, Select, SelectChangeEvent, SxProps, Theme, useMediaQuery, useTheme} from '@mui/material';
import {
    FILTER_FIELD_ICON_SIZE,
    FILTER_FIELD_ICON_SIZE_MOBILE,
    filterMenuPaperSx,
    filterSelectCompactSx,
    filterSelectSx,
} from './filterStyles';
import FilterFieldIcon, {FilterFieldKind} from './FilterFieldIcon';

export interface FilterSelectOption<T extends string | number> {
    value: T;
    label: React.ReactNode;
}

const FIELD_LABELS: Record<FilterFieldKind, string> = {
    content: 'Content',
    fight: 'Fight',
    team: 'Team size',
};

interface FilterSelectProps<T extends string | number> {
    field?: FilterFieldKind;
    value: T;
    options: FilterSelectOption<T>[];
    onChange: (value: T) => void;
    compact?: boolean;
    sx?: SxProps<Theme>;
}

function FilterSelect<T extends string | number>({
    field,
    value,
    options,
    onChange,
    compact = false,
    sx,
}: FilterSelectProps<T>) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const fieldIconSize = isMobile ? FILTER_FIELD_ICON_SIZE_MOBILE : FILTER_FIELD_ICON_SIZE;
    const accessibleLabel = field ? FIELD_LABELS[field] : undefined;

    const select = (
        <Select
            value={value}
            onChange={(event: SelectChangeEvent<T>) => onChange(event.target.value as T)}
            size="small"
            inputProps={accessibleLabel ? {'aria-label': accessibleLabel} : undefined}
            MenuProps={{PaperProps: {sx: filterMenuPaperSx}}}
            sx={[
                compact ? filterSelectCompactSx : filterSelectSx,
                ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
            ] as SxProps<Theme>}
        >
            {options.map((option) => (
                <MenuItem key={String(option.value)} value={option.value}>
                    {option.label}
                </MenuItem>
            ))}
        </Select>
    );

    if (field !== 'team') {
        return select;
    }

    return (
        <Box sx={{display: 'inline-flex', alignItems: 'center', gap: {xs: 0.4375, sm: 0.75}}}>
            <Box
                component="span"
                title={FIELD_LABELS.team}
                sx={{display: 'inline-flex', alignItems: 'center', lineHeight: 0}}
            >
                <FilterFieldIcon field="team" size={fieldIconSize}/>
            </Box>
            {select}
        </Box>
    );
}

export default FilterSelect;
