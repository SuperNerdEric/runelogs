import React, {useEffect, useMemo, useState} from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {CircleHelp} from 'lucide-react';
import {Icon} from '@iconify/react';
import {useLocation} from 'react-router-dom';
import FindCombatLogIcon from '../assets/help/find_combat_log.png';
import BrightHitsplat from '../assets/help/bright_hitsplat.png';
import TintedHitsplat from '../assets/help/tinted_hitsplat.png';
import PanelIcon from '../assets/help/panel_icon.png';
import FolderIcon from '../assets/help/folder_icon.png';
import {
    pageHeaderClass,
    pageHeaderIconClass,
    pageHeaderTitleClass,
} from './pageHeaderStyles';
import {colors, contentColumnClass} from '../theme';
import {cn} from '@/lib/utils';

type FaqItem = { id: string; title: string; body: React.ReactNode };

const Help: React.FC = () => {
    const {hash} = useLocation();
    const openId = useMemo(() => (hash ? hash.slice(1) : null), [hash]);
    const [expandedId, setExpandedId] = useState<string | undefined>(openId ?? undefined);

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
        <div className={cn(contentColumnClass, 'mt-2 px-2 pb-4 max-[1279px]:px-1')}>
            <div className={pageHeaderClass}>
                <div className={pageHeaderIconClass}>
                    <CircleHelp size={32} style={{color: colors.upload.dragActive}} aria-hidden/>
                </div>
                <h1 className={pageHeaderTitleClass}>Help</h1>
            </div>

            <div className="px-0.5">
                <h2 className="mb-4 text-xl font-semibold text-[var(--color-text-primary)]">
                    Frequently Asked Questions
                </h2>

                <Accordion
                    type="single"
                    collapsible
                    value={expandedId}
                    onValueChange={(value) => setExpandedId(value || undefined)}
                >
                    {faq.map(({id, title, body}) => (
                        <AccordionItem key={id} value={id} id={id} className="help-faq-item border-b-0">
                            <AccordionTrigger className="help-faq-trigger hover:no-underline">
                                <span className="help-faq-title">{title}</span>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="help-faq-content">{body}</div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>

                <div className="mt-10">
                    <h3 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
                        Support
                    </h3>
                    <p className="mb-3 text-[var(--color-text-muted)]">
                        Still need help?
                    </p>
                    <p className="mb-3 leading-relaxed text-[var(--color-text-primary)]">
                        Runelogs is a community-driven project, and we&apos;re happy to help if you
                        run into any issues.
                        Our Discord is usually the quickest way to get answers, while GitHub is best for
                        reporting bugs or suggesting features.
                    </p>
                    <p className="leading-relaxed text-[var(--color-text-primary)]">
                        Reach out to us on{' '}
                        <a
                            href="https://discord.gg/ZydwX7AJEd"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="help-support-link"
                        >
                            <Icon icon="logos:discord-icon"/>
                            Discord
                        </a>
                        {' '}or open an issue on{' '}
                        <a
                            href="https://github.com/SuperNerdEric/runelogs"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="help-support-link"
                        >
                            <Icon icon="bi:github"/>
                            GitHub
                        </a>
                        .
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Help;

const faq: FaqItem[] = [
    {
        id: 'what-is-runelogs',
        title: 'What is Runelogs?',
        body: (
            <p>
                Runelogs is a combat log analysis tool for Old School RuneScape that works with the{' '}
                <a href="https://runelite.net/plugin-hub/show/combat-logger" target="_blank" rel="noopener noreferrer">
                    Combat Logger
                </a>{' '}
                plugin to help players review fights, track performance, and improve strategy.
                It offers leaderboards, detailed breakdowns, and visualizations powered by parsed in-game data.
            </p>
        ),
    },
    {
        id: 'find-combat-log',
        title: 'Where do I find my combat log files?',
        body: (
            <>
                <p>
                    1. Click the Combat Logger{' '}
                    <img src={PanelIcon} alt="Panel Icon" className="help-icon-inline"/>
                    {' '}panel icon in the RuneLite sidebar.
                </p>
                <p>
                    2. Click the Folder{' '}
                    <img src={FolderIcon} alt="Folder Icon" className="help-icon-inline"/>
                    {' '}icon to open your combat log folder.
                </p>
                <div className="help-image-center">
                    <img
                        src={FindCombatLogIcon}
                        alt="Find Combat Log"
                    />
                </div>
            </>
        ),
    },
    {
        id: 'unknown-source',
        title: 'What does Unknown damage source mean?',
        body: (
            <p>
                All darker tinted hitsplats{' '}
                <img src={TintedHitsplat} alt="Tinted Hitsplat" className="help-icon-inline"/>
                {' '}from in-game show up as an Unknown source by default. However, if another player is in your{' '}
                <a href="https://github.com/runelite/runelite/wiki/Party" target="_blank" rel="noopener noreferrer">
                    Party
                </a>{' '}
                with the Combat Logger plugin running, you will be able to see their hitsplats as the plugin shares it automatically.
            </p>
        ),
    },
    {
        id: 'thralls',
        title: 'Are my thralls showing up as Unknown?',
        body: (
            <p>
                No, your thralls use brighter hitsplats{' '}
                <img src={BrightHitsplat} alt="Bright Hitsplat" className="help-icon-inline"/>
                {' '}that indicate it is your damage. There is currently no way to differentiate your thrall&apos;s damage from your damage.
            </p>
        ),
    },
    {
        id: 'still-unknown',
        title: 'Everyone in my Party has the plugin yet I\'m still seeing some Unknown damage sources?',
        body: (
            <p>
                Some fights will naturally have darker tinted hitsplats{' '}
                <img src={TintedHitsplat} alt="Tinted Hitsplat" className="help-icon-inline"/>
                {' '}whose source is not able to be detected by the plugin.
                For example, Zebak&apos;s breath that kills his own boulders uses darker tinted hitsplats and
                will show up as an Unknown damage source.
                This is a limitation of the OSRS client.
            </p>
        ),
    },
];
