import React from 'react';
import {Box, Typography} from '@mui/material';
import {SvgIconProps} from '@mui/material/SvgIcon';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import {colors, media} from '../theme';

export type HomeHeroProps = {
    icon?: React.ElementType<SvgIconProps>;
    iconColor: string;
    iconBg?: string;
    iconBorder?: string;
    tagline: React.ReactNode;
    subtitle: React.ReactNode;
};

export function HomeHero({icon: Icon = QueryStatsIcon, iconColor, iconBg, iconBorder, tagline, subtitle}: HomeHeroProps) {
    const iconWrapperSx = iconBg || iconBorder ? {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 110,
        height: 110,
        borderRadius: 2,
        bgcolor: iconBg,
        border: iconBorder
            ? iconBorder.includes('gradient')
                ? '2px solid transparent'
                : `2px solid ${iconBorder}`
            : undefined,
        background: iconBorder?.includes('gradient')
            ? `linear-gradient(${colors.background.page}, ${colors.background.page}) padding-box, ${iconBorder} border-box`
            : iconBg,
        [media.desktopUp]: {width: 96, height: 96},
    } : undefined;

    const icon = (
        <Icon sx={{
            fontSize: 64,
            color: iconColor,
            [media.desktopUp]: {fontSize: 56},
        }}/>
    );

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            mb: 2,
            pt: 2,
            pb: 0.5,
            userSelect: 'none',
            [media.desktopUp]: {gap: 1.5, pt: 0.5},
        }}>
            <Box sx={{display: 'none', [media.desktopUp]: {display: 'block'}}}>
                {iconWrapperSx ? <Box sx={iconWrapperSx}>{icon}</Box> : icon}
            </Box>
            <Typography
                variant="h4"
                sx={{
                    textAlign: 'center',
                    lineHeight: 1.3,
                    fontWeight: 600,
                    m: 0,
                    fontSize: '1.625rem',
                    [media.desktopUp]: {fontSize: '2.125rem'},
                }}
            >
                {tagline}
            </Typography>
            <Typography
                variant="h6"
                sx={{
                    textAlign: 'center',
                    fontWeight: 400,
                    m: 0,
                    fontSize: '1.1875rem',
                    [media.desktopUp]: {fontSize: '1.25rem'},
                }}
            >
                {subtitle}
            </Typography>
        </Box>
    );
}
