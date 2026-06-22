import {describe, expect, it} from 'vitest';
import {
    getContactDisplayText,
    getContactLinkHref,
    isContactLink,
    normalizeContactValue,
    parseTwitterHandle,
} from '../utils/profile';

describe('parseTwitterHandle', () => {
    it('parses a bare handle', () => {
        expect(parseTwitterHandle('PiesMillion')).toBe('PiesMillion');
    });

    it('parses an at-prefixed handle', () => {
        expect(parseTwitterHandle('@PiesMillion')).toBe('PiesMillion');
    });

    it('parses x.com profile URLs', () => {
        expect(parseTwitterHandle('https://x.com/PiesMillion')).toBe('PiesMillion');
    });

    it('returns null for invalid values', () => {
        expect(parseTwitterHandle('not a handle')).toBeNull();
    });
});

describe('twitter contact helpers', () => {
    it('displays @handle for bare and at-prefixed input', () => {
        expect(getContactDisplayText('twitter', 'PiesMillion')).toBe('@PiesMillion');
        expect(getContactDisplayText('twitter', '@PiesMillion')).toBe('@PiesMillion');
        expect(getContactDisplayText('twitter', 'https://x.com/PiesMillion')).toBe('@PiesMillion');
    });

    it('links bare and at-prefixed handles to x.com', () => {
        expect(getContactLinkHref('twitter', 'PiesMillion')).toBe('https://x.com/PiesMillion');
        expect(getContactLinkHref('twitter', '@PiesMillion')).toBe('https://x.com/PiesMillion');
    });

    it('normalizes twitter input to an x.com URL on save', () => {
        expect(normalizeContactValue('twitter', '@PiesMillion')).toBe('https://x.com/PiesMillion');
        expect(normalizeContactValue('twitter', 'PiesMillion')).toBe('https://x.com/PiesMillion');
    });
});

describe('twitch contact helpers', () => {
    it('displays username for bare and at-prefixed input', () => {
        expect(getContactDisplayText('twitch', 'honorable_mention')).toBe('honorable_mention');
        expect(getContactDisplayText('twitch', '@honorable_mention')).toBe('honorable_mention');
        expect(getContactDisplayText('twitch', 'https://www.twitch.tv/honorable_mention')).toBe('honorable_mention');
    });

    it('links bare and at-prefixed usernames to twitch', () => {
        expect(getContactLinkHref('twitch', 'honorable_mention')).toBe('https://www.twitch.tv/honorable_mention');
        expect(getContactLinkHref('twitch', '@honorable_mention')).toBe('https://www.twitch.tv/honorable_mention');
    });

    it('normalizes twitch input on save', () => {
        expect(normalizeContactValue('twitch', 'honorable_mention')).toBe('https://www.twitch.tv/honorable_mention');
    });
});

describe('youtube contact helpers', () => {
    it('displays handle for bare and at-prefixed input', () => {
        expect(getContactDisplayText('youtube', 'MyChannel')).toBe('MyChannel');
        expect(getContactDisplayText('youtube', '@MyChannel')).toBe('MyChannel');
        expect(getContactDisplayText('youtube', 'https://www.youtube.com/@MyChannel')).toBe('MyChannel');
    });

    it('links bare handles to youtube @ URLs', () => {
        expect(getContactLinkHref('youtube', 'MyChannel')).toBe('https://www.youtube.com/@MyChannel');
    });

    it('supports legacy youtube paths', () => {
        expect(getContactDisplayText('youtube', 'https://www.youtube.com/c/MyChannel')).toBe('MyChannel');
        expect(getContactLinkHref('youtube', 'https://www.youtube.com/c/MyChannel')).toBe('https://www.youtube.com/c/MyChannel');
    });

    it('normalizes youtube handles on save', () => {
        expect(normalizeContactValue('youtube', '@MyChannel')).toBe('https://www.youtube.com/@MyChannel');
    });
});

describe('kick contact helpers', () => {
    it('displays username for bare and at-prefixed input', () => {
        expect(getContactDisplayText('kick', 'streamer')).toBe('streamer');
        expect(getContactDisplayText('kick', '@streamer')).toBe('streamer');
        expect(getContactDisplayText('kick', 'https://kick.com/streamer')).toBe('streamer');
    });

    it('links bare usernames to kick', () => {
        expect(getContactLinkHref('kick', 'streamer')).toBe('https://kick.com/streamer');
    });

    it('normalizes kick input on save', () => {
        expect(normalizeContactValue('kick', '@streamer')).toBe('https://kick.com/streamer');
    });
});

describe('discord contact helpers', () => {
    it('displays invite links in short form', () => {
        expect(getContactDisplayText('discord', 'discord.gg/abc123')).toBe('discord.gg/abc123');
        expect(getContactDisplayText('discord', 'https://discord.gg/abc123')).toBe('discord.gg/abc123');
    });

    it('links invite codes to discord.gg', () => {
        expect(getContactLinkHref('discord', 'discord.gg/abc123')).toBe('https://discord.gg/abc123');
        expect(getContactLinkHref('discord', 'https://discord.gg/abc123')).toBe('https://discord.gg/abc123');
    });

    it('supports discord.com invite and user URLs', () => {
        expect(getContactDisplayText('discord', 'https://discord.com/users/123456789')).toBe('discord.com/users/123456789');
        expect(getContactLinkHref('discord', 'https://discord.com/users/123456789')).toBe('https://discord.com/users/123456789');
    });

    it('does not treat plain usernames as links', () => {
        expect(isContactLink('discord', 'myuser#1234')).toBe(false);
        expect(getContactDisplayText('discord', 'myuser#1234')).toBe('myuser#1234');
    });

    it('normalizes discord invites on save', () => {
        expect(normalizeContactValue('discord', 'discord.gg/abc123')).toBe('https://discord.gg/abc123');
    });
});

describe('isContactLink', () => {
    it('treats parsed platform handles as links', () => {
        expect(isContactLink('twitter', 'PiesMillion')).toBe(true);
        expect(isContactLink('twitch', 'honorable_mention')).toBe(true);
        expect(isContactLink('youtube', 'MyChannel')).toBe(true);
        expect(isContactLink('kick', 'streamer')).toBe(true);
        expect(isContactLink('discord', 'discord.gg/abc123')).toBe(true);
    });

    it('treats invalid handles as non-links', () => {
        expect(isContactLink('twitter', 'not a handle')).toBe(false);
        expect(isContactLink('twitch', 'abc')).toBe(false);
        expect(isContactLink('discord', 'myuser#1234')).toBe(false);
    });
});
