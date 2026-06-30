import React from 'react';
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
import {usePageMeta} from '../hooks/usePageMeta';
import {ABOUT_PAGE_META} from '../utils/seoContent';

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

const About: React.FC = () => {
    usePageMeta(ABOUT_PAGE_META);

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
                    Runelogs reads combat logs from the{' '}
                    <Link
                        href="https://runelite.net/plugin-hub/show/combat-logger"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={linkSx}
                    >
                        Combat Logger
                    </Link>{' '}
                    RuneLite plugin and turns them into fight pages you can browse on the web —
                    DPS breakdowns, event timelines, replays, and leaderboards. It works with raids,
                    bosses, and other PvM content that the plugin records.
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Runelogs is free to use. You need a RuneLite client, the Combat Logger plugin,
                    and a Runelogs account to upload or live log. The site is at{' '}
                    <Link href="https://www.runelogs.com" sx={linkSx}>
                        runelogs.com
                    </Link>
                    .
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    What people use it for
                </Typography>
                <Box component="ul" sx={listSx}>
                    <li>Checking DPS on individual bosses after a trip or raid</li>
                    <li>Comparing run times on leaderboards (TOB, TOA, Inferno, etc.)</li>
                    <li>Reviewing deaths — what hit you, when you prayed wrong, gear at the time</li>
                    <li>Sharing a fight or full raid link with your team</li>
                    <li>Watching a live raid on the website while someone else is playing</li>
                    <li>Stepping through a fight tick-by-tick in the replay viewer</li>
                </Box>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    How it works
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Combat Logger writes a text file on your PC while you play. You upload that file
                    to Runelogs (or stream it live — see below). Our server parses the log and splits
                    it into fights. Each fight gets its own page with a URL you can share or come
                    back to later.
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Full runs — a TOB clear, a TOA raid, a Colosseum run, and so on — are grouped
                    together on a run summary page with total time, per-player DPS, and links to
                    each individual fight.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    Combat Logger plugin
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Install it from the{' '}
                    <Link
                        href="https://runelite.net/plugin-hub/show/combat-logger"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={linkSx}
                    >
                        RuneLite Plugin Hub
                    </Link>
                    . It has a damage meter panel in-game and saves logs to{' '}
                    <Box component="code" sx={{fontSize: fontSizes.sm}}>
                        .runelite/combat_log
                    </Box>
                    . If your party members also run the plugin, their damage shows up by name
                    instead of as &quot;Unknown.&quot;
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Chat commands: <strong>::newlog</strong> starts a new log file,{' '}
                    <strong>::livelog</strong> toggles live logging. See the{' '}
                    <Link component={RouterLink} to="/help" sx={linkSx}>
                        Help page
                    </Link>{' '}
                    for how to find and upload your log files.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    Uploading logs
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    You need a free account. Go to{' '}
                    <Link component={RouterLink} to="/upload" sx={linkSx}>
                        Upload
                    </Link>{' '}
                    and submit your log file. Big logs are parsed in batches — you can open the log
                    page while the rest is still processing.
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Uploads show up on your{' '}
                    <Link component={RouterLink} to="/profile" sx={linkSx}>
                        profile
                    </Link>
                    . You can rename logs, delete them, and filter by content type and party size.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    Live logging
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Instead of uploading after the fact, you can stream combat events to Runelogs
                    as you play. Generate an access key on the{' '}
                    <Link component={RouterLink} to="/live-log" sx={linkSx}>
                        Live Log
                    </Link>{' '}
                    page and paste it into the plugin settings. Anyone with the log link can watch
                    fights show up in real time.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    Fight pages
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Each parsed fight has several tabs:
                </Typography>
                <Box component="ul" sx={listSx}>
                    <li>
                        <strong>Damage Done</strong> — DPS tables, charts, and damage by target.
                        Some content shows percentile ranks vs other logged players.
                    </li>
                    <li>
                        <strong>Damage Taken</strong> — what hit you and for how much.
                    </li>
                    <li>
                        <strong>Boosts</strong> — your combat stat boosts during the fight.
                    </li>
                    <li>
                        <strong>Events</strong> — full timeline of hitsplats, prayers, gear swaps,
                        deaths, and other log lines. Searchable and filterable.
                    </li>
                    <li>
                        <strong>Replay</strong> — tick-by-tick replay with map, prayers, and gear
                        (requires Combat Logger v1.2.0+).
                    </li>
                </Box>
                <Typography variant="body1" sx={bodyTextSx}>
                    You can filter by player, NPC, gear, or prayer across tabs, and combine multiple
                    fights from the same log into one view.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    Run summaries
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Raids and other multi-fight content get a summary page listing every fight in
                    order, with total duration, overall DPS, and rank badges where applicable. Extra
                    info shows up when the log has it — ToA raid level, Colosseum modifiers,
                    Mokhaiotl delve stats, etc.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    Leaderboards
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    <Link component={RouterLink} to="/leaderboards" sx={linkSx}>
                        Leaderboards
                    </Link>{' '}
                    track run times and DPS for uploaded logs. Supported content:
                </Typography>
                <Box component="ul" sx={listSx}>
                    {supportedContent.map((label) => (
                        <li key={label}>{label}</li>
                    ))}
                </Box>
                <Typography variant="body1" sx={bodyTextSx}>
                    Duration boards rank full run times. DPS boards rank individual boss fights
                    (e.g. Verzik phases, ToA wardens, Sol Heredit, TzKal-Zuk). Mokhaiotl has a
                    Deep Delve high-score board. Player profiles show personal bests.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    PvM content on Runelogs
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Leaderboards and run summaries currently cover the content below. Other bosses
                    and activities still parse into fight pages if Combat Logger records them —
                    Chambers of Xeric (CoX) logs work, for example, but CoX is not on the
                    leaderboard list yet.
                </Typography>
                <Box component="ul" sx={listSx}>
                    <li>
                        <strong>Theatre of Blood (TOB)</strong> and <strong>Hard Mode (TOB HM)</strong>{' '}
                        — full raid duration and per-boss DPS (Maiden, Bloat, Nylos, Sotetseg,
                        Xarpus, Verzik).
                    </li>
                    <li>
                        <strong>Tombs of Amascut (TOA)</strong> and <strong>Expert Mode (TOA EM)</strong>{' '}
                        — raid time, path bosses, and Wardens phases. Raid level is shown on the
                        run summary.
                    </li>
                    <li>
                        <strong>Fight Caves</strong> — TzTok-Jad fight and duration.
                    </li>
                    <li>
                        <strong>The Inferno</strong> — TzKal-Zuk and full run time.
                    </li>
                    <li>
                        <strong>Fortis Colosseum</strong> — wave modifiers, Sol Heredit, and run
                        duration.
                    </li>
                    <li>
                        <strong>The Gauntlet</strong> and <strong>Corrupted Gauntlet (CG)</strong>.
                    </li>
                    <li>
                        <strong>Doom of Mokhaiotl</strong> — delve progression, Deep Delve
                        high-scores, and fight DPS.
                    </li>
                    <li>
                        <strong>Yama</strong> — solo and duo (2-player) leaderboards.
                    </li>
                </Box>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    Recent encounters and profiles
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    <Link component={RouterLink} to="/recent-encounters" sx={linkSx}>
                        Recent Encounters
                    </Link>{' '}
                    lists the latest uploads from everyone, filterable by content and team size.
                    Search for a player in the header to open their profile, logs, and personal
                    bests. Profiles can include a bio, avatar, and contact links.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    What gets logged
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Combat Logger records game events on each tick (0.6 seconds). That includes:
                </Typography>
                <Box component="ul" sx={listSx}>
                    <li>Damage and healing (hitsplats)</li>
                    <li>Attack animations and target changes</li>
                    <li>Equipment and boosted stats</li>
                    <li>Prayers</li>
                    <li>Player position (used by replay)</li>
                    <li>Wave start/end, deaths, wipes</li>
                    <li>Raid markers — ToA paths, CoX completion, Colosseum modifiers, Gauntlet timers, etc.</li>
                </Box>
                <Typography variant="body1" sx={bodyTextSx}>
                    We map item and NPC IDs to names using data from the OSRS Wiki and community
                    ID databases.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    Common questions
                </Typography>
                <Typography component="h3" sx={subsectionTitleSx}>
                    Do I need RuneLite?
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Yes. Runelogs only reads logs from the Combat Logger plugin on RuneLite. OSRS
                    mobile and the official client are not supported.
                </Typography>
                <Typography component="h3" sx={subsectionTitleSx}>
                    Is Runelogs free?
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Yes. Creating an account and uploading logs is free.
                </Typography>
                <Typography component="h3" sx={subsectionTitleSx}>
                    How is this different from the in-game damage meter?
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    The plugin&apos;s damage meter is live in your client for your last few fights.
                    Runelogs keeps the full log, breaks it into shareable web pages, adds
                    leaderboards, replay, and filters you can use after the fact.
                </Typography>
                <Typography component="h3" sx={subsectionTitleSx}>
                    Why does some damage show as &quot;Unknown&quot;?
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    OSRS does not always expose who dealt darker hitsplats. If a party member runs
                    Combat Logger, their damage is usually attributed correctly. See the{' '}
                    <Link component={RouterLink} to="/help" sx={linkSx}>
                        Help page
                    </Link>{' '}
                    for more on this.
                </Typography>
                <Typography component="h3" sx={subsectionTitleSx}>
                    Can I log while playing on a second account?
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    The log records whichever account is logged in on that RuneLite client. Upload
                    it from the Runelogs account you want the log tied to.
                </Typography>
                <Typography component="h3" sx={subsectionTitleSx}>
                    What is live logging?
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Live logging sends events to Runelogs as you play instead of uploading a file
                    afterward. Set it up on the{' '}
                    <Link component={RouterLink} to="/live-log" sx={linkSx}>
                        Live Log
                    </Link>{' '}
                    page with an access key in the plugin settings.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    Accounts
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Accounts are free. Login is handled by Auth0 (email or social login). Uploaded
                    logs and profile info can be visible to other site visitors — log URLs,
                    leaderboards, and profiles are public by default. See the{' '}
                    <Link component={RouterLink} to="/privacy" sx={linkSx}>
                        Privacy Policy
                    </Link>{' '}
                    for details, or email{' '}
                    <Link href="mailto:privacy@runelogs.com" sx={linkSx}>
                        privacy@runelogs.com
                    </Link>{' '}
                    /{' '}
                    <Link href="mailto:support@runelogs.com" sx={linkSx}>
                        support@runelogs.com
                    </Link>
                    .
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    Source code and Discord
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    The website is on{' '}
                    <Link
                        href="https://github.com/SuperNerdEric/runelogs"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={linkSx}
                    >
                        GitHub
                    </Link>
                    . The plugin is on{' '}
                    <Link
                        href="https://github.com/SuperNerdEric/combat-logger"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={linkSx}
                    >
                        GitHub
                    </Link>{' '}
                    too. Questions and bug reports go on{' '}
                    <Link
                        href="https://discord.gg/ZydwX7AJEd"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={linkSx}
                    >
                        Discord
                    </Link>
                    .
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    Disclaimer
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Runelogs is a fan project. Not affiliated with Jagex Ltd.
                </Typography>

                <Typography component="h3" sx={subsectionTitleSx}>
                    Links
                </Typography>
                <Box component="ul" sx={{...listSx, mb: 0}}>
                    <li>
                        <Link component={RouterLink} to="/" sx={linkSx}>
                            Home
                        </Link>
                    </li>
                    <li>
                        <Link component={RouterLink} to="/upload" sx={linkSx}>
                            Upload
                        </Link>
                    </li>
                    <li>
                        <Link component={RouterLink} to="/live-log" sx={linkSx}>
                            Live Log
                        </Link>
                    </li>
                    <li>
                        <Link component={RouterLink} to="/leaderboards" sx={linkSx}>
                            Leaderboards
                        </Link>
                    </li>
                    <li>
                        <Link component={RouterLink} to="/help" sx={linkSx}>
                            Help
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
