import React, {useEffect, useState} from 'react';
import {Icon} from '@iconify/react';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Spinner} from '@/components/ui/spinner';
import {UserProfile} from '../utils/avatars';
import {
    BIO_MAX_LENGTH,
    CONTACT_FIELDS,
    ContactLinkKey,
    getContactFormValue,
    normalizeContactValue,
    ProfileDetailsInput,
} from '../utils/profile';
import {cn} from '@/lib/utils';

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
        <div className="profile-details-form">
            <div className="w-full">
                <h2 className="profile-section-title">Bio</h2>
                <textarea
                    className="profile-bio-textarea"
                    rows={4}
                    value={bio}
                    onChange={(event) => {
                        setBio(event.target.value.slice(0, BIO_MAX_LENGTH));
                        setBioSuccess(false);
                    }}
                    placeholder="Tell others a little about yourself..."
                />
                {bioError && (
                    <Alert variant="destructive" className="mt-3">
                        <AlertDescription>{bioError}</AlertDescription>
                    </Alert>
                )}
                <div className="profile-section-footer">
                    <span className="text-muted text-sm">
                        {bio.length}/{BIO_MAX_LENGTH}
                    </span>
                    <div className="flex items-center gap-2">
                        {bioSuccess && <span className="profile-saved-text">Saved</span>}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelBio}
                            disabled={!bioDirty || savingBio}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            className="profile-save-btn"
                            onClick={() => void handleSaveBio()}
                            disabled={savingBio || bio.length > BIO_MAX_LENGTH || !bioDirty}
                        >
                            {savingBio ? <Spinner className="size-[18px] text-white"/> : 'Save'}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-[560px]">
                <h2 className="profile-section-title">Contact</h2>
                <div className="flex flex-col gap-3">
                    {CONTACT_FIELDS.map((field) => (
                        <div key={field.key} className="profile-contact-input-wrap">
                            <span className="profile-contact-icon">
                                {field.imageSrc ? (
                                    <img
                                        src={field.imageSrc}
                                        alt=""
                                        className="size-[22px] shrink-0 rounded object-cover"
                                    />
                                ) : (
                                    <Icon icon={field.icon!} style={{width: 22, height: 22, flexShrink: 0}}/>
                                )}
                            </span>
                            <Input
                                value={contacts[field.key]}
                                onChange={(event) => {
                                    handleContactChange(field.key, event.target.value);
                                    setContactSuccess(false);
                                }}
                                placeholder={field.placeholder}
                                aria-label={field.label}
                                className="border-0 shadow-none focus-visible:ring-0"
                            />
                        </div>
                    ))}
                </div>
                {contactError && (
                    <Alert variant="destructive" className="mt-3">
                        <AlertDescription>{contactError}</AlertDescription>
                    </Alert>
                )}
                <div className={cn('profile-section-footer', 'profile-section-footer--end')}>
                    <div className="flex items-center gap-2">
                        {contactSuccess && <span className="profile-saved-text">Saved</span>}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelContacts}
                            disabled={!contactsDirty || savingContacts}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            className="profile-save-btn"
                            onClick={() => void handleSaveContacts()}
                            disabled={savingContacts || !contactsDirty}
                        >
                            {savingContacts ? <Spinner className="size-[18px] text-white"/> : 'Save'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileDetailsForm;
