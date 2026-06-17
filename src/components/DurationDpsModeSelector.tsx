import React from 'react';
import {Box, Tab, Tabs, SxProps, Theme, useMediaQuery, useTheme} from '@mui/material';
import {SystemStyleObject} from '@mui/material/styles';
import {LeaderboardMode} from '../utils/leaderboardContent';
import RankBadgeCategoryIcon from './badges/RankBadgeCategoryIcon';
import {
    FILTER_TAB_ICON_SIZE,
    FILTER_TAB_ICON_SIZE_MOBILE,
    filterModeTabEndCapSx,
    filterModeTabLabelSx,
    filterModeTabsContainerSx,
    filterModeTabsSx,
    filterModeTabStateSx,
    filterModeTabSx,
} from './filters/filterStyles';

const MODE_OPTIONS: { label: string; value: LeaderboardMode }[] = [
    {label: 'Time', value: 'time'},
    {label: 'DPS', value: 'dps'},
];

interface DurationDpsModeSelectorProps {
    value: LeaderboardMode;
    onChange: (mode: LeaderboardMode) => void;
    embeddedEndCap?: boolean;
    sx?: SxProps<Theme>;
}

const DurationDpsModeSelector: React.FC<DurationDpsModeSelectorProps> = ({
    value,
    onChange,
    embeddedEndCap = false,
    sx,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const tabIconSize = isMobile ? FILTER_TAB_ICON_SIZE_MOBILE : FILTER_TAB_ICON_SIZE;

    return (
        <Box sx={[filterModeTabsContainerSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}>
            <Tabs
                value={value}
                onChange={(_, nextValue: LeaderboardMode) => onChange(nextValue)}
                scrollButtons={false}
                sx={filterModeTabsSx}
            >
                {MODE_OPTIONS.map((option) => (
                    <Tab
                        key={option.value}
                        label={(
                            <Box component="span" sx={filterModeTabLabelSx}>
                                <RankBadgeCategoryIcon
                                    category={option.value}
                                    size={tabIconSize}
                                    color="currentColor"
                                />
                                {option.label}
                            </Box>
                        )}
                        value={option.value}
                        sx={{
                            ...(filterModeTabSx as SystemStyleObject<Theme>),
                            ...(embeddedEndCap ? (filterModeTabEndCapSx as SystemStyleObject<Theme>) : {}),
                            ...filterModeTabStateSx(value === option.value),
                        }}
                    />
                ))}
            </Tabs>
        </Box>
    );
};

export default DurationDpsModeSelector;
