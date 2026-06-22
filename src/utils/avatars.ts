import partyHatRed from '../assets/avatars/party-hat-red.png';
import partyHatYellow from '../assets/avatars/party-hat-yellow.png';
import partyHatBlue from '../assets/avatars/party-hat-blue.png';
import partyHatPurple from '../assets/avatars/party-hat-purple.png';
import partyHatGreen from '../assets/avatars/party-hat-green.png';
import partyHatWhite from '../assets/avatars/party-hat-white.png';
import partyHatBlack from '../assets/avatars/party-hat-black.png';
import partyHatRainbow from '../assets/avatars/party-hat-rainbow.png';
import santaHat from '../assets/avatars/santa-hat.png';
import runeScimitar from '../assets/avatars/rune-scimitar.png';
import dragonScimitar from '../assets/avatars/dragon-scimitar.png';
import fighterTorso from '../assets/avatars/fighter-torso.png';
import slayerHelmet from '../assets/avatars/slayer-helmet.png';
import toxicBlowpipe from '../assets/avatars/toxic-blowpipe.png';
import tridentOfTheSwamp from '../assets/avatars/trident-of-the-swamp.png';
import barrowsAhrimHood from '../assets/avatars/barrows-ahrim-hood.png';
import barrowsDharokHelm from '../assets/avatars/barrows-dharok-helm.png';
import barrowsGuthanHelm from '../assets/avatars/barrows-guthan-helm.png';
import barrowsKarilCoif from '../assets/avatars/barrows-karil-coif.png';
import barrowsToragHelm from '../assets/avatars/barrows-torag-helm.png';
import barrowsVeracHelm from '../assets/avatars/barrows-verac-helm.png';
import abyssalWhip from '../assets/avatars/abyssal-whip.png';
import bossVerzik from '../assets/avatars/boss-verzik.png';
import bossWardens from '../assets/avatars/boss-wardens.png';
import bossHunllef from '../assets/avatars/boss-hunllef.png';
import fireCape from '../assets/avatars/fire-cape.png';
import infernalCape from '../assets/avatars/infernal-cape.png';
import {ProfileDetails} from './profile';

export const CROWN_AVATAR_ID = 'crown' as const;

export const PARTY_HAT_AVATAR_IDS = [
    'party-hat-red',
    'party-hat-yellow',
    'party-hat-blue',
    'party-hat-purple',
    'party-hat-green',
    'party-hat-white',
    'party-hat-black',
    'party-hat-rainbow',
] as const;

export const BARROWS_HELM_AVATAR_IDS = [
    'barrows-ahrim-hood',
    'barrows-dharok-helm',
    'barrows-guthan-helm',
    'barrows-karil-coif',
    'barrows-torag-helm',
    'barrows-verac-helm',
] as const;

export const FREE_AVATAR_IDS = [
    ...PARTY_HAT_AVATAR_IDS,
    'santa-hat',
    'rune-scimitar',
    'dragon-scimitar',
    'fighter-torso',
    'slayer-helmet',
    'abyssal-whip',
    'toxic-blowpipe',
    'trident-of-the-swamp',
    ...BARROWS_HELM_AVATAR_IDS,
] as const;

export const LOCKED_AVATAR_IDS = [
    'boss-verzik',
    'boss-wardens',
    'boss-hunllef',
    'fire-cape',
    'infernal-cape',
    'crown',
] as const;

export const ALL_AVATAR_IDS = [...FREE_AVATAR_IDS, ...LOCKED_AVATAR_IDS] as const;

export type AvatarId = (typeof ALL_AVATAR_IDS)[number];

export const AVATAR_LABELS: Record<AvatarId, string> = {
    'party-hat-red': 'Red Partyhat',
    'party-hat-yellow': 'Yellow Partyhat',
    'party-hat-blue': 'Blue Partyhat',
    'party-hat-purple': 'Purple Partyhat',
    'party-hat-green': 'Green Partyhat',
    'party-hat-white': 'White Partyhat',
    'party-hat-black': 'Black Partyhat',
    'party-hat-rainbow': 'Rainbow Partyhat',
    'santa-hat': 'Santa Hat',
    'rune-scimitar': 'Rune Scimitar',
    'dragon-scimitar': 'Dragon Scimitar',
    'fighter-torso': 'Fighter Torso',
    'slayer-helmet': 'Slayer Helmet',
    'toxic-blowpipe': 'Toxic Blowpipe',
    'trident-of-the-swamp': 'Trident of the swamp',
    'barrows-ahrim-hood': "Ahrim's Hood",
    'barrows-dharok-helm': "Dharok's Helm",
    'barrows-guthan-helm': "Guthan's Helm",
    'barrows-karil-coif': "Karil's Coif",
    'barrows-torag-helm': "Torag's Helm",
    'barrows-verac-helm': "Verac's Helm",
    'abyssal-whip': 'Abyssal Whip',
    'boss-verzik': 'Verzik Vitur',
    'boss-wardens': 'The Wardens',
    'boss-hunllef': 'Corrupted Hunllef',
    'fire-cape': 'Fire Cape',
    'infernal-cape': 'Infernal Cape',
    crown: 'Crown',
};

