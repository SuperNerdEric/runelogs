import { useRef } from 'react';

export const LIVE_PAGE_RETRY_INTERVAL_MS = 5000;
export const LIVE_PAGE_RETRY_TIMEOUT_MS = 60_000;

export function useLiveFetchRetryState(
    receivingData: boolean,
    retryingAfterNotFound: boolean,
) {
    const receivingDataRef = useRef(receivingData);
    const retryingRef = useRef(retryingAfterNotFound);
    receivingDataRef.current = receivingData;
    retryingRef.current = retryingAfterNotFound;
    return { receivingDataRef, retryingRef };
}

export function shouldRetryTransientPageFetch(
    status: number,
    options: {
        showLoading: boolean;
        receivingData: boolean;
        retryingAfterNotFound: boolean;
    },
): boolean {
    if (status !== 404 && status !== 409) {
        return false;
    }

    return (
        options.showLoading ||
        options.receivingData ||
        options.retryingAfterNotFound
    );
}
