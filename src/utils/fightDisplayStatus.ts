import { colors } from '../theme';

export const FIGHT_IN_PROGRESS_COLOR = colors.text.link;

export function resolveFightOutcomeColor(
    success: boolean,
    inProgress = false,
): string {
    if (inProgress) {
        return FIGHT_IN_PROGRESS_COLOR;
    }
    return success ? colors.fight.success : colors.fight.failure;
}

export function isFightLiveInProgress(
    receivingData: boolean,
    fightId: string,
    liveActiveEncounterId?: string | null,
): boolean {
    return receivingData && liveActiveEncounterId === fightId;
}

export function isFightGroupLiveInProgress(
    receivingData: boolean,
    groupId: string,
    fightIds: string[],
    liveActiveEncounterId?: string | null,
): boolean {
    if (!receivingData || !liveActiveEncounterId) {
        return false;
    }
    if (liveActiveEncounterId === groupId) {
        return true;
    }
    return fightIds.includes(liveActiveEncounterId);
}
