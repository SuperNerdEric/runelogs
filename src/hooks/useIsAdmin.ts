import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { tokenHasAdminPermission } from "../utils/authToken";

export function useIsAdmin(): {
  isAdmin: boolean;
  isLoading: boolean;
} {
  const {
    isAuthenticated,
    isLoading: authLoading,
    getAccessTokenSilently,
  } = useAuth0();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      setIsAdmin(false);
      setIsChecking(false);
      return;
    }

    let cancelled = false;
    setIsChecking(true);

    getAccessTokenSilently()
      .then((token) => {
        if (!cancelled) {
          setIsAdmin(tokenHasAdminPermission(token));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsAdmin(false);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsChecking(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, getAccessTokenSilently, isAuthenticated]);

  return {
    isAdmin,
    isLoading: authLoading || isChecking,
  };
}
