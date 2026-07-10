import { useRef } from "react";
import { isLiveLogPending, type LiveLogState } from "./liveLogState";

export const LIVE_PAGE_RETRY_INTERVAL_MS = 5000;
export const LIVE_PAGE_RETRY_TIMEOUT_MS = 60_000;

/** Poll while a live session is open/finalizing or combat lines are still flowing. */
export function shouldPollLiveLogPage(
  liveLogState: LiveLogState | null | undefined,
  receivingData: boolean,
): boolean {
  return isLiveLogPending(liveLogState) || receivingData;
}

export function useLiveFetchRetryState(
  liveLogState: LiveLogState | null | undefined,
  receivingData: boolean,
  retryingAfterNotFound: boolean,
) {
  const liveLogStateRef = useRef(liveLogState);
  const receivingDataRef = useRef(receivingData);
  const retryingRef = useRef(retryingAfterNotFound);
  liveLogStateRef.current = liveLogState;
  receivingDataRef.current = receivingData;
  retryingRef.current = retryingAfterNotFound;
  return { liveLogStateRef, receivingDataRef, retryingRef };
}

/**
 * Whether to keep polling after a transient live-ingest response.
 *
 * Intermittent 404 during live logging is a backend bug. The frontend must not
 * retry 404s; the backend should return stable encounters or redirect (410) if
 * an encounter was removed after parsing.
 *
 * Only 409 (conflict while ingest is still settling) may be retried.
 */
export function shouldRetryTransientPageFetch(
  status: number,
  options: {
    showLoading: boolean;
    liveLogState: LiveLogState | null | undefined;
    receivingData: boolean;
    retryingAfterNotFound: boolean;
  },
): boolean {
  if (status !== 409) {
    return false;
  }

  return (
    options.showLoading ||
    isLiveLogPending(options.liveLogState) ||
    options.receivingData ||
    options.retryingAfterNotFound
  );
}
