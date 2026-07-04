import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { usePageMeta } from "../hooks/usePageMeta";
import { LOGIN_PAGE_META } from "../utils/encounterPageMeta";

const Login: React.FC = () => {
  const { loginWithRedirect, isLoading } = useAuth0();

  usePageMeta(LOGIN_PAGE_META);

  useEffect(() => {
    if (!isLoading) {
      loginWithRedirect();
    }
  }, [isLoading, loginWithRedirect]);

  return null;
};

export default Login;
