import React, {useState} from 'react';
import {
    Box,
    Collapse,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import HistoryIcon from '@mui/icons-material/History';
import {Icon} from '@iconify/react';
import {Link as RouterLink} from 'react-router-dom';
import logoImage from '../assets/Logo.png';
import TrophyIcon from './TrophyIcon';
import {
    buildLeaderboardHref,
    buildRecentEncountersHref,
    LEADERBOARD_CONTENT_OPTIONS,
    RECENT_ENCOUNTERS_CONTENT_OPTIONS,
} from '../utils/leaderboardContent';
import {resolveContentSpriteKey} from '../lib/hiscoreSprites';
import HiscoreSpriteIcon from './HiscoreSpriteIcon';
import {colors, fontSizes, layout} from '../theme';

const menuItemIconSx = {
    minWidth: 36,
    color: colors.upload.dragActive,
};

const navItemSx = {
    color: colors.text.primary,
    '&:hover': {backgroundColor: colors.background.hover},
};

const submenuItemTextSx = {
    '& .MuiListItemText-primary': {
        fontSize: '0.875rem',
        color: colors.text.primary,
    },
};

const SUBMENU_INDENT_PX = 52;
const SUBMENU_LINE_LEFT_PX = 24;

const submenuItemSx = {
    ...navItemSx,
    pl: `${SUBMENU_INDENT_PX}px`,
    ...submenuItemTextSx,
};

const NAV_SECTION_LINE_COLORS = {
    leaderboards: colors.medal.gold,
    recentEncounters: colors.text.rune,
    community: colors.upload.dragActive,
} as const;

const createSubmenuListSx = (lineColor: string) => ({
    position: 'relative',
    py: 0.5,
    '&::before': {
        content: '""',
        position: 'absolute',
        left: `${SUBMENU_LINE_LEFT_PX}px`,
        top: 8,
        bottom: 8,
        width: '2px',
        borderRadius: '999px',
        backgroundColor: lineColor,
        opacity: 0.35,
        zIndex: 1,
        pointerEvents: 'none',
    },
});

const drawerPaperSx = {
    backgroundColor: colors.background.black,
    backgroundImage: 'none',
    boxShadow: 'none',
    color: colors.text.primary,
    borderRight: `1px solid ${colors.border.default}`,
};

type TopBarNavMenuProps = {
    iconButtonSx?: object;
    onOpenChange?: (open: boolean) => void;
};

const COMMUNITY_LINKS = [
    {label: 'Discord', href: 'https://discord.gg/ZydwX7AJEd', icon: 'logos:discord-icon'},
    {label: 'GitHub', href: 'https://github.com/SuperNerdEric/runelogs', icon: 'bi:github'},
] as const;

const TopBarNavMenu: React.FC<TopBarNavMenuProps> = ({iconButtonSx, onOpenChange}) => {
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
        value: option.value,
        to: buildLeaderboardHref({
            mode: 'time',
            leaderboard: option.value,
            playerCount: option.defaultPlayerCount,
        }),
    }));

    const recentEncountersLinks = RECENT_ENCOUNTERS_CONTENT_OPTIONS.map((option) => ({
        label: option.label,
        value: option.value,
        to: buildRecentEncountersHref({content: option.value}),
    }));

    return (
        <>
            <IconButton
                color="inherit"
                aria-label="Open navigation menu"
                onClick={openMenu}
                sx={iconButtonSx}
            >
                <MenuIcon sx={{fontSize: fontSizes.topBarIcon}}/>
            </IconButton>

            <Drawer
                anchor="left"
                open={open}
                onClose={closeMenu}
                elevation={0}
                PaperProps={{sx: drawerPaperSx}}
            >
                <Box sx={{width: 280, display: 'flex', flexDirection: 'column', height: '100%', bgcolor: colors.background.black}}>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto',
                            alignItems: 'center',
                            height: layout.topBarHeight,
                            minHeight: layout.topBarHeight,
                            flexShrink: 0,
                            borderBottom: `1px solid ${colors.border.default}`,
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                minWidth: 0,
                            }}
                        >
                            <Box
                                component={RouterLink}
                                to="/"
                                onClick={closeMenu}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    textDecoration: 'none',
                                    color: 'inherit',
                                }}
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
                            <Typography
                                variant="h6"
                                sx={{m: 0, color: colors.text.primary, fontSize: fontSizes.topBarLogo}}
                            >
                                <Box component="span" sx={{color: colors.text.rune}}>Rune</Box>
                                <Box component="span" sx={{color: colors.text.logs}}>logs</Box>
                            </Typography>
                            </Box>
                        </Box>
                        <IconButton
                            color="inherit"
                            aria-label="Close navigation menu"
                            onClick={closeMenu}
                            size="small"
                            sx={{mr: 0.5, flexShrink: 0}}
                        >
                            <CloseIcon/>
                        </IconButton>
                    </Box>

                    <List sx={{py: 0.5, flex: 1}}>
                        <ListItemButton
                            onClick={() => setLeaderboardsExpanded((prev) => !prev)}
                            sx={navItemSx}
                        >
                            <ListItemIcon sx={menuItemIconSx}>
                                <TrophyIcon size={20}/>
                            </ListItemIcon>
                            <ListItemText primary="Leaderboards"/>
                            {leaderboardsExpanded ? (
                                <ExpandLess sx={{color: colors.text.primary}}/>
                            ) : (
                                <ExpandMore sx={{color: colors.text.primary}}/>
                            )}
                        </ListItemButton>
                        <Collapse in={leaderboardsExpanded} timeout="auto" unmountOnExit>
                            <List disablePadding sx={createSubmenuListSx(NAV_SECTION_LINE_COLORS.leaderboards)}>
                                {leaderboardLinks.map((item) => (
                                    <ListItemButton
                                        key={item.to}
                                        component={RouterLink}
                                        to={item.to}
                                        onClick={closeMenu}
                                        sx={submenuItemSx}
                                    >
                                        <ListItemIcon sx={{...menuItemIconSx, minWidth: 32}}>
                                            <HiscoreSpriteIcon
                                                spriteKey={resolveContentSpriteKey(item.value)}
                                                height={18}
                                            />
                                        </ListItemIcon>
                                        <ListItemText primary={item.label}/>
                                    </ListItemButton>
                                ))}
                            </List>
                        </Collapse>

                        <ListItemButton
                            onClick={() => setRecentEncountersExpanded((prev) => !prev)}
                            sx={navItemSx}
                        >
                            <ListItemIcon sx={menuItemIconSx}>
                                <HistoryIcon fontSize="small" sx={{color: colors.text.rune}}/>
                            </ListItemIcon>
                            <ListItemText primary="Recent Encounters"/>
                            {recentEncountersExpanded ? (
                                <ExpandLess sx={{color: colors.text.primary}}/>
                            ) : (
                                <ExpandMore sx={{color: colors.text.primary}}/>
                            )}
                        </ListItemButton>
                        <Collapse in={recentEncountersExpanded} timeout="auto" unmountOnExit>
                            <List disablePadding sx={createSubmenuListSx(NAV_SECTION_LINE_COLORS.recentEncounters)}>
                                {recentEncountersLinks.map((item) => (
                                    <ListItemButton
                                        key={item.to}
                                        component={RouterLink}
                                        to={item.to}
                                        onClick={closeMenu}
                                        sx={submenuItemSx}
                                    >
                                        <ListItemIcon sx={{...menuItemIconSx, minWidth: 32}}>
                                            <HiscoreSpriteIcon
                                                spriteKey={resolveContentSpriteKey(item.value)}
                                                height={18}
                                            />
                                        </ListItemIcon>
                                        <ListItemText primary={item.label}/>
                                    </ListItemButton>
                                ))}
                            </List>
                        </Collapse>

                        <ListItemButton
                            onClick={() => setCommunityExpanded((prev) => !prev)}
                            sx={navItemSx}
                        >
                            <ListItemIcon sx={menuItemIconSx}>
                                <GroupsOutlinedIcon fontSize="small"/>
                            </ListItemIcon>
                            <ListItemText primary="Community"/>
                            {communityExpanded ? (
                                <ExpandLess sx={{color: colors.text.primary}}/>
                            ) : (
                                <ExpandMore sx={{color: colors.text.primary}}/>
                            )}
                        </ListItemButton>
                        <Collapse in={communityExpanded} timeout="auto" unmountOnExit>
                            <List disablePadding sx={createSubmenuListSx(NAV_SECTION_LINE_COLORS.community)}>
                                {COMMUNITY_LINKS.map((item) => (
                                    <ListItemButton
                                        key={item.href}
                                        component="a"
                                        href={item.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={closeMenu}
                                        sx={submenuItemSx}
                                    >
                                        <Icon
                                            icon={item.icon}
                                            style={{
                                                width: 20,
                                                height: 20,
                                                flexShrink: 0,
                                                marginRight: 8,
                                                color: item.icon === 'bi:github' ? colors.text.primary : undefined,
                                            }}
                                        />
                                        <ListItemText
                                            primary={item.label}
                                            sx={{flex: '0 0 auto', m: 0}}
                                        />
                                        <OpenInNewIcon sx={{fontSize: 14, color: colors.text.iconHover, flexShrink: 0, ml: 1}}/>
                                    </ListItemButton>
                                ))}
                            </List>
                        </Collapse>

                        <ListItemButton
                            component={RouterLink}
                            to="/help"
                            onClick={closeMenu}
                            sx={navItemSx}
                        >
                            <ListItemIcon sx={menuItemIconSx}>
                                <HelpOutlineIcon fontSize="small"/>
                            </ListItemIcon>
                            <ListItemText primary="Help"/>
                        </ListItemButton>

                        <ListItemButton
                            component={RouterLink}
                            to="/privacy"
                            onClick={closeMenu}
                            sx={navItemSx}
                        >
                            <ListItemIcon sx={menuItemIconSx}>
                                <PrivacyTipIcon fontSize="small"/>
                            </ListItemIcon>
                            <ListItemText primary="Privacy"/>
                        </ListItemButton>
                    </List>
                </Box>
            </Drawer>
        </>
    );
};

export default TopBarNavMenu;
