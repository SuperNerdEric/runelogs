import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const SessionGuard = () => {
    const { isAuthenticated, isLoading, getAccessTokenSilently, logout } = useAuth0();

    useEffect(() => {
        if (isLoading || !isAuthenticated) return;
        (async () => {
            try {
                await getAccessTokenSilently();
            } catch (e: any) {
                const msg = `${e?.error || ''} ${e?.message || ''} ${e?.error_description || ''}`.toLowerCase();
                if (
                    msg.includes('invalid_grant') ||
                    msg.includes('invalid_token') ||
                    msg.includes('invalid refresh token') ||
                    msg.includes('missing refresh token') ||
                    msg.includes('refresh token is expired')
                ) {
                    logout({ logoutParams: { returnTo: window.location.origin } });
                }
            }
        })();
    }, [isLoading, isAuthenticated, getAccessTokenSilently, logout]);

    return null;
};

export default SessionGuard;
