import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const Login: React.FC = () => {
    const { loginWithRedirect, isLoading } = useAuth0();

    useEffect(() => {
        if (!isLoading) {
            loginWithRedirect();
        }
    }, [isLoading, loginWithRedirect]);

    return null;
};

export default Login;
