import React from 'react';
import Leaderboard from './Leaderboard';
import {Box, Link, Typography} from '@mui/material';
import OverallRecentEncounters from "./OverallRecentEncounters";
import {useAuth0} from '@auth0/auth0-react';
import {colors} from '../theme';
import logo from '../assets/Logo.png';

export default function Home() {
    const {isAuthenticated} = useAuth0();

    return (
        <Box mt={1}>
            <Box p={2} pb={0} maxWidth={1000} mx="auto">
                <Box sx={{display: 'flex', alignItems: 'center', gap: 2, mb: 2}}>
                    {/* Hidden below 1440px — duplicates top bar branding */}
                    <Box
                        component="img"
                        src={logo}
                        alt=""
                        sx={{
                            height: 40,
                            flexShrink: 0,
                            '@media (max-width: 1439px)': {display: 'none'},
                        }}
                    />
                    <Box>
                        <Typography
                            variant="h4"
                            component="h1"
                            sx={{
                                color: 'white',
                                fontWeight: 700,
                                lineHeight: 1.2,
                                '@media (max-width: 1439px)': {display: 'none'},
                            }}
                        >
                            <Box component="span" sx={{color: colors.text.rune}}>Rune</Box>
                            <Box component="span" sx={{color: colors.text.logs}}>logs</Box>
                        </Typography>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                color: 'grey.500',
                                mt: 0.25,
                                '@media (max-width: 1439px)': {
                                    fontSize: '1.25rem',
                                    mt: 0,
                                },
                            }}
                        >
                            Combat analysis for Old School RuneScape
                        </Typography>
                    </Box>
                </Box>
                {!isAuthenticated && (
                    <Typography paragraph>
                        To upload a log please{' '}
                        <strong>Log In</strong> / <strong>Register</strong> for an account.
                    </Typography>
                )}
                <Typography paragraph>
                    Runelogs is a combat log analysis tool for Old School RuneScape that works with the{' '}
                    <Link href="https://runelite.net/plugin-hub/show/combat-logger" target="_blank" rel="noopener">
                        Combat Logger
                    </Link>{' '} plugin to help players review fights, track performance, and improve strategy.
                    It offers leaderboards, detailed breakdowns, and visualizations powered by parsed in-game data.
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
            </Box>
            <Box mt={4}>
                <Leaderboard/>
            </Box>
            <Box mt={4}>
                <OverallRecentEncounters/>
            </Box>
        </Box>
    );
}
