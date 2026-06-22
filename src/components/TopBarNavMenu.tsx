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
    useMediaQuery,
    useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import HistoryIcon from '@mui/icons-material/History';
import {Link as RouterLink} from 'react-router-dom';
import logoImage from '../assets/Logo.png';
import TrophyIcon from './TrophyIcon';
import {
    buildLeaderboardHref,
    LEADERBOARD_CONTENT_OPTIONS,
} from '../utils/leaderboardContent';
import {colors, fontSizes, layout} from '../theme';

const menuItemIconSx = {
    minWidth: 36,
    color: colors.upload.dragActive,
};

const navItemSx = {
    color: colors.text.primary,
    '&:hover': {backgroundColor: colors.background.hover},
};

const submenuItemSx = {
    ...navItemSx,
    pl: 4,
    fontSize: '0.95rem',
};

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

const TopBarNavMenu: React.FC<TopBarNavMenuProps> = ({iconButtonSx, onOpenChange}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [open, setOpen] = useState(false);
    const [leaderboardsExpanded, setLeaderboardsExpanded] = useState(false);
    const leaderboardsToggledByUser = React.useRef(false);

    const openMenu = () => {
        setOpen(true);
        onOpenChange?.(true);
        if (!leaderboardsToggledByUser.current && !isMobile) {
            setLeaderboardsExpanded(true);
        }
    };

    const closeMenu = () => {
        setOpen(false);
        onOpenChange?.(false);
    };

    const toggleLeaderboards = () => {
        leaderboardsToggledByUser.current = true;
        setLeaderboardsExpanded((prev) => !prev);
    };

    const leaderboardLinks = LEADERBOARD_CONTENT_OPTIONS.map((option) => ({
        label: option.label,
        to: buildLeaderboardHref({
            mode: 'time',
            leaderboard: option.value,
            playerCount: option.defaultPlayerCount,
        }),
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
                            onClick={toggleLeaderboards}
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
                            <List disablePadding>
                                {leaderboardLinks.map((item) => (
                                    <ListItemButton
                                        key={item.to}
                                        component={RouterLink}
                                        to={item.to}
                                        onClick={closeMenu}
                                        sx={submenuItemSx}
                                    >
                                        <ListItemText primary={item.label}/>
                                    </ListItemButton>
                                ))}
                            </List>
                        </Collapse>

                        <ListItemButton
                            component={RouterLink}
                            to="/recent-encounters"
                            onClick={closeMenu}
                            sx={navItemSx}
                        >
                            <ListItemIcon sx={menuItemIconSx}>
                                <HistoryIcon fontSize="small" sx={{color: colors.text.rune}}/>
                            </ListItemIcon>
                            <ListItemText primary="Recent Encounters"/>
                        </ListItemButton>

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
                    </List>
                </Box>
            </Drawer>
        </>
    );
};

export default TopBarNavMenu;
