import React from 'react';
import {Box, Link, Typography} from '@mui/material';
import {Link as RouterLink} from 'react-router-dom';
import {colors, contentColumnSx, fontSizes, media} from '../theme';

const footerLinkSx = {
    color: colors.text.muted,
    fontSize: fontSizes.sm,
    textDecoration: 'none',
    '&:hover': {
        color: colors.text.link,
        textDecoration: 'underline',
    },
};

const internalLinks = [
    {label: 'Help', to: '/help'},
    {label: 'Privacy Policy', to: '/privacy'},
] as const;

const externalLinks = [
    {
        label: 'Combat Logger',
        href: 'https://runelite.net/plugin-hub/show/combat-logger',
    },
    {label: 'Discord', href: 'https://discord.gg/ZydwX7AJEd'},
    {label: 'GitHub', href: 'https://github.com/SuperNerdEric/runelogs'},
] as const;

const SiteFooter: React.FC = () => {
    const year = new Date().getFullYear();

    return (
        <Box
            component="footer"
            sx={{
                mt: 'auto',
                width: '100%',
                borderTop: `1px solid ${colors.border.default}`,
                bgcolor: colors.background.topBar,
            }}
        >
            <Box
                sx={{
                    ...contentColumnSx,
                    px: 2,
                    py: 3,
                    [media.mobileDown]: {px: 1.5, py: 2.5},
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: {xs: 1, sm: 2},
                        mb: 2,
                    }}
                >
                    {internalLinks.map((link) => (
                        <Link
                            key={link.to}
                            component={RouterLink}
                            to={link.to}
                            sx={footerLinkSx}
                        >
                            {link.label}
                        </Link>
                    ))}
                    {externalLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={footerLinkSx}
                        >
                            {link.label}
                        </Link>
                    ))}
                </Box>

                <Typography
                    sx={{
                        color: colors.text.muted,
                        fontSize: fontSizes.sm,
                        lineHeight: 1.6,
                        mb: 1,
                    }}
                >
                    Combat log analysis for Old School RuneScape.
                </Typography>
                <Typography
                    sx={{
                        color: colors.text.muted,
                        fontSize: fontSizes.xs,
                        lineHeight: 1.5,
                    }}
                >
                    &copy; {year} Runelogs. Not affiliated with Jagex Ltd.
                </Typography>
            </Box>
        </Box>
    );
};

export default SiteFooter;
