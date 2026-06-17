import React from 'react';
import {Icon} from '@iconify/react';
import {colors} from '../../theme';

import {FILTER_FIELD_ICON_SIZE} from './filterStyles';

export type FilterFieldKind = 'content' | 'fight' | 'team';

export {FILTER_FIELD_ICON_SIZE};

/** Iconify ids — team: party size */
const FIELD_ICONS: Record<Extract<FilterFieldKind, 'team'>, string> = {
    team: 'mdi:account',
};

interface FilterFieldIconProps {
    field: Extract<FilterFieldKind, 'team'>;
    size?: number;
    color?: string;
}

const FilterFieldIcon: React.FC<FilterFieldIconProps> = ({
    field,
    size = FILTER_FIELD_ICON_SIZE,
    color = colors.text.primary,
}) => (
    <Icon
        icon={FIELD_ICONS[field]}
        style={{
            fontSize: size,
            width: size,
            height: size,
            color,
            flexShrink: 0,
            display: 'inline-block',
            verticalAlign: 'middle',
        }}
        aria-hidden
    />
);

export default FilterFieldIcon;
