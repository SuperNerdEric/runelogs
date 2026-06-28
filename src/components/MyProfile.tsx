import React, {useEffect, useMemo, useState} from 'react';
import {Link as RouterLink, useNavigate, useParams} from 'react-router-dom';
import {useAuth0} from '@auth0/auth0-react';
import {Pencil} from 'lucide-react';
import AppTooltip from './AppTooltip';
import AvatarIcon from './AvatarIcon';
import ProfileDetailsForm from './ProfileDetailsForm';
import ProfileDetailsView from './ProfileDetailsView';
import {
    PAGE_HEADER_ICON_SIZE,
    pageHeaderClass,
    pageHeaderSubtitleLinkClass,
    pageHeaderTitleAccountClass,
} from './pageHeaderStyles';
import {useUserProfile} from '../hooks/useUserProfile';
import {
    AvatarId,
    AVATAR_LABELS,
    buildAvatarsList,
    formatUnlockDate,
    isAvatarId,
    PublicUserProfile,
} from '../utils/avatars';
import {contentColumnClass} from '../theme';
import {buildUploaderLogsHref} from '../utils/leaderboardContent';
import {displayUsername} from '../utils/utils';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {Spinner} from '@/components/ui/spinner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {cn} from '@/lib/utils';
import {colors} from '../theme';

const AVATAR_PREVIEW_SIZE = 96;

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
    const logsUsername = profileId || user?.username;
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
            <div className="flex justify-center py-12">
                <Spinner className="size-8 text-white"/>
            </div>
        );
    }

    if (!activeProfile) {
        return (
            <div className={cn(contentColumnClass, 'px-2 py-2')}>
                {pageError && (
                    <Alert variant="destructive">
                        <AlertDescription>{pageError}</AlertDescription>
                    </Alert>
                )}
            </div>
        );
    }

    return (
        <div className={cn(contentColumnClass, 'px-2 py-2')}>
            <div className={pageHeaderClass}>
                {currentAvatarId && (
                    isOwnProfile && profile ? (
                        <AppTooltip title="Change Avatar" side="bottom" disableTouch>
                            <button
                                type="button"
                                onClick={() => {
                                    setSaveError(null);
                                    setPickerOpen(true);
                                }}
                                aria-label="Change avatar"
                                className="avatar-change-btn"
                                style={{width: PAGE_HEADER_ICON_SIZE, height: PAGE_HEADER_ICON_SIZE}}
                            >
                                <AvatarIcon avatarId={currentAvatarId} size={PAGE_HEADER_ICON_SIZE}/>
                                <span className="avatar-edit-overlay">
                                    <Pencil className="size-6 text-white"/>
                                </span>
                            </button>
                        </AppTooltip>
                    ) : (
                        <div
                            className="shrink-0"
                            style={{width: PAGE_HEADER_ICON_SIZE, height: PAGE_HEADER_ICON_SIZE}}
                        >
                            <AvatarIcon avatarId={currentAvatarId} size={PAGE_HEADER_ICON_SIZE}/>
                        </div>
                    )
                )}
                <div>
                    <h1 className={pageHeaderTitleAccountClass}>
                        {displayUsername(displayName)}
                    </h1>
                    {logsUsername && (
                        <RouterLink
                            to={buildUploaderLogsHref(logsUsername)}
                            className={pageHeaderSubtitleLinkClass}
                        >
                            View logs {'->'}
                        </RouterLink>
                    )}
                </div>
            </div>

            {pageError && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{pageError}</AlertDescription>
                </Alert>
            )}

            {isOwnProfile && profile ? (
                <ProfileDetailsForm profile={profile} onSave={updateProfileDetails}/>
            ) : (
                <ProfileDetailsView profile={activeProfile}/>
            )}

            {isOwnProfile && profile && (
                <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
                    <DialogContent className="max-w-3xl border-[var(--color-border-default)] bg-[var(--color-bg-surface)]">
                        <DialogHeader>
                            <DialogTitle className="pr-8 text-xl font-semibold text-[var(--color-text-primary)]">
                                Select an Avatar
                            </DialogTitle>
                        </DialogHeader>
                        <div className="border-t border-[var(--color-border-default)] pt-6">
                            {saveError && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertDescription>{saveError}</AlertDescription>
                                </Alert>
                            )}
                            <div className="avatar-picker-grid">
                                {avatars.map((avatar) => {
                                    const isSelected = profile.avatarId === avatar.id;
                                    const isSaving = savingAvatarId === avatar.id;

                                    return (
                                        <AppTooltip
                                            key={avatar.id}
                                            disableTouch
                                            side="top"
                                            className="avatar-tooltip-content"
                                            title={
                                                <div className="flex w-full flex-col items-center text-center">
                                                    <span className="block w-full text-xl font-semibold leading-tight text-[var(--color-text-primary)]">
                                                        {AVATAR_LABELS[avatar.id]}
                                                    </span>
                                                    {(avatar.locked || unlockDates.get(avatar.id)) && (
                                                        <div className="mt-2 flex w-full items-start justify-center">
                                                            {avatar.locked ? (
                                                                <span
                                                                    className="text-xs leading-snug text-center"
                                                                    style={{color: colors.fight.failure}}
                                                                >
                                                                    {avatar.unlockHint}
                                                                </span>
                                                            ) : unlockDates.get(avatar.id) ? (
                                                                <span
                                                                    className="text-xs leading-snug text-center"
                                                                    style={{color: colors.fight.success}}
                                                                >
                                                                    Unlocked {formatUnlockDate(unlockDates.get(avatar.id)!)}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    )}
                                                </div>
                                            }
                                        >
                                            <button
                                                type="button"
                                                onClick={() => void handleSelectAvatar(avatar.id, avatar.locked)}
                                                disabled={avatar.locked || isSaving}
                                                aria-label={AVATAR_LABELS[avatar.id]}
                                                aria-pressed={isSelected}
                                                className="avatar-picker-btn"
                                            >
                                                <AvatarIcon
                                                    avatarId={avatar.id}
                                                    size={AVATAR_PREVIEW_SIZE}
                                                    locked={avatar.locked}
                                                    selected={isSelected}
                                                />
                                                {isSaving && (
                                                    <Spinner className="absolute left-1/2 top-1/2 size-7 -translate-x-1/2 -translate-y-1/2"/>
                                                )}
                                            </button>
                                        </AppTooltip>
                                    );
                                })}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default MyProfile;
