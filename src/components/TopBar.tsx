import React, {useState} from 'react';
import {AppBar, Box, Button, Menu, MenuItem, Toolbar, Typography, useMediaQuery, useTheme} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {Icon} from '@iconify/react';
import {useAuth0} from '@auth0/auth0-react';
import logo from '../assets/Logo.png';
import {Link} from "react-router-dom";
import PlayerSearch from "./PlayerSearch";
import {displayUsername} from "../utils/utils";

const TopBar: React.FC = () => {
    const {isAuthenticated, user, loginWithRedirect, logout} = useAuth0();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [searchOpen, setSearchOpen] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    }

    const handleMenuClose = () => {
        setAnchorEl(null);
    }

    return (
        <AppBar position="static" style={{background: '#141414'}}>
            <Toolbar
                style={{
                    display: 'flex',
                    justifyContent: 'space-between'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                        component={Link}
                        to="/"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            textDecoration: 'none',
                            color: 'inherit',
                            marginRight: 2
                        }}
                    >
                        <img
                            src={logo}
                            alt="Runelogs.com"
                            style={{
                                marginRight: '5px',
                                height: '25px',
                                verticalAlign: 'middle'
                            }}
                        />
                        <Typography
                            variant="h6"
                            sx={{ margin: 0, color: 'white', fontSize: '25px' }}
                        >
                            Runelogs
                        </Typography>
                        <Icon
                            icon="clarity:beta-solid"
                            style={{
                                width: '35px',
                                height: '35px',
                                marginLeft: '10px'
                            }}
                        />
                    </Box>
                    {isMobile ? (
                        <>
                            <Icon
                                icon="ic:baseline-search"
                                onClick={() => setSearchOpen((prev) => !prev)}
                                style={{ fontSize: 28, color: 'white', cursor: 'pointer' }}
                            />
                        </>
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', height: '40px' }}>
                            <PlayerSearch />
                        </Box>
                    )}
                </Box>

                <div style={{display: 'flex', alignItems: 'center'}}>
                    {!isMobile && (
                        <>
                            <a
                                href="https://discord.gg/ZydwX7AJEd"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: '15px'
                                }}
                            >
                                <Icon
                                    icon="logos:discord-icon"
                                    style={{ width: '35px', height: '35px' }}
                                />
                            </a>
                            <a
                                href="https://github.com/SuperNerdEric/runelogs"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Icon
                                    icon="bi:github"
                                    style={{ width: '35px', height: '33px' }}
                                />
                            </a>
                        </>
                    )}
                    {!isAuthenticated && (
                        <Button
                            color="inherit"
                            onClick={() => loginWithRedirect()}
                            sx={{
                                ml: '20px',
                                textTransform: 'none',
                                fontSize: '16px',
                            }}
                        >
                            Log in / Register
                        </Button>
                    )}

                    {isAuthenticated && (
                        <>
                            <Button
                                color="inherit"
                                onClick={handleMenuOpen}
                                style={{
                                    textTransform: 'none',
                                    marginLeft: '10px',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {isMobile ? (
                                    <Icon icon="mdi:account-circle" style={{ width: 35, height: 35, color: 'white' }} />
                                ) : (
                                    <>
                                        <Typography variant="body1" style={{ color: 'white', textTransform: 'capitalize' }}>
                                            {displayUsername(user?.username) || 'User'}
                                        </Typography>
                                        <ArrowDropDownIcon style={{ color: 'white' }} />
                                    </>
                                )}
                            </Button>

                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleMenuClose}
                                anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                                transformOrigin={{vertical: 'top', horizontal: 'right'}}
                                slotProps={{
                                    paper: {
                                        sx: {
                                            backgroundColor: 'black',
                                            color: 'white',
                                            minHeight: 50,
                                            minWidth: 200,
                                            borderRadius: 1,
                                            border: '1px solid grey',
                                            boxShadow: '0px 4px 10px rgba(0,0,0,0.3)',
                                            '& .MuiMenu-list': {
                                                paddingY: 0.5
                                            },
                                            mt: 1,
                                            right: 0,
                                        }
                                    }
                                }}
                                MenuListProps={{
                                    sx: {
                                        '& .MuiMenuItem-root': {
                                            color: 'white',
                                            fontSize: '1rem',
                                            paddingY: 1,
                                            '&:hover': {backgroundColor: '#333'}
                                        }
                                    }
                                }}
                            >
                                <MenuItem
                                    component={Link}
                                    to={`/logs/${user?.username}`}
                                    onClick={handleMenuClose}
                                >
                                    My Logs
                                </MenuItem>

                                <MenuItem
                                    component={Link}
                                    to="/upload"
                                    onClick={handleMenuClose}
                                >
                                    Upload Log
                                </MenuItem>
                                <MenuItem
                                    component={Link}
                                    to="/help"
                                    onClick={handleMenuClose}
                                >
                                    Help
                                </MenuItem>
                                <MenuItem
                                    onClick={() => {
                                        handleMenuClose();
                                        logout({logoutParams: {returnTo: window.location.origin}});
                                    }}
                                >
                                    Logout
                                </MenuItem>
                            </Menu>
                        </>
                    )}
                </div>
            </Toolbar>
            {isMobile && searchOpen && (
                <Box sx={{ px: 2, pb: 1 }}>
                    <PlayerSearch onSelect={() => setSearchOpen(false)} />
                </Box>
            )}
        </AppBar>
    );
};

export default TopBar;
