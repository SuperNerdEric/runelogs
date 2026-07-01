import {useCallback, useRef, useState} from 'react';

const MIN_REFRESH_SPIN_MS = 500;

export function useLivePageRefreshPulse() {
    const [refreshing, setRefreshing] = useState(false);
    const activeRefreshesRef = useRef(0);

    const runBackgroundRefresh = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
        activeRefreshesRef.current += 1;
        setRefreshing(true);
        const startedAt = Date.now();

        try {
            return await fn();
        } finally {
            const elapsed = Date.now() - startedAt;
            const remaining = Math.max(0, MIN_REFRESH_SPIN_MS - elapsed);

            window.setTimeout(() => {
                activeRefreshesRef.current = Math.max(0, activeRefreshesRef.current - 1);
                if (activeRefreshesRef.current === 0) {
                    setRefreshing(false);
                }
            }, remaining);
        }
    }, []);

    return {refreshing, runBackgroundRefresh};
}
