import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageview } from '../Analytics';

export default function usePageTracking() {
    const location = useLocation();

    useEffect(() => {
        trackPageview(location.pathname + location.search);
    }, [location]);
}
