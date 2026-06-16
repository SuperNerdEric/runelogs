import React from 'react';
import {Icon} from '@iconify/react';
import {colors} from '../../theme';

export type RankBadgeCategory = 'duration' | 'dps';

const CATEGORY_ICONS: Record<RankBadgeCategory, string> = {
    duration: 'mdi:clock-outline',
    dps: 'mdi:sword',
};

interface RankBadgeCategoryIconProps {
    category: RankBadgeCategory;
    size: number;
}

const RankBadgeCategoryIcon: React.FC<RankBadgeCategoryIconProps> = ({category, size}) => (
    <Icon
        icon={CATEGORY_ICONS[category]}
        style={{
            fontSize: size,
            width: size,
            height: size,
            color: colors.text.muted,
            flexShrink: 0,
            display: 'inline-block',
            verticalAlign: 'middle',
        }}
        aria-hidden
    />
);

export default RankBadgeCategoryIcon;
