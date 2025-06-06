import React from 'react';
import Leaderboard from './Leaderboard';
import { Box, Typography, Link } from '@mui/material';

export default function Home() {
    return (
        <Box p={3}>
            <Box maxWidth={1000} mx="auto">
                <Typography variant="h4" gutterBottom>
                    Welcome to the new Runelogs experience
                </Typography>
                <Typography paragraph>
                    To upload a log please <strong>Log In</strong> / <strong>Register</strong> for an account.
                    During this beta period, logs may be cleared or invalidated for leaderboards.
                    We appreciate your patience.
                </Typography>
                <Typography paragraph>
                    Runelogs is a combat log analysis tool for Old School RuneScape that helps players review fights, track performance, and improve strategy.
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
                    We are especially looking for people with experience in front-end and design.
                </Typography>
            </Box>
            <Box mt={4}>
                <Leaderboard />
            </Box>
        </Box>
    );
}
