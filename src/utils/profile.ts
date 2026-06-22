import osrsIcon from '../assets/osrs-icon.png';

export const BIO_MAX_LENGTH = 500;

export type ContactLinkKey = 'rsn' | 'discord' | 'twitter' | 'youtube' | 'twitch' | 'kick';

export interface ProfileDetails {
    bio: string | null;
    rsn: string | null;
    discord: string | null;
    twitter: string | null;
    youtube: string | null;
    twitch: string | null;
    kick: string | null;
}

export type ProfileDetailsInput = Partial<ProfileDetails>;

export const CONTACT_FIELDS: Array<{
    key: ContactLinkKey;
    label: string;
    icon?: string;
    imageSrc?: string;
    placeholder: string;
}> = [
    {
        key: 'rsn',
        label: 'RSN',
        imageSrc: osrsIcon,
        placeholder: 'RSN',
    },
    {
        key: 'discord',
        label: 'Discord',
        icon: 'logos:discord-icon',
        placeholder: 'Discord',
    },
    {
        key: 'twitter',
        label: 'Twitter',
        icon: 'ri:twitter-x-fill',
        placeholder: 'Twitter',
    },
    {
        key: 'youtube',
        label: 'YouTube',
        icon: 'logos:youtube-icon',
        placeholder: 'YouTube',
    },
    {
        key: 'twitch',
        label: 'Twitch',
        icon: 'logos:twitch',
        placeholder: 'Twitch',
    },
    {
        key: 'kick',
        label: 'Kick',
        icon: 'simple-icons:kick',
        placeholder: 'Kick',
    },
];

export function getContactHref(key: ContactLinkKey, value: string): string {
    if (key === 'rsn') {
        return `/player/${encodeURIComponent(value)}`;
    }
    return value;
}

export function buildProfileHref(profileId: string): string {
    return `/profile/${encodeURIComponent(profileId)}`;
}

export function isExternalUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
}

export function getContactLinkHref(key: ContactLinkKey, value: string): string {
    if (key === 'rsn') {
        return `/player/${encodeURIComponent(value)}`;
    }
    if (isExternalUrl(value)) {
        return value;
    }
    return '#';
}

export function getContactDisplayText(key: ContactLinkKey, value: string): string {
    if (key === 'rsn' || !isExternalUrl(value)) {
        return value;
    }

    try {
        const url = new URL(value);
        const path = url.pathname.replace(/\/$/, '');
        if (path.length > 1) {
            return `${url.hostname.replace(/^www\./, '')}${path}`;
        }
        return url.hostname.replace(/^www\./, '');
    } catch {
        return value;
    }
}
