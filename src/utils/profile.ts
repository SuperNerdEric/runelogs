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

type ParsedContact = {
    href: string;
    display: string;
};

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

const TWITTER_HOSTS = new Set(['x.com', 'twitter.com']);
const TWITTER_HANDLE_RE = /^@?([A-Za-z0-9_]{1,15})$/;

const TWITCH_HOSTS = new Set(['twitch.tv', 'm.twitch.tv']);
const TWITCH_HOST_PATTERN = /^((www\.|m\.)?twitch\.tv)/i;
const TWITCH_USERNAME_RE = /^@?([a-zA-Z0-9_]{4,25})$/i;

const YOUTUBE_HOSTS = new Set(['youtube.com', 'youtu.be']);
const YOUTUBE_HOST_PATTERN = /^((www\.)?youtube\.com|youtu\.be)/i;
const YOUTUBE_HANDLE_RE = /^@?([A-Za-z0-9._-]{3,30})$/;

const KICK_HOSTS = new Set(['kick.com']);
const KICK_HOST_PATTERN = /^(www\.)?kick\.com/i;
const KICK_USERNAME_RE = /^@?([a-zA-Z0-9_]{1,25})$/i;

const DISCORD_HOSTS = new Set(['discord.gg', 'discord.com', 'discordapp.com']);
const DISCORD_HOST_PATTERN = /^(discord\.gg|((www\.)?discord(app)?\.com))/i;
const DISCORD_GG_PATTERN = /^discord\.gg\/([a-zA-Z0-9-]+)$/i;

function ensureHttpsUrl(value: string): URL {
    return new URL(value.includes('://') ? value : `https://${value}`);
}

function tryParsePlatformUrl(
    value: string,
    hosts: Set<string>,
    hostPattern: RegExp,
    parsePath: (url: URL) => ParsedContact | null,
): ParsedContact | null {
    if (!isExternalUrl(value) && !hostPattern.test(value)) {
        return null;
    }

    try {
        const url = ensureHttpsUrl(value);
        const host = url.hostname.replace(/^www\./i, '').toLowerCase();
        if (!hosts.has(host)) {
            return null;
        }
        return parsePath(url);
    } catch {
        return null;
    }
}

function twitterContact(handle: string): ParsedContact {
    return {
        href: `https://x.com/${handle}`,
        display: `@${handle}`,
    };
}

