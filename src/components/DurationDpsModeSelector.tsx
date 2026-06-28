import React from 'react';
import {
    getLeaderboardModeLabel,
    getLeaderboardModesForContent,
    LeaderboardMode,
} from '../utils/leaderboardContent';
import RankBadgeCategoryIcon from './badges/RankBadgeCategoryIcon';
import {useIsMobile} from '@/hooks/useMediaQuery';
import {
    FILTER_TAB_ICON_SIZE,
    FILTER_TAB_ICON_SIZE_MOBILE,
    filterModeTabClass,
    filterModeTabEndCapClass,
    filterModeTabLabelClass,
    filterModeTabsClass,
    filterModeTabsContainerClass,
    filterModeTabStateClass,
} from './filters/filterStyles';
import {cn} from '@/lib/utils';

interface DurationDpsModeSelectorProps {
    value: LeaderboardMode;
    contentName: string;
    onChange: (mode: LeaderboardMode) => void;
    embeddedEndCap?: boolean;
    className?: string;
}

const DurationDpsModeSelector: React.FC<DurationDpsModeSelectorProps> = ({
    value,
    contentName,
    onChange,
    embeddedEndCap = false,
    className,
}) => {
    const isMobile = useIsMobile();
    const tabIconSize = isMobile ? FILTER_TAB_ICON_SIZE_MOBILE : FILTER_TAB_ICON_SIZE;
    const modeOptions = getLeaderboardModesForContent(contentName).map((mode) => ({
        value: mode,
        label: getLeaderboardModeLabel(contentName, mode),
    }));

    return (
        <div className={cn(filterModeTabsContainerClass, className)}>
            <div className={filterModeTabsClass} role="tablist">
                {modeOptions.map((option) => {
                    const isSelected = value === option.value;
                    const tabClassName = [
                        filterModeTabClass,
                        embeddedEndCap ? filterModeTabEndCapClass : '',
                        filterModeTabStateClass(isSelected),
                    ].filter(Boolean).join(' ');

                    return (
                        <button
                            key={option.value}
                            type="button"
                            role="tab"
                            aria-selected={isSelected}
                            className={tabClassName}
                            onClick={() => onChange(option.value)}
                        >
                            <span className={filterModeTabLabelClass}>
                                <RankBadgeCategoryIcon
                                    category={option.value}
                                    size={tabIconSize}
                                    color="currentColor"
                                />
                                {option.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default DurationDpsModeSelector;
