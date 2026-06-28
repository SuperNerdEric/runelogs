import {useEffect, useState} from 'react';

export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }
        return window.matchMedia(query).matches;
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);

        setMatches(mediaQuery.matches);
        mediaQuery.addEventListener('change', onChange);
        return () => mediaQuery.removeEventListener('change', onChange);
    }, [query]);

    return matches;
}

/** Matches legacy MUI `theme.breakpoints.down('sm')` (768px). */
export function useIsMobile(): boolean {
    return useMediaQuery('(max-width: 767px)');
}

/** Tablet portrait and up through laptop. */
export function useIsTabletUp(): boolean {
    return useMediaQuery('(min-width: 768px)');
}
