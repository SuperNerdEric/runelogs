import React from 'react';
import Leaderboard from './Leaderboard';
import {Box, Link, Typography} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {Link as RouterLink} from 'react-router-dom';
import OverallRecentEncounters from "./OverallRecentEncounters";
import {useAuth0} from '@auth0/auth0-react';
import {colors, contentColumnSx, media} from '../theme';
import {HomeHero} from './HomeHero';
import {HomeHeroSubtitle, HomeHeroTagline} from './homeHeroContent';

export default function Home() {
    const {isAuthenticated} = useAuth0();

    return (
        <Box sx={{...contentColumnSx, px: 2, pb: 0, [media.mobileDown]: {px: 1}}}>
            <Box sx={{[media.mobileDown]: {mx: -0.5}}}>
                <HomeHero
                    icon={TrendingUpIcon}
                    iconColor={colors.text.logs}
                    tagline={<HomeHeroTagline/>}
                    subtitle={<HomeHeroSubtitle/>}
                />
            </Box>
            <Typography paragraph>
                Runelogs works with the{' '}
                <Link href="https://runelite.net/plugin-hub/show/combat-logger" target="_blank" rel="noopener">
                    Combat Logger
                </Link>{' '}
                plugin.{' '}
                {!isAuthenticated ? (
                    <>
                        To upload a log please{' '}
                        <strong>Log In</strong> / <strong>Register</strong> for a free account.
                    </>
                ) : (
                    <>
                        <Link component={RouterLink} to="/upload">Upload a log</Link>{' '}
                        to get started.
                    </>
                )}
            </Typography>
            <Typography paragraph>
                We are open to contributions on our{' '}
                <Link href="https://discord.gg/ZydwX7AJEd" target="_blank" rel="noopener">
                    Discord
                </Link>{' '}
                or on our{' '}
                <Link href="https://github.com/SuperNerdEric/runelogs" target="_blank" rel="noopener">
                    GitHub
                </Link>.
            </Typography>
            <Box mt={4}>
                <Leaderboard/>
            </Box>
            <Box mt={4}>
                <OverallRecentEncounters/>
            </Box>
        </Box>
    );
}
