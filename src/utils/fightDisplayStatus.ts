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

/** Run-level in-progress styling for a fight group on live log pages. */
export function isFightGroupRunInProgress(
    receivingData: boolean,
    groupSuccess: boolean,
): boolean {
    return receivingData && !groupSuccess;
}

export type LiveFightTileState = {
    id: string;
    success: boolean;
    order: number;
};

function findCurrentLiveFight(
    fights: LiveFightTileState[],
): LiveFightTileState | undefined {
    return fights
        .filter((entry) => !entry.success)
        .sort((a, b) => b.order - a.order)[0];
}

/** Marks the active boss blue during a live run when ids may not match yet. */
export function resolveLiveFightTileInProgress(
    receivingData: boolean,
    groupSuccess: boolean,
    fights: LiveFightTileState[],
    fight: LiveFightTileState,
    liveActiveEncounterId?: string | null,
): boolean {
    if (!receivingData || groupSuccess) {
        return false;
    }

    if (isFightLiveInProgress(receivingData, fight.id, liveActiveEncounterId)) {
        return true;
    }

    const currentFight = findCurrentLiveFight(fights);
    return currentFight?.id === fight.id;
}
