import React from 'react';
import {Box, Tab, Tabs, SxProps, Theme} from '@mui/material';
import {colors} from '../theme';
import {LeaderboardMode} from '../utils/leaderboardContent';
import RankBadgeCategoryIcon from './badges/RankBadgeCategoryIcon';

const tabsContainerSx = {
    display: 'inline-flex',
    bgcolor: colors.background.surfaceAlt,
    borderRadius: '8px',
    border: `1px solid ${colors.border.default}`,
    p: '4px',
} as const;

const tabsSx = {
    minHeight: 44,
    '& .MuiTabs-flexContainer': {
        gap: '4px',
    },
    '& .MuiTabs-indicator': {
        display: 'none',
    },
} as const;

const tabSx = {
    color: 'white',
    fontSize: {xs: '1.1rem', sm: '1.35rem'},
    fontWeight: 600,
    textTransform: 'none',
    minHeight: 44,
    py: 1,
    px: {xs: 1.5, sm: 2},
    borderRadius: '6px',
    transition: 'background-color 0.15s ease, color 0.15s ease',
} as const;

const tabLabelSx = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.75,
} as const;

const tabStateSx = (selected: boolean) => ({
    color: selected ? colors.text.lightblue : colors.text.muted,
    bgcolor: selected ? colors.background.surfaceSelected : 'transparent',
    '&:hover': {
        bgcolor: selected ? colors.background.surfaceSelected : colors.background.hover,
        color: selected ? colors.text.lightblue : colors.text.primary,
    },
});

const MODE_OPTIONS: { label: string; value: LeaderboardMode }[] = [
    {label: 'Duration', value: 'duration'},
    {label: 'DPS', value: 'dps'},
];

interface DurationDpsModeSelectorProps {
    value: LeaderboardMode;
    onChange: (mode: LeaderboardMode) => void;
    sx?: SxProps<Theme>;
}

const DurationDpsModeSelector: React.FC<DurationDpsModeSelectorProps> = ({value, onChange, sx}) => (
    <Box sx={{...tabsContainerSx, mb: 2, ...sx}}>
        <Tabs
            value={value}
            onChange={(_, nextValue: LeaderboardMode) => onChange(nextValue)}
            sx={tabsSx}
        >
            {MODE_OPTIONS.map((option) => (
                <Tab
                    key={option.value}
                    label={(
                        <Box component="span" sx={tabLabelSx}>
                            <RankBadgeCategoryIcon
                                category={option.value}
                                size={22}
                                color="currentColor"
                            />
                            {option.label}
                        </Box>
                    )}
                    value={option.value}
                    sx={{
                        ...tabSx,
                        ...tabStateSx(value === option.value),
                    }}
                />
            ))}
        </Tabs>
    </Box>
);

export default DurationDpsModeSelector;
