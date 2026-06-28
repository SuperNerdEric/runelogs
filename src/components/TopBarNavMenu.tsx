import React, {useState} from 'react';
import {
    ChevronDown,
    ChevronUp,
    ExternalLink,
    HelpCircle,
    History,
    Menu,
    Users,
    X,
} from 'lucide-react';
import {Icon} from '@iconify/react';
import {Link as RouterLink} from 'react-router-dom';
import logoImage from '../assets/Logo.png';
import {Button} from '@/components/ui/button';
import {Sheet, SheetContent} from '@/components/ui/sheet';
import {cn} from '@/lib/utils';
import TrophyIcon from './TrophyIcon';
import {
    buildLeaderboardHref,
    buildRecentEncountersHref,
    LEADERBOARD_CONTENT_OPTIONS,
    RECENT_ENCOUNTERS_CONTENT_OPTIONS,
} from '../utils/leaderboardContent';

type TopBarNavMenuProps = {
    iconButtonClass?: string;
    onOpenChange?: (open: boolean) => void;
};

const COMMUNITY_LINKS = [
    {label: 'Discord', href: 'https://discord.gg/ZydwX7AJEd', icon: 'logos:discord-icon'},
    {label: 'GitHub', href: 'https://github.com/SuperNerdEric/runelogs', icon: 'bi:github'},
] as const;

