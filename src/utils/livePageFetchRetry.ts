import { useRef } from "react";

export const LIVE_PAGE_RETRY_INTERVAL_MS = 5000;
export const LIVE_PAGE_RETRY_TIMEOUT_MS = 60_000;

/** Poll while a session is open or combat lines are still flowing. */
export function shouldPollLiveLogPage(
  isLive: boolean,
  receivingData: boolean,
): boolean {
  return isLive || receivingData;
}

export function useLiveFetchRetryState(
  isLive: boolean,
  receivingData: boolean,
  retryingAfterNotFound: boolean,
) {
  const isLiveRef = useRef(isLive);
  const receivingDataRef = useRef(receivingData);
  const retryingRef = useRef(retryingAfterNotFound);
  isLiveRef.current = isLive;
  receivingDataRef.current = receivingData;
  retryingRef.current = retryingAfterNotFound;
  return { isLiveRef, receivingDataRef, retryingRef };
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
    isLive: boolean;
    receivingData: boolean;
    retryingAfterNotFound: boolean;
  },
): boolean {
  if (status !== 409) {
    return false;
  }

  return (
    options.showLoading ||
    options.isLive ||
    options.receivingData ||
    options.retryingAfterNotFound
  );
}
