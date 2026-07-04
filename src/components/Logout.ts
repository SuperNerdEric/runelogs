import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { usePageMeta } from "../hooks/usePageMeta";
import { LOGOUT_PAGE_META } from "../utils/encounterPageMeta";

const Logout: React.FC = () => {
  const { logout, isLoading } = useAuth0();

  usePageMeta(LOGOUT_PAGE_META);

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