const TopBarNavMenu: React.FC<TopBarNavMenuProps> = ({iconButtonClass, onOpenChange}) => {
    const [open, setOpen] = useState(false);
    const [leaderboardsExpanded, setLeaderboardsExpanded] = useState(false);
    const [recentEncountersExpanded, setRecentEncountersExpanded] = useState(false);
    const [communityExpanded, setCommunityExpanded] = useState(false);

    const openMenu = () => {
        setLeaderboardsExpanded(false);
        setRecentEncountersExpanded(false);
        setCommunityExpanded(false);
        setOpen(true);
        onOpenChange?.(true);
    };

    const closeMenu = () => {
        setOpen(false);
        onOpenChange?.(false);
    };

    const leaderboardLinks = LEADERBOARD_CONTENT_OPTIONS.map((option) => ({
        label: option.label,
        to: buildLeaderboardHref({
            mode: 'time',
            leaderboard: option.value,
            playerCount: option.defaultPlayerCount,
        }),
    }));

    const recentEncountersLinks = RECENT_ENCOUNTERS_CONTENT_OPTIONS.map((option) => ({
        label: option.label,
        to: buildRecentEncountersHref({content: option.value}),
    }));

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Open navigation menu"
                onClick={openMenu}
                className={cn('top-bar__nav-trigger [&_svg]:!size-7', iconButtonClass)}
            >
                <Menu aria-hidden />
            </Button>

            <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) closeMenu(); }}>
                <SheetContent
                    side="left"
                    className="nav-drawer-content p-0 [&>button]:hidden"
                >
                    <div className="nav-drawer-inner">
                        <div className="nav-drawer-header">
                            <div className="nav-drawer-header__logo-wrap">
                                <RouterLink
                                    to="/"
                                    onClick={closeMenu}
                                    className="top-bar__logo-link"
                                >
                                    <img
                                        src={logoImage}
                                        alt="Runelogs.com"
                                        style={{
                                            marginRight: '5px',
                                            height: '25px',
                                            verticalAlign: 'middle',
                                        }}
                                    />
                                    <h6 className="top-bar__logo-text">
                                        <span className="text-account">Rune</span>
                                        <span className="logs-text">logs</span>
                                    </h6>
                                </RouterLink>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Close navigation menu"
                                onClick={closeMenu}
                                className="mr-1 shrink-0"
                            >
                                <X aria-hidden />
                            </Button>
                        </div>

                        <nav className="nav-drawer-nav">
                            <button
                                type="button"
                                className="nav-drawer-item-btn nav-drawer-item"
                                onClick={() => setLeaderboardsExpanded((prev) => !prev)}
                            >
                                <span className="top-bar__menu-item-icon flex items-center">
                                    <TrophyIcon size={20} />
                                </span>
                                <span className="nav-drawer-item-btn__label">Leaderboards</span>
                                {leaderboardsExpanded ? (
                                    <ChevronUp className="nav-drawer-item-btn__chevron size-5" aria-hidden />
                                ) : (
                                    <ChevronDown className="nav-drawer-item-btn__chevron size-5" aria-hidden />
                                )}
                            </button>
                            {leaderboardsExpanded && (
                                <div className="nav-drawer-submenu nav-drawer-submenu--leaderboards">
                                    {leaderboardLinks.map((item) => (
                                        <RouterLink
                                            key={item.to}
                                            to={item.to}
                                            onClick={closeMenu}
                                            className="nav-drawer-item-btn nav-drawer-item nav-drawer-submenu-item"
                                        >
                                            {item.label}
                                        </RouterLink>
                                    ))}
                                </div>
                            )}

                            <button
                                type="button"
                                className="nav-drawer-item-btn nav-drawer-item"
                                onClick={() => setRecentEncountersExpanded((prev) => !prev)}
                            >
                                <span className="top-bar__menu-item-icon flex items-center text-account">
                                    <History className="size-4" aria-hidden />
                                </span>
                                <span className="nav-drawer-item-btn__label">Recent Encounters</span>
                                {recentEncountersExpanded ? (
                                    <ChevronUp className="nav-drawer-item-btn__chevron size-5" aria-hidden />
                                ) : (
                                    <ChevronDown className="nav-drawer-item-btn__chevron size-5" aria-hidden />
                                )}
                            </button>
                            {recentEncountersExpanded && (
                                <div className="nav-drawer-submenu nav-drawer-submenu--recent">
                                    {recentEncountersLinks.map((item) => (
                                        <RouterLink
                                            key={item.to}
                                            to={item.to}
                                            onClick={closeMenu}
                                            className="nav-drawer-item-btn nav-drawer-item nav-drawer-submenu-item"
                                        >
                                            {item.label}
                                        </RouterLink>
                                    ))}
                                </div>
                            )}

                            <button
                                type="button"
                                className="nav-drawer-item-btn nav-drawer-item"
                                onClick={() => setCommunityExpanded((prev) => !prev)}
                            >
                                <span className="top-bar__menu-item-icon flex items-center">
                                    <Users className="size-4" aria-hidden />
                                </span>
                                <span className="nav-drawer-item-btn__label">Community</span>
                                {communityExpanded ? (
                                    <ChevronUp className="nav-drawer-item-btn__chevron size-5" aria-hidden />
                                ) : (
                                    <ChevronDown className="nav-drawer-item-btn__chevron size-5" aria-hidden />
                                )}
                            </button>
                            {communityExpanded && (
                                <div className="nav-drawer-submenu nav-drawer-submenu--community">
                                    {COMMUNITY_LINKS.map((item) => (
                                        <a
                                            key={item.href}
                                            href={item.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={closeMenu}
                                            className="nav-drawer-item-btn nav-drawer-item nav-drawer-submenu-item nav-drawer-community-link"
                                        >
                                            <Icon
                                                icon={item.icon}
                                                className="nav-drawer-community-link__icon"
                                                style={{
                                                    color: item.icon === 'bi:github'
                                                        ? 'var(--color-text-primary)'
                                                        : undefined,
                                                }}
                                            />
                                            <span>{item.label}</span>
                                            <ExternalLink
                                                className="nav-drawer-community-link__external"
                                                aria-hidden
                                            />
                                        </a>
                                    ))}
                                </div>
                            )}

                            <RouterLink
                                to="/help"
                                onClick={closeMenu}
                                className="nav-drawer-item-btn nav-drawer-item"
                            >
                                <span className="top-bar__menu-item-icon flex items-center">
                                    <HelpCircle className="size-4" aria-hidden />
                                </span>
                                <span className="nav-drawer-item-btn__label">Help</span>
                            </RouterLink>
                        </nav>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
};

export default TopBarNavMenu;
