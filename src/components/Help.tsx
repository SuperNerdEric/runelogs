import React, {useEffect, useMemo, useState} from 'react';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Link,
    Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import {Icon} from '@iconify/react';
import {useLocation} from 'react-router-dom';
import FindCombatLogIcon from '../assets/help/find_combat_log.png';
import BrightHitsplat from '../assets/help/bright_hitsplat.png';
import TintedHitsplat from '../assets/help/tinted_hitsplat.png';
import PanelIcon from '../assets/help/panel_icon.png';
import FolderIcon from '../assets/help/folder_icon.png';
import {colors, contentColumnSx, media} from '../theme';
import {usePageMeta} from '../hooks/usePageMeta';
import {HELP_PAGE_META} from '../utils/seoContent';

type FaqItem = { id: string; title: string; body: React.ReactNode };

const helpIconInlineSx = {
    height: '1em',
    width: 'auto',
    display: 'inline-block',
    verticalAlign: '-0.125em',
    mx: 0.25,
};

const bodyTextSx = {
    color: colors.text.primary,
    lineHeight: 1.6,
    mb: 1.5,
    '&:last-child': {mb: 0},
};

const accordionSx = {
    bgcolor: colors.background.surfaceAlt,
    backgroundImage: 'none',
    border: `1px solid ${colors.border.default}`,
    borderRadius: '5px !important',
    boxShadow: 'none',
    mb: 1.5,
    '&:before': {display: 'none'},
    '&.Mui-expanded': {mb: 1.5},
};

const accordionSummarySx = {
    px: 2,
    '& .MuiAccordionSummary-content': {
        my: 1.25,
    },
    '& .MuiAccordionSummary-expandIconWrapper': {
        color: colors.text.primary,
    },
};

const accordionDetailsSx = {
    px: 2,
    pb: 2.5,
    pt: 1.5,
    borderTop: `1px solid ${colors.border.default}`,
    '& .MuiTypography-root': {
        ...bodyTextSx,
        '& a, & .MuiLink-root': {
            color: colors.text.link,
            '&:hover': {
                color: colors.text.link,
            },
        },
    },
};

const supportLinkIconStyle = {
    width: '1em',
    height: '1em',
    verticalAlign: '-0.125em',
    marginRight: '0.25em',
} as const;

const supportLinkSx = {
    color: colors.text.link,
    textDecoration: 'none',
    '&:hover': {
        color: colors.text.link,
        textDecoration: 'underline',
    },
};

const Help: React.FC = () => {
    usePageMeta(HELP_PAGE_META);
    const {hash} = useLocation();
    const openId = useMemo(() => (hash ? hash.slice(1) : null), [hash]);
    const [expandedId, setExpandedId] = useState<string | false>(openId ?? false);

    useEffect(() => {
        if (!openId) {
            return;
        }

        setExpandedId(openId);
        window.requestAnimationFrame(() => {
            document.getElementById(openId)?.scrollIntoView({behavior: 'smooth', block: 'start'});
        });
    }, [openId]);

    return (
        <Box sx={{...contentColumnSx, mt: 2, px: 2, pb: 4, [media.mobileDown]: {px: 1}}}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    mb: 3,
                    pt: 1,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        bgcolor: colors.background.surfaceAlt,
                        border: `1px solid ${colors.border.default}`,
                    }}
                >
                    <HelpOutlineIcon sx={{fontSize: 32, color: colors.upload.dragActive}}/>
                </Box>
                <Typography variant="h4" sx={{m: 0, fontWeight: 600, color: colors.text.primary}}>
                    Help
                </Typography>
            </Box>

            <Box sx={{px: 0.5}}>
            <Typography
                variant="h5"
                sx={{mb: 2, fontWeight: 600, color: colors.text.primary}}
            >
                Frequently Asked Questions
            </Typography>

            {faq.map(({id, title, body}) => (
                <Accordion
                    key={id}
                    id={id}
                    elevation={0}
                    expanded={expandedId === id}
                    onChange={(_, isExpanded) => setExpandedId(isExpanded ? id : false)}
                    disableGutters
                    sx={accordionSx}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon/>} sx={accordionSummarySx}>
                        <Typography variant="h6" sx={{fontWeight: 600, color: colors.text.primary}}>
                            {title}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={accordionDetailsSx}>{body}</AccordionDetails>
                </Accordion>
            ))}

            <Box sx={{mt: 5}}>
                <Typography
                    variant="h6"
                    sx={{mb: 1, fontWeight: 600, color: colors.text.primary}}
                >
                    Support
                </Typography>
                <Typography
                    variant="subtitle1"
                    sx={{mb: 1.5, color: colors.text.muted}}
                >
                    Still need help?
                </Typography>
                <Typography variant="body1" sx={{...bodyTextSx, mb: 1.5}}>
                    Runelogs is a community-driven project, and we&apos;re happy to help if you
                    run into any issues.
                    Our Discord is usually the quickest way to get answers, while GitHub is best for
                    reporting bugs or suggesting features.
                </Typography>
                <Typography variant="body1" sx={{color: colors.text.primary, lineHeight: 1.6}}>
                    Reach out to us on{' '}
                    <Link
                        href="https://discord.gg/ZydwX7AJEd"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={supportLinkSx}
                    >
                        <Icon icon="logos:discord-icon" style={supportLinkIconStyle}/>
                        Discord
                    </Link>
                    {' '}or open an issue on{' '}
                    <Link
                        href="https://github.com/SuperNerdEric/runelogs"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={supportLinkSx}
                    >
                        <Icon icon="bi:github" style={supportLinkIconStyle}/>
                        GitHub
                    </Link>
                    .
                </Typography>
            </Box>
            </Box>
        </Box>
    );
};

