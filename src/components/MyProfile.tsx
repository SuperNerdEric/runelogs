import React, {useEffect, useMemo, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {useAuth0} from '@auth0/auth0-react';
import {
    Alert,
    Box,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    Tooltip,
    Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import AvatarIcon from './AvatarIcon';
import ProfileDetailsForm from './ProfileDetailsForm';
import ProfileDetailsView from './ProfileDetailsView';
import {useUserProfile} from '../hooks/useUserProfile';
import {
    AvatarId,
    AVATAR_LABELS,
    buildAvatarsList,
    formatUnlockDate,
    isAvatarId,
    PublicUserProfile,
} from '../utils/avatars';
import {accountTextSx, colors, contentColumnSx, fontSizes, typography} from '../theme';
import {displayUsername} from '../utils/utils';

const PROFILE_AVATAR_SIZE = 60;
const AVATAR_PREVIEW_SIZE = 96;
const AVATAR_TOOLTIP_WIDTH = 300;

const MyProfile: React.FC = () => {
    const {profileId} = useParams<{profileId?: string}>();
    const {isAuthenticated, isLoading, user} = useAuth0();
    const navigate = useNavigate();
    const {profile, loading, error, setAvatar, updateProfileDetails} = useUserProfile();
    const [pickerOpen, setPickerOpen] = useState(false);
    const [savingAvatarId, setSavingAvatarId] = useState<AvatarId | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [publicProfile, setPublicProfile] = useState<PublicUserProfile | null>(null);
    const [publicLoading, setPublicLoading] = useState(false);
    const [publicError, setPublicError] = useState<string | null>(null);

    const isOwnProfile = isAuthenticated && (
        !profileId
        || (!!user?.username && profileId === user.username)
        || profileId === user?.sub
    );

    useEffect(() => {
        if (!isLoading && !profileId && !isAuthenticated) {
            navigate('/');
        }
    }, [isLoading, profileId, isAuthenticated, navigate]);

    useEffect(() => {
        if (!profileId || isOwnProfile) {
            setPublicProfile(null);
            setPublicError(null);
            setPublicLoading(false);
            return;
        }

        let cancelled = false;

        const fetchPublicProfile = async () => {
            setPublicLoading(true);
            setPublicError(null);

            try {
                const resp = await fetch(
                    `${import.meta.env.VITE_API_URL}/profile/${encodeURIComponent(profileId)}`,
                );

                if (!resp.ok) {
                    throw new Error('Profile not found');
                }

                const data = await resp.json();
                if (!isAvatarId(data.avatarId)) {
                    throw new Error('Invalid profile response');
                }

                if (!cancelled) {
                    setPublicProfile(data as PublicUserProfile);
                }
            } catch (err) {
                if (!cancelled) {
                    setPublicError(err instanceof Error ? err.message : 'Failed to load profile');
                    setPublicProfile(null);
                }
            } finally {
                if (!cancelled) {
                    setPublicLoading(false);
                }
            }
        };

        void fetchPublicProfile();

        return () => {
            cancelled = true;
        };
    }, [profileId, isOwnProfile]);

    const unlockDates = useMemo(() => {
        const map = new Map<AvatarId, string>();
        profile?.unlocks.forEach((unlock) => {
            map.set(unlock.avatarId, unlock.unlockedAt);
        });
        return map;
    }, [profile?.unlocks]);

    const avatars = useMemo(
        () => (profile ? buildAvatarsList(profile.unlocks) : []),
        [profile],
    );

    const activeProfile = isOwnProfile ? profile : publicProfile;
    const pageLoading = isOwnProfile ? (isLoading || loading) : publicLoading;
    const pageError = isOwnProfile ? error : publicError;
    const displayName = profileId || user?.username || 'User';
    const currentAvatarId = activeProfile?.avatarId;

    const handleSelectAvatar = async (avatarId: AvatarId, locked: boolean) => {
        if (!isOwnProfile || !profile || locked || profile.avatarId === avatarId || savingAvatarId) {
            return;
        }

        setSaveError(null);
        setSavingAvatarId(avatarId);

        try {
            await setAvatar(avatarId);
            setPickerOpen(false);
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Failed to update avatar');
        } finally {
            setSavingAvatarId(null);
        }
    };

    if (pageLoading) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}>
                <CircularProgress />
            </Box>
        );
    }

    if (!activeProfile) {
        return (
            <Box sx={{...contentColumnSx, py: 2, px: 2}}>
                {pageError && (
                    <Alert severity="error">{pageError}</Alert>
                )}
            </Box>
        );
    }

    return (
        <Box sx={{...contentColumnSx, py: 2, px: 2}}>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, mb: 2}}>
                {currentAvatarId && (
                    isOwnProfile && profile ? (
                        <Tooltip title="Change Avatar" arrow placement="bottom">
                            <Box
                                component="button"
                                type="button"
                                onClick={() => {
                                    setSaveError(null);
                                    setPickerOpen(true);
                                }}
                                aria-label="Change avatar"
                                sx={{
                                    position: 'relative',
                                    p: 0,
                                    border: 'none',
                                    borderRadius: '50%',
                                    bgcolor: 'transparent',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    '&:hover .avatar-edit-overlay': {
                                        opacity: 1,
                                    },
                                    '&:focus-visible': {
                                        outline: `2px solid ${colors.upload.dragActive}`,
                                        outlineOffset: 4,
                                    },
                                }}
                            >
                                <AvatarIcon avatarId={currentAvatarId} size={PROFILE_AVATAR_SIZE} />
                                <Box
                                    className="avatar-edit-overlay"
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        borderRadius: '50%',
                                        bgcolor: 'rgba(0, 0, 0, 0.55)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        opacity: 0,
                                        transition: 'opacity 0.15s ease',
                                        pointerEvents: 'none',
                                    }}
                                >
                                    <EditIcon sx={{color: colors.text.primary, fontSize: 24}} />
                                </Box>
                            </Box>
                        </Tooltip>
                    ) : (
                        <AvatarIcon avatarId={currentAvatarId} size={PROFILE_AVATAR_SIZE} />
                    )
                )}
                <Typography
                    variant="h4"
                    sx={{
                        m: 0,
                        fontWeight: 600,
                        fontSize: typography.h4,
                        textTransform: 'capitalize',
                        lineHeight: 1.15,
                        ...accountTextSx,
                    }}
                >
                    {displayUsername(displayName)}
                </Typography>
            </Box>

            {pageError && (
                <Alert severity="error" sx={{mb: 2}}>
                    {pageError}
                </Alert>
            )}

            {isOwnProfile && profile ? (
                <ProfileDetailsForm profile={profile} onSave={updateProfileDetails} />
            ) : (
                <ProfileDetailsView profile={activeProfile} />
            )}

            {isOwnProfile && profile && (
            <Dialog
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                maxWidth="md"
                fullWidth
                slotProps={{
                    paper: {
                        elevation: 8,
                        sx: {
                            '&&': {
                                backgroundColor: colors.background.surface,
                                backgroundImage: 'none',
                            },
                            border: `1px solid ${colors.border.default}`,
                            borderRadius: 1,
                        },
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        position: 'relative',
                        color: colors.text.primary,
                        fontWeight: 600,
                        fontSize: fontSizes.xl,
                        pr: 6,
                        pb: 2.5,
                    }}
                >
                    Select an Avatar
                    <IconButton
                        onClick={() => setPickerOpen(false)}
                        aria-label="Close avatar picker"
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: colors.text.primary,
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <Divider sx={{borderColor: colors.border.default}} />
                <DialogContent sx={{pt: 3, pb: 3}}>
                    {saveError && (
                        <Alert severity="error" sx={{mb: 2}}>
                            {saveError}
                        </Alert>
                    )}
                    <Grid container spacing={2} justifyContent="center">
                        {avatars.map((avatar) => {
                            const isSelected = profile.avatarId === avatar.id;
                            const isSaving = savingAvatarId === avatar.id;

                            return (
                                <Grid
                                    item
                                    xs={6}
                                    sm={4}
                                    md={3}
                                    key={avatar.id}
                                    sx={{display: 'flex', justifyContent: 'center'}}
                                >
                                    <Tooltip
                                        slotProps={{
                                            tooltip: {
                                                sx: {
                                                    width: AVATAR_TOOLTIP_WIDTH,
                                                    minWidth: AVATAR_TOOLTIP_WIDTH,
                                                    maxWidth: AVATAR_TOOLTIP_WIDTH,
                                                    px: 2,
                                                    py: 1.75,
                                                    boxSizing: 'border-box',
                                                },
                                            },
                                        }}
                                        title={
                                            <Box
                                                sx={{
                                                    width: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    textAlign: 'center',
                                                }}
                                            >
                                                <Typography
                                                    component="span"
                                                    sx={{
                                                        display: 'block',
                                                        width: '100%',
                                                        fontSize: fontSizes.xl,
                                                        fontWeight: 600,
                                                        lineHeight: 1.25,
                                                        color: colors.text.primary,
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    {AVATAR_LABELS[avatar.id]}
                                                </Typography>
                                                <Box
                                                    sx={{
                                                        width: '100%',
                                                        mt: avatar.locked || unlockDates.get(avatar.id) ? 1 : 0,
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    {avatar.locked ? (
                                                        <Typography
                                                            component="span"
                                                            sx={{
                                                                fontSize: fontSizes.xs,
                                                                lineHeight: 1.4,
                                                                color: colors.fight.failure,
                                                                textAlign: 'center',
                                                            }}
                                                        >
                                                            {avatar.unlockHint}
                                                        </Typography>
                                                    ) : unlockDates.get(avatar.id) ? (
                                                        <Typography
                                                            component="span"
                                                            sx={{
                                                                fontSize: fontSizes.xs,
                                                                lineHeight: 1.4,
                                                                color: colors.fight.success,
                                                                textAlign: 'center',
                                                            }}
                                                        >
                                                            Unlocked {formatUnlockDate(unlockDates.get(avatar.id)!)}
                                                        </Typography>
                                                    ) : null}
                                                </Box>
                                            </Box>
                                        }
                                        arrow
                                        placement="top"
                                    >
                                        <Box
                                            component="button"
                                            type="button"
                                            onClick={() => void handleSelectAvatar(avatar.id, avatar.locked)}
                                            disabled={avatar.locked || isSaving}
                                            aria-label={AVATAR_LABELS[avatar.id]}
                                            aria-pressed={isSelected}
                                            sx={{
                                                position: 'relative',
                                                p: 0.5,
                                                border: 'none',
                                                borderRadius: '50%',
                                                bgcolor: 'transparent',
                                                cursor: avatar.locked ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'transform 0.15s ease',
                                                '&:hover:not(:disabled)': {
                                                    transform: 'scale(1.04)',
                                                },
                                                '&:focus-visible': {
                                                    outline: `2px solid ${colors.upload.dragActive}`,
                                                    outlineOffset: 4,
                                                },
                                            }}
                                        >
                                            <AvatarIcon
                                                avatarId={avatar.id}
                                                size={AVATAR_PREVIEW_SIZE}
                                                locked={avatar.locked}
                                                selected={isSelected}
                                            />
                                            {isSaving && (
                                                <CircularProgress
                                                    size={28}
                                                    sx={{
                                                        position: 'absolute',
                                                        top: '50%',
                                                        left: '50%',
                                                        mt: '-14px',
                                                        ml: '-14px',
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    </Tooltip>
                                </Grid>
                            );
                        })}
                    </Grid>
                </DialogContent>
            </Dialog>
            )}
        </Box>
    );
};

export default MyProfile;
