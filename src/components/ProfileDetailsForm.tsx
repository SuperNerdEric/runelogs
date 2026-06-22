import React, {useEffect, useState} from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    InputAdornment,
    TextField,
    Typography,
} from '@mui/material';
import {Icon} from '@iconify/react';
import {UserProfile} from '../utils/avatars';
import {
    BIO_MAX_LENGTH,
    CONTACT_FIELDS,
    ContactLinkKey,
    getContactFormValue,
    normalizeContactValue,
    ProfileDetailsInput,
} from '../utils/profile';
import {colors, fontSizes} from '../theme';

const fieldSx = {
    '& .MuiOutlinedInput-root': {
        backgroundColor: colors.background.surface,
        color: colors.text.primary,
        '& fieldset': {
            borderColor: colors.border.default,
        },
        '&:hover fieldset': {
            borderColor: colors.background.hover,
        },
        '&.Mui-focused fieldset': {
            borderColor: colors.upload.dragActive,
        },
    },
    '& .MuiInputLabel-root': {
        color: colors.text.muted,
    },
    '& .MuiFormHelperText-root': {
        color: colors.text.muted,
    },
};

const sectionTitleSx = {
    color: colors.text.primary,
    fontWeight: 600,
    fontSize: fontSizes.lg,
    mb: 1.5,
} as const;

const saveButtonSx = {
    textTransform: 'none',
    minWidth: 72,
    bgcolor: colors.upload.dragActive,
    '&:hover': {
        bgcolor: colors.upload.dragActive,
        filter: 'brightness(1.1)',
    },
} as const;

const cancelButtonSx = {
    textTransform: 'none',
    minWidth: 72,
    color: colors.text.primary,
    borderColor: colors.border.default,
    '&:hover': {
        borderColor: colors.background.hover,
        bgcolor: colors.background.hover,
    },
} as const;

const sectionFooterSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2,
    mt: 1.5,
} as const;

const savedTextSx = {
    color: colors.fight.success,
    fontSize: fontSizes.sm,
} as const;

interface ProfileDetailsFormProps {
    profile: UserProfile;
    onSave: (details: ProfileDetailsInput) => Promise<void>;
}

function getContactsFromProfile(profile: UserProfile): Record<ContactLinkKey, string> {
    return {
        rsn: getContactFormValue('rsn', profile.rsn),
        discord: getContactFormValue('discord', profile.discord),
        twitter: getContactFormValue('twitter', profile.twitter),
        youtube: getContactFormValue('youtube', profile.youtube),
        twitch: getContactFormValue('twitch', profile.twitch),
        kick: getContactFormValue('kick', profile.kick),
    };
}

