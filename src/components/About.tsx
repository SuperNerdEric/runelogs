import React, {useEffect} from 'react';
import {Box, Link, Typography} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {Link as RouterLink} from 'react-router-dom';
import {colors, contentColumnSx, fontSizes, media} from '../theme';
import {
    pageHeaderContainerSx,
    pageHeaderIconBoxSx,
    pageHeaderSubtitleSx,
} from './pageHeaderStyles';
import {LEADERBOARD_CONTENT_OPTIONS} from '../utils/leaderboardContent';

const DEFAULT_TITLE = 'Runelogs - Combat analysis for Old School RuneScape';
const DEFAULT_DESCRIPTION =
    'Runelogs: A combat log analysis tool for Old School RuneScape.';
const ABOUT_TITLE =
    'About Runelogs - OSRS Combat Log Analysis, DPS Tracking & Leaderboards';
const ABOUT_DESCRIPTION =
    'Runelogs is a free Old School RuneScape combat log analyzer. Upload or live-stream Combat Logger logs, review DPS and damage breakdowns, replay fights tick-by-tick, and compare ranks on TOB, TOA, Inferno, Colosseum, and more.';

const bodyTextSx = {
    color: colors.text.primary,
    fontSize: fontSizes.base,
    lineHeight: 1.65,
    mb: 1.5,
    '&:last-child': {mb: 0},
};

const listSx = {
    color: colors.text.primary,
    fontSize: fontSizes.base,
    lineHeight: 1.65,
    pl: 3,
    mb: 1.5,
    mt: 0,
    '& li': {
        mb: 0.75,
        '&:last-child': {mb: 0},
    },
};

const sectionTitleSx = {
    fontWeight: 600,
    color: colors.text.primary,
    mt: 3,
    mb: 1,
};

const subsectionTitleSx = {
    fontWeight: 600,
    color: colors.text.primary,
    fontSize: fontSizes.base,
    mt: 2,
    mb: 0.75,
};

const linkSx = {
    color: colors.text.link,
    textDecoration: 'none',
    '&:hover': {
        color: colors.text.link,
        textDecoration: 'underline',
    },
};

function setMetaDescription(content: string) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
}

