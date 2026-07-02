import React from 'react';
import Leaderboard from './Leaderboard';
import {Box, Link, Typography} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {Link as RouterLink} from 'react-router-dom';
import OverallRecentEncounters from "./OverallRecentEncounters";
import HistoryIcon from '@mui/icons-material/History';
import {useAuth0} from '@auth0/auth0-react';
import {colors, contentColumnSx, media} from '../theme';
import {HomeHero} from './HomeHero';
import {HomeHeroSubtitle, HomeHeroTagline} from './homeHeroContent';
import TrophyIcon from './TrophyIcon';
import {usePageMeta} from '../hooks/usePageMeta';
import {HOME_PAGE_META} from '../utils/seoContent';
import HomeBlogPreview from './HomeBlogPreview';

export default function Home() {
    const {isAuthenticated} = useAuth0();
    usePageMeta(HOME_PAGE_META);

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
                RuneLite plugin.{' '}
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
            <HomeBlogPreview/>
            <Box mt={4}>
                <Box pt={0} pb={1} display="flex" alignItems="center" gap={1}>
                    <Box component="span" sx={{display: 'inline-flex', alignItems: 'center', lineHeight: 0}}>
                        <TrophyIcon size={34}/>
                    </Box>
                    <Typography
                        component={RouterLink}
                        to="/leaderboards"
                        variant="h4"
                        color="white"
                        sx={{
                            m: 0,
                            lineHeight: 1.2,
                            textDecoration: 'none',
                            '&:hover': {
                                textDecoration: 'underline',
                            },
                        }}
                    >
                        Leaderboards
                    </Typography>
                </Box>
                <Leaderboard entriesPerPage={25}/>
            </Box>
            <Box mt={4}>
                <Box pt={0} pb={1} display="flex" alignItems="center" gap={1}>
                    <Box component="span" sx={{display: 'inline-flex', alignItems: 'center', lineHeight: 0}}>
                        <HistoryIcon sx={{color: colors.text.rune, fontSize: '2.125rem'}}/>
                    </Box>
                    <Typography
                        component={RouterLink}
                        to="/recent-encounters"
                        variant="h4"
                        color="white"
                        sx={{
                            m: 0,
                            lineHeight: 1.2,
                            textDecoration: 'none',
                            '&:hover': {
                                textDecoration: 'underline',
                            },
                        }}
                    >
                        Recent Encounters
                    </Typography>
                </Box>
                <OverallRecentEncounters embedded entriesPerPage={10}/>
            </Box>
        </Box>
    );
}