const ProfileDetailsForm: React.FC<ProfileDetailsFormProps> = ({profile, onSave}) => {
    const [bio, setBio] = useState(profile.bio ?? '');
    const [contacts, setContacts] = useState<Record<ContactLinkKey, string>>(getContactsFromProfile(profile));
    const [savingBio, setSavingBio] = useState(false);
    const [savingContacts, setSavingContacts] = useState(false);
    const [bioError, setBioError] = useState<string | null>(null);
    const [bioSuccess, setBioSuccess] = useState(false);
    const [contactError, setContactError] = useState<string | null>(null);
    const [contactSuccess, setContactSuccess] = useState(false);

    useEffect(() => {
        setBio(profile.bio ?? '');
        setContacts(getContactsFromProfile(profile));
    }, [profile]);

    const bioDirty = bio !== (profile.bio ?? '');
    const contactsDirty = CONTACT_FIELDS.some(
        (field) => contacts[field.key] !== getContactFormValue(field.key, profile[field.key]),
    );

    const handleContactChange = (key: ContactLinkKey, value: string) => {
        setContacts((prev) => ({...prev, [key]: value}));
    };

    const handleCancelBio = () => {
        setBio(profile.bio ?? '');
        setBioError(null);
        setBioSuccess(false);
    };

    const handleCancelContacts = () => {
        setContacts(getContactsFromProfile(profile));
        setContactError(null);
        setContactSuccess(false);
    };

    const handleSaveBio = async () => {
        setSavingBio(true);
        setBioError(null);
        setBioSuccess(false);

        try {
            await onSave({bio: bio.trim() || null});
            setBioSuccess(true);
        } catch (err) {
            setBioError(err instanceof Error ? err.message : 'Failed to save bio');
        } finally {
            setSavingBio(false);
        }
    };

    const handleSaveContacts = async () => {
        setSavingContacts(true);
        setContactError(null);
        setContactSuccess(false);

        try {
            await onSave({
                rsn: normalizeContactValue('rsn', contacts.rsn),
                discord: normalizeContactValue('discord', contacts.discord),
                twitter: normalizeContactValue('twitter', contacts.twitter),
                youtube: normalizeContactValue('youtube', contacts.youtube),
                twitch: normalizeContactValue('twitch', contacts.twitch),
                kick: normalizeContactValue('kick', contacts.kick),
            });
            setContactSuccess(true);
        } catch (err) {
            setContactError(err instanceof Error ? err.message : 'Failed to save contact links');
        } finally {
            setSavingContacts(false);
        }
    };

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 4, width: '100%'}}>
            <Box sx={{width: '100%'}}>
                <Typography sx={sectionTitleSx}>Bio</Typography>
                <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    maxRows={8}
                    value={bio}
                    onChange={(event) => {
                        setBio(event.target.value.slice(0, BIO_MAX_LENGTH));
                        setBioSuccess(false);
                    }}
                    placeholder="Tell others a little about yourself..."
                    sx={fieldSx}
                />
                {bioError && <Alert severity="error" sx={{mt: 1.5}}>{bioError}</Alert>}
                <Box sx={sectionFooterSx}>
                    <Typography sx={{color: colors.text.muted, fontSize: fontSizes.sm}}>
                        {bio.length}/{BIO_MAX_LENGTH}
                    </Typography>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        {bioSuccess && <Typography sx={savedTextSx}>Saved</Typography>}
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleCancelBio}
                            disabled={!bioDirty || savingBio}
                            sx={cancelButtonSx}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => void handleSaveBio()}
                            disabled={savingBio || bio.length > BIO_MAX_LENGTH || !bioDirty}
                            sx={saveButtonSx}
                        >
                            {savingBio ? <CircularProgress size={18} color="inherit" /> : 'Save'}
                        </Button>
                    </Box>
                </Box>
            </Box>

            <Box sx={{width: '100%', maxWidth: 560}}>
                <Typography sx={sectionTitleSx}>Contact</Typography>
                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.5}}>
                    {CONTACT_FIELDS.map((field) => (
                        <TextField
                            key={field.key}
                            fullWidth
                            value={contacts[field.key]}
                            onChange={(event) => {
                                handleContactChange(field.key, event.target.value);
                                setContactSuccess(false);
                            }}
                            placeholder={field.placeholder}
                            aria-label={field.label}
                            sx={fieldSx}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        {field.imageSrc ? (
                                            <Box
                                                component="img"
                                                src={field.imageSrc}
                                                alt=""
                                                sx={{
                                                    width: 22,
                                                    height: 22,
                                                    flexShrink: 0,
                                                    borderRadius: '4px',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                        ) : (
                                            <Icon
                                                icon={field.icon!}
                                                style={{
                                                    width: 22,
                                                    height: 22,
                                                    flexShrink: 0,
                                                }}
                                            />
                                        )}
                                    </InputAdornment>
                                ),
                            }}
                        />
                    ))}
                </Box>
                {contactError && <Alert severity="error" sx={{mt: 1.5}}>{contactError}</Alert>}
                <Box sx={{...sectionFooterSx, justifyContent: 'flex-end'}}>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        {contactSuccess && <Typography sx={savedTextSx}>Saved</Typography>}
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleCancelContacts}
                            disabled={!contactsDirty || savingContacts}
                            sx={cancelButtonSx}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => void handleSaveContacts()}
                            disabled={savingContacts || !contactsDirty}
                            sx={saveButtonSx}
                        >
                            {savingContacts ? <CircularProgress size={18} color="inherit" /> : 'Save'}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default ProfileDetailsForm;