function parseTwitterContact(value: string): ParsedContact | null {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    const fromUrl = tryParsePlatformUrl(
        trimmed,
        TWITTER_HOSTS,
        /^((www\.)?(twitter|x)\.com)/i,
        (url) => {
            const segment = url.pathname.replace(/^\//, '').split('/')[0];
            if (segment && TWITTER_HANDLE_RE.test(segment.startsWith('@') ? segment : `@${segment}`)) {
                return twitterContact(segment.replace(/^@/, ''));
            }
            return null;
        },
    );
    if (fromUrl) {
        return fromUrl;
    }

    const match = trimmed.match(TWITTER_HANDLE_RE);
    return match ? twitterContact(match[1]) : null;
}

export function parseTwitterHandle(value: string): string | null {
    const parsed = parseTwitterContact(value);
    return parsed ? parsed.display.slice(1) : null;
}

function twitchContact(username: string): ParsedContact {
    const handle = username.replace(/^@/, '');
    return {
        href: `https://www.twitch.tv/${handle.toLowerCase()}`,
        display: handle,
    };
}

function parseTwitchContact(value: string): ParsedContact | null {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    const fromUrl = tryParsePlatformUrl(trimmed, TWITCH_HOSTS, TWITCH_HOST_PATTERN, (url) => {
        const segment = url.pathname.replace(/^\//, '').split('/')[0];
        if (segment && TWITCH_USERNAME_RE.test(segment)) {
            return twitchContact(segment.replace(/^@/, ''));
        }
        return null;
    });
    if (fromUrl) {
        return fromUrl;
    }

    const match = trimmed.match(TWITCH_USERNAME_RE);
    return match ? twitchContact(match[1]) : null;
}

function youtubeHandleContact(handle: string): ParsedContact {
    const normalized = handle.replace(/^@/, '');
    return {
        href: `https://www.youtube.com/@${normalized}`,
        display: normalized,
    };
}

function youtubePathContact(path: string): ParsedContact {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const parts = normalizedPath.split('/').filter(Boolean);
    const display = parts.length >= 2 ? parts[parts.length - 1] : parts[0] ?? normalizedPath;

    return {
        href: `https://www.youtube.com${normalizedPath}`,
        display,
    };
}

function parseYoutubeContact(value: string): ParsedContact | null {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    const fromUrl = tryParsePlatformUrl(trimmed, YOUTUBE_HOSTS, YOUTUBE_HOST_PATTERN, (url) => {
        const host = url.hostname.replace(/^www\./i, '').toLowerCase();
        if (host === 'youtu.be') {
            return null;
        }

        const parts = url.pathname.replace(/^\//, '').split('/').filter(Boolean);
        if (parts[0]?.startsWith('@')) {
            return youtubeHandleContact(parts[0].slice(1));
        }
        if (parts[0] === 'c' && parts[1]) {
            return youtubePathContact(`/c/${parts[1]}`);
        }
        if (parts[0] === 'channel' && parts[1]) {
            return youtubePathContact(`/channel/${parts[1]}`);
        }
        if (parts[0] === 'user' && parts[1]) {
            return youtubePathContact(`/user/${parts[1]}`);
        }
        return null;
    });
    if (fromUrl) {
        return fromUrl;
    }

    const match = trimmed.match(YOUTUBE_HANDLE_RE);
    return match ? youtubeHandleContact(match[1]) : null;
}

function kickContact(username: string): ParsedContact {
    const handle = username.replace(/^@/, '');
    return {
        href: `https://kick.com/${handle.toLowerCase()}`,
        display: handle,
    };
}

function parseKickContact(value: string): ParsedContact | null {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    const fromUrl = tryParsePlatformUrl(trimmed, KICK_HOSTS, KICK_HOST_PATTERN, (url) => {
        const segment = url.pathname.replace(/^\//, '').split('/')[0];
        if (segment && KICK_USERNAME_RE.test(segment)) {
            return kickContact(segment.replace(/^@/, ''));
        }
        return null;
    });
    if (fromUrl) {
        return fromUrl;
    }

    const match = trimmed.match(KICK_USERNAME_RE);
    return match ? kickContact(match[1]) : null;
}

function parseDiscordContact(value: string): ParsedContact | null {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    const inviteMatch = trimmed.match(DISCORD_GG_PATTERN);
    if (inviteMatch) {
        return {
            href: `https://discord.gg/${inviteMatch[1]}`,
            display: `discord.gg/${inviteMatch[1]}`,
        };
    }

    return tryParsePlatformUrl(trimmed, DISCORD_HOSTS, DISCORD_HOST_PATTERN, (url) => {
        const host = url.hostname.replace(/^www\./i, '').toLowerCase();
        if (host === 'discord.gg') {
            const code = url.pathname.replace(/^\//, '').split('/')[0];
            if (code) {
                return {
                    href: `https://discord.gg/${code}`,
                    display: `discord.gg/${code}`,
                };
            }
            return null;
        }

        const path = url.pathname.replace(/\/$/, '');
        if (!path || path === '/') {
            return null;
        }

        return {
            href: `https://${host}${path}`,
            display: `${host}${path}`,
        };
    });
}

function parseContact(key: ContactLinkKey, value: string): ParsedContact | null {
    switch (key) {
        case 'twitter':
            return parseTwitterContact(value);
        case 'twitch':
            return parseTwitchContact(value);
        case 'youtube':
            return parseYoutubeContact(value);
        case 'kick':
            return parseKickContact(value);
        case 'discord':
            return parseDiscordContact(value);
        default:
            return null;
    }
}

function getGenericUrlDisplay(value: string): string {
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

export function normalizeContactValue(key: ContactLinkKey, value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    if (key === 'rsn') {
        return trimmed;
    }

    const parsed = parseContact(key, trimmed);
    return parsed ? parsed.href : trimmed;
}

export function isContactLink(key: ContactLinkKey, value: string): boolean {
    if (!value.trim()) {
        return false;
    }
    if (key === 'rsn') {
        return true;
    }
    if (parseContact(key, value)) {
        return true;
    }
    return isExternalUrl(value);
}

export function getContactLinkHref(key: ContactLinkKey, value: string): string {
    if (key === 'rsn') {
        return `/player/${encodeURIComponent(value)}`;
    }

    const parsed = parseContact(key, value);
    if (parsed) {
        return parsed.href;
    }

    if (isExternalUrl(value)) {
        return value;
    }

    return '#';
}

export function getContactDisplayText(key: ContactLinkKey, value: string): string {
    if (key === 'rsn') {
        return value;
    }

    const parsed = parseContact(key, value);
    if (parsed) {
        return parsed.display;
    }

    if (!isExternalUrl(value)) {
        return value;
    }

    return getGenericUrlDisplay(value);
}

export function getContactFormValue(key: ContactLinkKey, value: string | null | undefined): string {
    if (!value) {
        return '';
    }

    return getContactDisplayText(key, value);
}
