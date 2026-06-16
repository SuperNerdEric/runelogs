import React from 'react';
import {Link as RouterLink} from 'react-router-dom';
import {Box, Typography} from '@mui/material';
import {colors} from '../../theme';
import {getPercentileAccentColor} from '../../utils/percentile';
import {CrownIcon} from '../CrownIcon';
import MedalIcon from '../MedalIcon';

export interface PercentileRankBadgeProps {
    rank: number;
    label: string;
    percentile?: number;
    compact?: boolean;
    href?: string;
}

const nonSelectableSx = {
    userSelect: 'none',
    WebkitUserSelect: 'none',
} as const;

const linkableSx = {
    cursor: 'pointer',
    textDecoration: 'none',
    color: 'inherit',
    '&:hover': {
        filter: 'brightness(1.1)',
    },
} as const;

const PercentileRankBadge: React.FC<PercentileRankBadgeProps> = ({
    rank,
    label,
    percentile,
    compact = false,
    href,
}) => {
    const accentColor = getPercentileAccentColor(percentile);
    const showGlow = !compact && percentile !== undefined && percentile >= 99;

    const inner = compact ? (
        <>
            <Typography
                component="span"
                sx={{color: accentColor, fontWeight: 700, fontSize: '0.7rem', lineHeight: 1.2}}
            >
                #{rank}
            </Typography>
            <Typography component="span" sx={{color: colors.text.primary, fontSize: '0.65rem', lineHeight: 1.2}}>
                {label}
            </Typography>
        </>
    ) : (
        <>
            <Typography
                component="span"
                sx={{color: accentColor, fontWeight: 700, fontSize: {xs: '1rem', sm: '1.15rem'}}}
            >
                #{rank}
            </Typography>
            {rank === 1 && <CrownIcon />}
            {rank === 2 && <MedalIcon color={colors.medal.silver} />}
            {rank === 3 && <MedalIcon color={colors.medal.bronze} />}
            <Typography component="span" sx={{color: colors.text.primary, fontSize: {xs: '0.8rem', sm: '0.9rem'}}}>
                {label}
            </Typography>
        </>
    );

    const sx = compact
        ? {
            ...nonSelectableSx,
            ...(href ? linkableSx : {}),
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.35,
            px: 0.6,
            py: 0.2,
            borderRadius: 0.5,
            border: `1px solid ${accentColor}`,
            background: `linear-gradient(135deg, rgba(22, 27, 34, 0.95) 0%, ${accentColor}22 100%)`,
            verticalAlign: 'middle',
        }
        : {
            ...nonSelectableSx,
            ...(href ? linkableSx : {}),
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.5,
            py: 0.75,
            borderRadius: 1,
            border: `2px solid ${accentColor}`,
            background: `linear-gradient(135deg, rgba(22, 27, 34, 0.95) 0%, ${accentColor}22 100%)`,
            boxShadow: showGlow ? `0 0 12px ${accentColor}55` : undefined,
        };

    if (!href) {
        return (
            <Box component="span" className="fight-group-rank-badge" sx={sx}>
                {inner}
            </Box>
        );
    }

    return (
        <Box component={RouterLink} to={href} className="fight-group-rank-badge" sx={sx}>
            {inner}
        </Box>
    );
};

export default PercentileRankBadge;
