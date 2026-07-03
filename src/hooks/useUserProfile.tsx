import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { AvatarId, isAvatarId, UserProfile } from "../utils/avatars";
import { ProfileDetailsInput } from "../utils/profile";

interface UserProfileContextValue {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  setAvatar: (avatarId: AvatarId) => Promise<void>;
  updateProfileDetails: (details: ProfileDetailsInput) => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export function UserProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    isAuthenticated,
    isLoading: authLoading,
    getAccessTokenSilently,
  } = useAuth0();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (authLoading || !isAuthenticated) {
      if (!isAuthenticated) {
        setProfile(null);
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getAccessTokenSilently();
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resp.ok) {
        throw new Error("Failed to load profile");
      }

      const data = await resp.json();
      if (!isAvatarId(data.avatarId)) {
        throw new Error("Invalid profile response");
      }

      setProfile(data as UserProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, getAccessTokenSilently]);

  const setAvatar = useCallback(
    async (avatarId: AvatarId) => {
      const token = await getAccessTokenSilently();
      const resp = await fetch(
        `${import.meta.env.VITE_API_URL}/profile/avatar`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ avatarId }),
        },
      );

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to update avatar");
      }

      const data = await resp.json();
      if (!isAvatarId(data.avatarId)) {
        throw new Error("Invalid profile response");
      }

      setProfile(data as UserProfile);
    },
    [getAccessTokenSilently],
  );

  const updateProfileDetails = useCallback(
    async (details: ProfileDetailsInput) => {
      const token = await getAccessTokenSilently();
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(details),
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to update profile");
      }

      const data = await resp.json();
      if (!isAvatarId(data.avatarId)) {
        throw new Error("Invalid profile response");
      }

      setProfile(data as UserProfile);
    },
    [getAccessTokenSilently],
  );

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  return (
    <UserProfileContext.Provider
      value={{
        profile,
        loading,
        error,
        fetchProfile,
        setAvatar,
        updateProfileDetails,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile(): UserProfileContextValue {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
}