const About: React.FC = () => {
    useEffect(() => {
        document.title = ABOUT_TITLE;
        setMetaDescription(ABOUT_DESCRIPTION);
        return () => {
            document.title = DEFAULT_TITLE;
            setMetaDescription(DEFAULT_DESCRIPTION);
        };
    }, []);

    const supportedContent = LEADERBOARD_CONTENT_OPTIONS.map((option) => option.label);

    return (
        <Box sx={{...contentColumnSx, mt: 2, px: 2, pb: 4, [media.mobileDown]: {px: 1}}}>
            <Box sx={pageHeaderContainerSx}>
                <Box sx={pageHeaderIconBoxSx}>
                    <InfoOutlinedIcon sx={{fontSize: 32, color: colors.upload.dragActive}}/>
                </Box>
                <Box>
                    <Typography
                        variant="h4"
                        sx={{m: 0, fontWeight: 600, color: colors.text.primary, lineHeight: 1.15}}
                    >
                        About Runelogs
                    </Typography>
                    <Typography component="span" sx={pageHeaderSubtitleSx}>
                        Combat log analysis for Old School RuneScape
                    </Typography>
                </Box>
            </Box>

            <Box sx={{px: 0.5}} component="article">
                <Typography variant="body1" sx={bodyTextSx}>
                    <strong>Runelogs</strong> is a free web application at{' '}
                    <Link href="https://www.runelogs.com" sx={linkSx}>
                        runelogs.com
                    </Link>{' '}
                    that helps Old School RuneScape (OSRS) players upload, parse, and analyze
                    combat logs from the{' '}
                    <Link
                        href="https://runelite.net/plugin-hub/show/combat-logger"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={linkSx}
                    >
                        Combat Logger
                    </Link>{' '}
                    RuneLite plugin. Whether you are pushing Theatre of Blood times, studying Tombs
                    of Amascut mechanics, grinding Fortis Colosseum waves, or comparing DPS on
                    end-game bosses, Runelogs turns raw in-game combat data into readable charts,
                    leaderboards, and shareable encounter pages.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    How Runelogs works
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Runelogs connects three pieces: the{' '}
                    <strong>Combat Logger plugin</strong> running in RuneLite, the{' '}
                    <strong>Runelogs website</strong> where you browse results, and the{' '}
                    <strong>Runelogs API</strong> that parses log files and stores fight metadata.
                    When you finish a boss fight, raid, or wave-based encounter, the plugin writes
                    structured combat events to a text log on your computer. You can upload that log
                    to Runelogs manually, or stream events in real time with live logging.
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    After upload, the server reads every line of the combat log — hitsplats, prayer
                    switches, gear changes, wave boundaries, raid completion markers, and more —
                    and groups them into individual <strong>encounters</strong> (fights) and{' '}
                    <strong>fight groups</strong> (full runs such as a complete raid or Colosseum
                    run). Each encounter gets a permanent URL you can bookmark, share with your team,
                    or revisit later to compare gear and performance.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    Combat Logger plugin
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    The Combat Logger plugin is available from the{' '}
                    <Link
                        href="https://runelite.net/plugin-hub/show/combat-logger"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={linkSx}
                    >
                        RuneLite Plugin Hub
                    </Link>
                    . It records combat while you play and includes a built-in damage meter panel
                    that shows damage dealt, DPS, percentage contribution, and kill time for recent
                    fights. When you are in a RuneLite party with other players who also run Combat
                    Logger, hitsplat data can be shared so teammates appear by name instead of as
                    unknown damage sources.
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Log files are saved locally under your RuneLite profile (typically in{' '}
                    <Box component="code" sx={{fontSize: fontSizes.sm}}>
                        .runelite/combat_log
                    </Box>
                    ). Useful in-game chat commands include <strong>::newlog</strong> to start a
                    fresh log file and <strong>::livelog</strong> to toggle Runelogs live logging.
                    See our{' '}
                    <Link component={RouterLink} to="/help" sx={linkSx}>
                        Help page
                    </Link>{' '}
                    for step-by-step instructions on finding and uploading log files.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    Uploading combat logs
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Create a free Runelogs account, then visit the{' '}
                    <Link component={RouterLink} to="/upload" sx={linkSx}>
                        Upload
                    </Link>{' '}
                    page to submit a combat log file. The site accepts the plain-text format written
                    by Combat Logger. Large logs with many raids or long sessions are processed on
                    the server in stages; you can watch parsing progress and open the log page while
                    remaining fights are still being analyzed.
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Every uploaded log is tied to your account. Your{' '}
                    <Link component={RouterLink} to="/profile" sx={linkSx}>
                        profile
                    </Link>{' '}
                    includes your log history with fight counts, upload dates, and links to each log.
                    You can rename logs, delete uploads you no longer need, and filter your log
                    list by PvM content type and party size.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    Live logging
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Live logging sends combat events from the plugin to Runelogs in real time
                    instead of waiting until you upload a file. Enable it on the{' '}
                    <Link component={RouterLink} to="/live-log" sx={linkSx}>
                        Live Log
                    </Link>{' '}
                    page by generating an access key and pasting it into the Combat Logger plugin
                    settings. While a live session is active, friends and teammates can open the log
                    URL and watch encounters appear as you play — useful for coaching, streaming,
                    or reviewing a raid without stopping to upload.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    Encounter pages and fight analysis
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Each parsed fight becomes an <strong>encounter page</strong> with detailed
                    combat analytics. Tabs include:
                </Typography>
                <Box component="ul" sx={listSx}>
                    <li>
                        <strong>Damage Done</strong> — DPS meter tables, hit distribution charts,
                        damage-by-target breakdowns, and percentile badges comparing your performance
                        to other logged players on supported content.
                    </li>
                    <li>
                        <strong>Damage Taken</strong> — incoming damage sources, helping you identify
                        where you lost health or died.
                    </li>
                    <li>
                        <strong>Boosts</strong> — attack, strength, ranged, magic, and other combat
                        stat boosts over the course of the fight.
                    </li>
                    <li>
                        <strong>Events</strong> — a searchable timeline of log events including
                        hitsplats, prayer changes, equipment updates, deaths, target swaps, and
                        wave transitions.
                    </li>
                    <li>
                        <strong>Replay</strong> — an interactive tick-by-tick replay with a map view,
                        player positions, overhead prayers, worn equipment, and combat levels (for
                        logs recorded with Combat Logger v1.2.0 or newer).
                    </li>
                </Box>
                <Typography variant="body1" sx={bodyTextSx}>
                    Filters let you drill into specific players, NPCs, gear setups, prayers, or event
                    types across tabs. You can also aggregate multiple encounters from the same log
                    into a combined view for side-by-side comparison.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    Run summaries and raid tracking
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Multi-phase PvM content is grouped into <strong>run summaries</strong> (fight
                    groups). A Theatre of Blood clear, Tombs of Amascut raid, Fortis Colosseum run,
                    or Gauntlet attempt appears as one summary page listing every encounter in
                    order, total duration, overall DPS per player, rank badges, and success or wipe
                    status. Specialized metadata is shown where the log supports it — for example
                    Tombs of Amascut raid level, Fortis Colosseum wave modifiers, or Doom of
                    Mokhaiotl delve statistics.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    Leaderboards and personal bests
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Runelogs maintains community{' '}
                    <Link component={RouterLink} to="/leaderboards" sx={linkSx}>
                        leaderboards
                    </Link>{' '}
                    for supported PvM content. Compare run durations and DPS against other players,
                    filter by party size, and browse top times for:
                </Typography>
                <Box component="ul" sx={listSx}>
                    {supportedContent.map((label) => (
                        <li key={label}>{label}</li>
                    ))}
                </Box>
                <Typography variant="body1" sx={bodyTextSx}>
                    Duration leaderboards rank full run times for raid and wave-based content. DPS
                    leaderboards track per-encounter damage rates on eligible boss fights. Doom of
                    Mokhaiotl also supports a high-score style <strong>Deep Delve</strong>{' '}
                    leaderboard for delve progression. Player profile pages show personal bests and
                    DPS records across content types so you can track improvement over time.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    Recent encounters and player search
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    The{' '}
                    <Link component={RouterLink} to="/recent-encounters" sx={linkSx}>
                        Recent Encounters
                    </Link>{' '}
                    feed shows the latest uploaded runs from the community, filterable by content
                    and party size. Use the player search bar in the site header to jump to any
                    player&apos;s public profile or log list. Each player page displays optional
                    bio, avatar, contact links, personal bests, and a history of uploaded logs.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    What data is captured in a combat log
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Combat Logger records machine-readable events tied to OSRS game ticks (0.6
                    seconds each). Typical log lines include:
                </Typography>
                <Box component="ul" sx={listSx}>
                    <li>Hitsplat damage and healing between players and NPCs</li>
                    <li>Player attack animations and target changes</li>
                    <li>Worn equipment and boosted combat levels</li>
                    <li>Active and overhead prayers</li>
                    <li>Player position and region data (for replay)</li>
                    <li>Wave start/end, wipe, and death events</li>
                    <li>Raid-specific markers such as ToA path completion, CoX completion, Colosseum modifiers, and Gauntlet timers</li>
                </Box>
                <Typography variant="body1" sx={bodyTextSx}>
                    Runelogs maps NPC and item IDs to names using regularly updated game data from
                    the OSRS Wiki and community ID databases, so charts and tables show familiar
                    boss and gear names rather than raw numbers.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    Accounts and privacy
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Runelogs accounts are free. Sign up or log in through Auth0 using email or
                    supported social providers. Uploaded logs and profile information may be
                    visible to other visitors depending on how you use the site — for example,
                    public log URLs, leaderboards, and player profiles. Read our{' '}
                    <Link component={RouterLink} to="/privacy" sx={linkSx}>
                        Privacy Policy
                    </Link>{' '}
                    for details on data collection, email usage, and how to contact us at{' '}
                    <Link href="mailto:privacy@runelogs.com" sx={linkSx}>
                        privacy@runelogs.com
                    </Link>{' '}
                    or{' '}
                    <Link href="mailto:support@runelogs.com" sx={linkSx}>
                        support@runelogs.com
                    </Link>
                    .
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    Open source and community
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Runelogs is a community-driven project. Source code, bug reports, and feature
                    requests live on{' '}
                    <Link
                        href="https://github.com/SuperNerdEric/runelogs"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={linkSx}
                    >
                        GitHub
                    </Link>
                    . The Combat Logger plugin is developed separately on{' '}
                    <Link
                        href="https://github.com/SuperNerdEric/combat-logger"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={linkSx}
                    >
                        GitHub
                    </Link>
                    . Join our{' '}
                    <Link
                        href="https://discord.gg/ZydwX7AJEd"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={linkSx}
                    >
                        Discord
                    </Link>{' '}
                    for help, feedback, and discussion with other players.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    Disclaimer
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Runelogs is an independent fan-made tool and is not affiliated with, endorsed by,
                    or connected to Jagex Ltd. or Old School RuneScape. &quot;Old School
                    RuneScape&quot; and related trademarks are property of Jagex Ltd.
                </Typography>

                <Typography component="h3" sx={subsectionTitleSx}>
                    Quick links
                </Typography>
                <Box component="ul" sx={{...listSx, mb: 0}}>
                    <li>
                        <Link component={RouterLink} to="/" sx={linkSx}>
                            Home
                        </Link>{' '}
                        — leaderboards and recent community encounters
                    </li>
                    <li>
                        <Link component={RouterLink} to="/upload" sx={linkSx}>
                            Upload a log
                        </Link>
                    </li>
                    <li>
                        <Link component={RouterLink} to="/live-log" sx={linkSx}>
                            Live logging setup
                        </Link>
                    </li>
                    <li>
                        <Link component={RouterLink} to="/leaderboards" sx={linkSx}>
                            Leaderboards
                        </Link>
                    </li>
                    <li>
                        <Link component={RouterLink} to="/help" sx={linkSx}>
                            Help &amp; FAQ
                        </Link>
                    </li>
                    <li>
                        <Link component={RouterLink} to="/privacy" sx={linkSx}>
                            Privacy Policy
                        </Link>
                    </li>
                </Box>
            </Box>
        </Box>
    );
};

export default About;