export type AvatarImageId = Exclude<AvatarId, typeof CROWN_AVATAR_ID>;

export const AVATAR_IMAGES: Record<AvatarImageId, string> = {
    'party-hat-red': partyHatRed,
    'party-hat-yellow': partyHatYellow,
    'party-hat-blue': partyHatBlue,
    'party-hat-purple': partyHatPurple,
    'party-hat-green': partyHatGreen,
    'party-hat-white': partyHatWhite,
    'party-hat-black': partyHatBlack,
    'party-hat-rainbow': partyHatRainbow,
    'santa-hat': santaHat,
    'rune-scimitar': runeScimitar,
    'dragon-scimitar': dragonScimitar,
    'fighter-torso': fighterTorso,
    'slayer-helmet': slayerHelmet,
    'toxic-blowpipe': toxicBlowpipe,
    'trident-of-the-swamp': tridentOfTheSwamp,
    'barrows-ahrim-hood': barrowsAhrimHood,
    'barrows-dharok-helm': barrowsDharokHelm,
    'barrows-guthan-helm': barrowsGuthanHelm,
    'barrows-karil-coif': barrowsKarilCoif,
    'barrows-torag-helm': barrowsToragHelm,
    'barrows-verac-helm': barrowsVeracHelm,
    'abyssal-whip': abyssalWhip,
    'boss-verzik': bossVerzik,
    'boss-wardens': bossWardens,
    'boss-hunllef': bossHunllef,
    'fire-cape': fireCape,
    'infernal-cape': infernalCape,
};

export function isCrownAvatar(avatarId: AvatarId): avatarId is typeof CROWN_AVATAR_ID {
    return avatarId === CROWN_AVATAR_ID;
}

export function isAvatarId(value: string): value is AvatarId {
    return (ALL_AVATAR_IDS as readonly string[]).includes(value);
}

export function isLockedAvatar(avatarId: AvatarId): boolean {
    return (LOCKED_AVATAR_IDS as readonly string[]).includes(avatarId);
}

export interface AvatarUnlock {
    avatarId: AvatarId;
    unlockedAt: string;
}

export interface AvatarDefinition {
    id: AvatarId;
    locked: boolean;
    unlockHint?: string;
}

export const AVATAR_UNLOCK_HINTS: Record<(typeof LOCKED_AVATAR_IDS)[number], string> = {
    'boss-verzik': 'Complete the Theatre of Blood and upload the log.',
    'boss-wardens': 'Complete the Tombs of Amascut and upload the log.',
    'boss-hunllef': 'Complete the Corrupted Gauntlet and upload the log.',
    'fire-cape': 'Complete the Fight Caves and upload the log.',
    'infernal-cape': 'Complete The Inferno and upload the log.',
    crown: 'Achieve rank #1 on any leaderboard and upload the log.',
};

export function buildAvatarsList(unlocks: AvatarUnlock[]): AvatarDefinition[] {
    const unlockedIds = new Set(unlocks.map((unlock) => unlock.avatarId));

    return ALL_AVATAR_IDS.map((id) => {
        if (isLockedAvatar(id)) {
            const locked = !unlockedIds.has(id);
            return {
                id,
                locked,
                ...(locked ? {unlockHint: AVATAR_UNLOCK_HINTS[id]} : {}),
            };
        }

        return {id, locked: false};
    });
}

export interface UserProfile extends ProfileDetails {
    avatarId: AvatarId;
    unlocks: AvatarUnlock[];
}

export type PublicUserProfile = ProfileDetails & {
    avatarId: AvatarId;
};

export function formatUnlockDate(isoDate: string): string {
    const date = new Date(isoDate);
    const datePart = date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const timePart = date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
    return `${datePart}, ${timePart}`;
}
