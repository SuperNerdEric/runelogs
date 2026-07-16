import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useLocation } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { LOGIN_PAGE_META } from "../utils/encounterPageMeta";

type LoginLocationState = {
  from?: string;
};

const Login: React.FC = () => {
  const { loginWithRedirect, isLoading } = useAuth0();
  const location = useLocation();
  const returnTo = (location.state as LoginLocationState | null)?.from || "/";

  usePageMeta(LOGIN_PAGE_META);

  useEffect(() => {
    if (!isLoading) {
      loginWithRedirect({
        appState: { returnTo },
      });
    }
  }, [isLoading, loginWithRedirect, returnTo]);

  return null;
};

export default Login;
