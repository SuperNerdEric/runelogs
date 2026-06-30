import {
    getLeaderboardContentSpriteKey,
    inferLeaderboardFightGroupName,
    inferStandaloneLeaderboardContent,
    isLeaderboardContent,
} from '../utils/leaderboardContent';

const spriteModules = import.meta.glob<string>(
    '../assets/hiscoreSprites/*.png',
    {eager: true, import: 'default'},
);

export type HiscoreSpriteKey = string;

const HISCORE_SPRITE_URLS: Record<string, string> = {};

for (const [path, url] of Object.entries(spriteModules)) {
    const match = path.match(/\/([^/]+)\.png$/);
    if (match) {
        HISCORE_SPRITE_URLS[match[1]] = url;
    }
}

/** Boss / fight names that map to a hiscore boss icon (IconBoss25x25 in cache). */
const BOSS_NAME_SPRITE_KEYS: Record<string, HiscoreSpriteKey> = {
    'TzTok-Jad': 'tztok_jad',
    'TzKal-Zuk': 'tzkal_zuk',
    'Maggot King': 'maggot_king',
};

export function getHiscoreSpriteUrl(spriteKey: string | null | undefined): string | undefined {
    if (!spriteKey) {
        return undefined;
    }
    return HISCORE_SPRITE_URLS[spriteKey];
}

export function resolveContentSpriteKey(contentValue: string): HiscoreSpriteKey | undefined {
    return getLeaderboardContentSpriteKey(contentValue);
}

function resolveBossNameSpriteKey(name: string | null | undefined): HiscoreSpriteKey | undefined {
    if (!name) {
        return undefined;
    }
    return BOSS_NAME_SPRITE_KEYS[name];
}

export function resolveLeaderboardSpriteKey(
    leaderboardName: string | null | undefined,
): HiscoreSpriteKey | undefined {
    if (!leaderboardName) {
        return undefined;
    }
    return getLeaderboardContentSpriteKey(leaderboardName)
        ?? resolveBossNameSpriteKey(leaderboardName)
        ?? getLeaderboardContentSpriteKey(inferStandaloneLeaderboardContent(leaderboardName) ?? '');
}

export function resolveFightGroupSpriteKey(
    name: string,
    leaderboardName?: string | null,
): HiscoreSpriteKey | undefined {
    if (leaderboardName && isLeaderboardContent(leaderboardName)) {
        return resolveLeaderboardSpriteKey(leaderboardName);
    }
    const inferredGroup = inferLeaderboardFightGroupName(name);
    if (inferredGroup) {
        return resolveLeaderboardSpriteKey(inferredGroup);
    }
    const baseName = name.replace(/ - Incomplete$/, '').replace(/ - \d+$/, '');
    return resolveLeaderboardSpriteKey(inferStandaloneLeaderboardContent(baseName))
        ?? resolveBossNameSpriteKey(baseName)
        ?? resolveBossNameSpriteKey(name);
}

export function resolveFightSpriteKey(
    fightKey: string,
    contentValue: string,
): HiscoreSpriteKey | undefined {
    if (fightKey === 'Overall') {
        return 'overall';
    }
    return resolveBossNameSpriteKey(fightKey)
        ?? resolveContentSpriteKey(contentValue);
}

export function resolveEncounterRowSpriteKey(
    type: 'fight' | 'fightGroup',
    mainEnemyName: string | null | undefined,
    leaderboardName: string | null | undefined,
): HiscoreSpriteKey | undefined {
    if (type === 'fightGroup') {
        return resolveLeaderboardSpriteKey(leaderboardName);
    }
    return resolveBossNameSpriteKey(mainEnemyName)
        ?? resolveLeaderboardSpriteKey(
            inferStandaloneLeaderboardContent(mainEnemyName) ?? leaderboardName,
        );
}
