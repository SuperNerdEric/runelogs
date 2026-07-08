import { colors } from "../theme";

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
  groupId?: string,
  fightIds?: string[],
  liveActiveEncounterId?: string | null,
): boolean {
  if (!receivingData || groupSuccess) {
    return false;
  }
  if (!groupId || !fightIds || liveActiveEncounterId == null) {
    return false;
  }
  return isFightGroupLiveInProgress(
    receivingData,
    groupId,
    fightIds,
    liveActiveEncounterId,
  );
}

/** Encounter page: live log still syncing and this fight has not finished. */
export function isEncounterFightInProgress(
  receivingData: boolean,
  fightSuccess: boolean,
): boolean {
  return receivingData && !fightSuccess;
}

export type LiveFightTileState = {
  id: string;
  success: boolean;
  order: number;
};

export type LiveFightTileDisplayState = {
  inProgress: boolean;
  /** Success color on tiles; may differ from DB while parse sync lags behind ingest. */
  displaySuccess: boolean;
};

function findCurrentLiveFight(
  fights: LiveFightTileState[],
): LiveFightTileState | undefined {
  return fights
    .filter((entry) => !entry.success)
    .sort((a, b) => b.order - a.order)[0];
}

/** Prefer checkpoint-backed id, then highest-order unfinished row. */
export function findLiveRunActiveFight(
  fights: LiveFightTileState[],
  liveActiveFightId?: string | null,
): LiveFightTileState | undefined {
  if (liveActiveFightId) {
    const matched = fights.find((entry) => entry.id === liveActiveFightId);
    if (matched && !matched.success) {
      return matched;
    }
  }

  return findCurrentLiveFight(fights);
}

/**
 * Earlier bosses can stay success=false in DB while later rows exist during parse backlog.
 * Kept for tests/assertions; live tile color uses the broader rule below.
 */
export function isStaleLiveSyncedFight(
  receivingData: boolean,
  groupSuccess: boolean,
  fight: LiveFightTileState,
  activeFight: LiveFightTileState | undefined,
): boolean {
  if (!receivingData || groupSuccess || fight.success || !activeFight) {
    return false;
  }

  return fight.order < activeFight.order;
}

/**
 * During a live run, success=false on a fight row means "not finalized yet", not
 * "confirmed wipe". Checkpoint ids and DB rows can both lag ingest under backlog.
 * Only show failure red after the log stops receiving data.
 */
export function isLiveFightOutcomePending(
  receivingData: boolean,
  groupSuccess: boolean,
  fightSuccess: boolean,
): boolean {
  return receivingData && !groupSuccess && !fightSuccess;
}

export function resolveLiveFightDisplaySuccess(
  fight: LiveFightTileState,
  receivingData: boolean,
  groupSuccess: boolean,
): boolean {
  if (fight.success) {
    return true;
  }

  if (isLiveFightOutcomePending(receivingData, groupSuccess, fight.success)) {
    return true;
  }

  return fight.success;
}

/** Marks the active boss blue during a live run when ids may not match yet. */
export function resolveLiveFightTileInProgress(
  receivingData: boolean,
  groupSuccess: boolean,
  fights: LiveFightTileState[],
  fight: LiveFightTileState,
  liveActiveEncounterId?: string | null,
  liveActiveFightId?: string | null,
): boolean {
  return resolveLiveFightTileState(
    receivingData,
    groupSuccess,
    fights,
    fight,
    liveActiveEncounterId,
    liveActiveFightId,
  ).inProgress;
}

export function resolveLiveFightTileState(
  receivingData: boolean,
  groupSuccess: boolean,
  fights: LiveFightTileState[],
  fight: LiveFightTileState,
  liveActiveEncounterId?: string | null,
  liveActiveFightId?: string | null,
): LiveFightTileDisplayState {
  if (!receivingData || groupSuccess) {
    return { inProgress: false, displaySuccess: fight.success };
  }

  if (liveActiveFightId && fight.id === liveActiveFightId && !fight.success) {
    return { inProgress: true, displaySuccess: false };
  }

  if (isFightLiveInProgress(receivingData, fight.id, liveActiveEncounterId)) {
    return { inProgress: true, displaySuccess: false };
  }

  const activeFight = findLiveRunActiveFight(fights, liveActiveFightId);
  const inProgress = activeFight?.id === fight.id;
  const displaySuccess = resolveLiveFightDisplaySuccess(
    fight,
    receivingData,
    groupSuccess,
  );

  return { inProgress, displaySuccess };
}
