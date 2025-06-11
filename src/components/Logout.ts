import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const Logout: React.FC = () => {
    const { logout, isLoading } = useAuth0();

    useEffect(() => {
        if (!isLoading) {
            logout({
                logoutParams: {
                    returnTo: window.location.origin,
                },
            });
        }
    }, [isLoading, logout]);

    return null;
};

export default Logout;
