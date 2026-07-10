export type LiveLogState = "none" | "live" | "finalizing" | "complete";

export const LIVE_LOG_STATE = {
  none: "none",
  live: "live",
  finalizing: "finalizing",
  complete: "complete",
} as const satisfies Record<LiveLogState, LiveLogState>;

/** Client session is open (plugin may still send batches). */
export function isLiveLogSessionOpen(
  state: LiveLogState | null | undefined,
): boolean {
  return state === LIVE_LOG_STATE.live;
}

/** Session open or post-stop reconcile still running — keep polling / live UI. */
export function isLiveLogPending(
  state: LiveLogState | null | undefined,
): boolean {
  return state === LIVE_LOG_STATE.live || state === LIVE_LOG_STATE.finalizing;
}

/** Log was created via live ingest (not a classic file upload). */
export function wasEverLiveLogged(
  state: LiveLogState | null | undefined,
): boolean {
  return state != null && state !== LIVE_LOG_STATE.none;
}

export function parseLiveLogState(value: unknown): LiveLogState {
  if (
    value === LIVE_LOG_STATE.none ||
    value === LIVE_LOG_STATE.live ||
    value === LIVE_LOG_STATE.finalizing ||
    value === LIVE_LOG_STATE.complete
  ) {
    return value;
  }
  return LIVE_LOG_STATE.none;
}
