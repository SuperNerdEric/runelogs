import React, {useState} from 'react';
import {
    ChevronDown,
    CloudUpload,
    FolderOpen,
    LogOut,
    User,
    Radio,
} from 'lucide-react';
import {Icon} from '@iconify/react';
import {useAuth0} from '@auth0/auth0-react';
import {Link as RouterLink, useNavigate} from 'react-router-dom';
import logoImage from '../assets/Logo.png';
import {Button} from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {useIsMobile} from '@/hooks/useMediaQuery';
import {cn} from '@/lib/utils';
import {accountTextClass} from '../theme/layout';
import PlayerSearch from './PlayerSearch';
import TopBarNavMenu from './TopBarNavMenu';
import {displayUsername} from '../utils/utils';
import AvatarIcon from './AvatarIcon';
import {useUserProfile} from '../hooks/useUserProfile';
import {AvatarId, isAvatarId} from '../utils/avatars';

const TopBar: React.FC = () => {
    const {isAuthenticated, user, loginWithRedirect, logout} = useAuth0();
    const navigate = useNavigate();
    const [searchOpen, setSearchOpen] = useState(false);
    const [navMenuOpen, setNavMenuOpen] = useState(false);

    const isMobile = useIsMobile();
    const {profile} = useUserProfile();
    const avatarId: AvatarId | null =
        profile?.avatarId && isAvatarId(profile.avatarId) ? profile.avatarId : null;

    const logoLink = (
        <RouterLink
            to="/"
            className={cn(
                'top-bar__logo-link',
                !isMobile && 'top-bar__logo-link--desktop',
            )}
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
    );

    return (
        <header className="top-bar">
            <div
                className={cn(
                    'top-bar__toolbar',
                    isMobile && 'top-bar__toolbar--mobile',
                )}
            >
                {isMobile ? (
                    <>
                        <div className="top-bar__left-cluster">
                            <TopBarNavMenu
                                onOpenChange={setNavMenuOpen}
                            />
                            <Icon
                                icon="ic:baseline-search"
                                onClick={() => setSearchOpen((prev) => !prev)}
                                className="top-bar__search-icon"
                                aria-label="Toggle player search"
                            />
                        </div>
                        {/* Hide the top-bar logo while the nav drawer is open — the drawer header already shows it. */}
                        <div
                            className="top-bar__logo-center"
                            style={{visibility: navMenuOpen ? 'hidden' : 'visible'}}
                        >
                            {logoLink}
                        </div>
                    </>
                ) : (
                    <div className="top-bar__left-cluster">
                        <TopBarNavMenu />
                        {logoLink}
                        <div className="top-bar__search-row">
                            <PlayerSearch />
                        </div>
                    </div>
                )}

                <div
                    className={cn(
                        'top-bar__actions',
                        isMobile && 'top-bar__actions--mobile',
                    )}
                >
                    {!isAuthenticated && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => loginWithRedirect()}
                            className="top-bar__login-btn"
                        >
                            Log in / Register
                        </Button>
                    )}

                    {isAuthenticated && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="top-bar__user-trigger"
                                >
                                    {isMobile ? (
                                        avatarId ? (
                                            <AvatarIcon avatarId={avatarId} size={35} />
                                        ) : (
                                            <Icon
                                                icon="mdi:account-circle"
                                                style={{
                                                    width: 35,
                                                    height: 35,
                                                    color: 'var(--color-text-primary)',
                                                }}
                                            />
                                        )
                                    ) : (
                                        <>
                                            {avatarId && (
                                                <AvatarIcon
                                                    avatarId={avatarId}
                                                    size={32}
                                                    className="mr-2"
                                                />
                                            )}
                                            <span
                                                className={cn(
                                                    accountTextClass,
                                                    'font-semibold capitalize',
                                                )}
                                            >
                                                {displayUsername(user?.username) || 'User'}
                                            </span>
                                            <ChevronDown
                                                className="text-[var(--color-text-primary)]"
                                                aria-hidden
                                            />
                                        </>
                                    )}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" sideOffset={8} variant="userMenu">
                                <DropdownMenuItem
                                    variant="userMenu"
                                    onClick={() => navigate('/profile')}
                                >
                                    <span className="top-bar__menu-item-icon flex items-center">
                                        <User className="size-4" aria-hidden />
                                    </span>
                                    My Profile
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    variant="userMenu"
                                    onClick={() => navigate(`/logs/${user?.username}`)}
                                >
                                    <span className="top-bar__menu-item-icon flex items-center">
                                        <FolderOpen className="size-4" aria-hidden />
                                    </span>
                                    My Logs
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    variant="userMenu"
                                    onClick={() => navigate('/live-log')}
                                >
                                    <span className="top-bar__menu-item-icon flex items-center">
                                        <Radio className="size-4" aria-hidden />
                                    </span>
                                    Live Log
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    variant="userMenu"
                                    onClick={() => navigate('/upload')}
                                >
                                    <span className="top-bar__menu-item-icon flex items-center">
                                        <CloudUpload className="size-4" aria-hidden />
                                    </span>
                                    Upload Log
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    variant="userMenu"
                                    onClick={() =>
                                        logout({logoutParams: {returnTo: window.location.origin}})
                                    }
                                >
                                    <span className="top-bar__menu-item-icon flex items-center">
                                        <LogOut className="size-4" aria-hidden />
                                    </span>
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
            {isMobile && searchOpen && (
                <div className="top-bar__search-expand">
                    <PlayerSearch fullWidth onSelect={() => setSearchOpen(false)} />
                </div>
            )}
        </header>
    );
};

export default TopBar;