export default Help;

const faq: FaqItem[] = [
    {
        id: 'what-is-runelogs',
        title: 'What is Runelogs?',
        body: (
            <Typography variant="body1">
                Runelogs is a combat log analysis tool for Old School RuneScape that works with the{' '}
                <Link href="https://runelite.net/plugin-hub/show/combat-logger" target="_blank" rel="noopener noreferrer">
                    Combat Logger
                </Link>{' '}
                plugin to help players review fights, track performance, and improve strategy.
                It offers leaderboards, detailed breakdowns, and visualizations powered by parsed in-game data.
            </Typography>
        ),
    },
    {
        id: 'find-combat-log',
        title: 'Where do I find my combat log files?',
        body: (
            <>
                <Typography variant="body1">
                    1. Click the Combat Logger{' '}
                    <Box component="img" src={PanelIcon} alt="Panel Icon" sx={helpIconInlineSx}/>
                    {' '}panel icon in the RuneLite sidebar.
                </Typography>
                <Typography variant="body1">
                    2. Click the Folder{' '}
                    <Box component="img" src={FolderIcon} alt="Folder Icon" sx={helpIconInlineSx}/>
                    {' '}icon to open your combat log folder.
                </Typography>
                <Box display="flex" justifyContent="center" mt={2}>
                    <Box
                        component="img"
                        src={FindCombatLogIcon}
                        alt="Find Combat Log"
                        sx={{maxWidth: 300, width: '100%', height: 'auto'}}
                    />
                </Box>
            </>
        ),
    },
    {
        id: 'unknown-source',
        title: 'What does Unknown damage source mean?',
        body: (
            <Typography variant="body1">
                All darker tinted hitsplats{' '}
                <Box component="img" src={TintedHitsplat} alt="Tinted Hitsplat" sx={helpIconInlineSx}/>
                {' '}from in-game show up as an Unknown source by default. However, if another player is in your{' '}
                <Link href="https://github.com/runelite/runelite/wiki/Party" target="_blank" rel="noopener noreferrer">
                    Party
                </Link>{' '}
                with the Combat Logger plugin running, you will be able to see their hitsplats as the plugin shares it automatically.
            </Typography>
        ),
    },
    {
        id: 'thralls',
        title: 'Are my thralls showing up as Unknown?',
        body: (
            <Typography variant="body1">
                No, your thralls use brighter hitsplats{' '}
                <Box component="img" src={BrightHitsplat} alt="Bright Hitsplat" sx={helpIconInlineSx}/>
                {' '}that indicate it is your damage. There is currently no way to differentiate your thrall&apos;s damage from your damage.
            </Typography>
        ),
    },
    {
        id: 'still-unknown',
        title: 'Everyone in my Party has the plugin yet I\'m still seeing some Unknown damage sources?',
        body: (
            <Typography variant="body1">
                Some fights will naturally have darker tinted hitsplats{' '}
                <Box component="img" src={TintedHitsplat} alt="Tinted Hitsplat" sx={helpIconInlineSx}/>
                {' '}whose source is not able to be detected by the plugin.
                For example, Zebak&apos;s breath that kills his own boulders uses darker tinted hitsplats and
                will show up as an Unknown damage source.
                This is a limitation of the OSRS client.
            </Typography>
        ),
    },
];
