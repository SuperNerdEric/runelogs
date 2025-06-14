import React from 'react';
import {
    Box,
    Typography,
    Link,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useLocation } from 'react-router-dom';
import SectionBox from './SectionBox';
import FindCombatLogIcon from '../assets/help/find_combat_log.png';
import BrightHitsplat from '../assets/help/bright_hitsplat.png';
import TintedHitsplat from '../assets/help/tinted_hitsplat.png';
import PanelIcon from '../assets/help/panel_icon.png';
import FolderIcon from '../assets/help/folder_icon.png';

type FaqItem = { id: string; title: string; body: React.ReactNode };

const Help: React.FC = () => {
    const { hash } = useLocation();
    const openId = React.useMemo(() => (hash ? hash.slice(1) : null), [hash]);

    return (
        <Box display="flex" flexDirection="column" alignItems="center" mt={4} px={2}>
            <SectionBox sx={{ p: 4 }}>
                <Typography variant="h3" gutterBottom sx={{ color: 'white' }}>
                    Frequently Asked Questions
                </Typography>

                {faq.map(({ id, title, body }) => (
                    <Accordion key={id} id={id} defaultExpanded={id === openId}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">{title}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>{body}</AccordionDetails>
                    </Accordion>
                ))}
            </SectionBox>
        </Box>
    );
};

export default Help;

const faq: FaqItem[] = [
    {
        id: 'what-is-runelogs',
        title: 'What is Runelogs?',
        body: (
            <Typography paragraph>
                Runelogs is a combat log analysis tool for Old School RuneScape that works with the{' '}
                <Link href="https://runelite.net/plugin-hub/show/combat-logger" target="_blank" rel="noopener">
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
                <Typography paragraph>
                    1. Click the Combat Logger <img src={PanelIcon} alt="Panel Icon" height={16}/> panel icon in the RuneLite sidebar.
                </Typography>
                <Typography paragraph>
                    2. Click the Folder <img src={FolderIcon} alt="folder Icon" height={16}/> icon to open your combat log folder.
                </Typography>
                <Box display="flex" justifyContent="center" mt={2}>
                    <img src={FindCombatLogIcon} alt="Find Combat Log" width={300} />
                </Box>
            </>
        ),
    },
    {
        id: 'unknown-source',
        title: 'What does Unknown damage source mean?',
        body: (
            <Typography paragraph>
                All darker tinted hitsplats <img src={TintedHitsplat} alt="Tinted Hitsplat" height={16} /> from in-game show
                up as an Unknown source by default. However, if another player is in your{' '}
                <Link href="https://github.com/runelite/runelite/wiki/Party" target="_blank" rel="noopener">
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
            <Typography paragraph>
                No, your thralls use brighter hitsplats <img src={BrightHitsplat} alt="Bright Hitsplat" height={16}/> that indicate it is your damage. There is currently no way to differentiate your thrall's damage from your damage.
            </Typography>
        ),
    },
    {
        id: 'still-unknown',
        title:
            'Everyone in my Party has the plugin yet I\'m still seeing some Unknown damage sources?',
        body: (
            <Typography paragraph>
                Some fights will naturally have darker tinted hitsplats <img src={TintedHitsplat} alt="Tinted Hitsplat" height={16}/> whose source is
                not able to be detected by the plugin.
                For example, Zebak's breath that kills his own boulders uses darker tinted hitsplats and
                will show up as an Unknown damage source.
                This is a limitation of the OSRS client.
            </Typography>
        ),
    },
];
