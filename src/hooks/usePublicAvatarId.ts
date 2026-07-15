import { useEffect, useState } from "react";
import { AvatarId, isAvatarId } from "../utils/avatars";
import { usernameToPathSegment } from "../utils/utils";

export function usePublicAvatarId(userId: string | undefined): {
  avatarId: AvatarId | null;
  loading: boolean;
} {
  const [avatarId, setAvatarId] = useState<AvatarId | null>(null);
  const [loading, setLoading] = useState(Boolean(userId));

  useEffect(() => {
    if (!userId) {
      setAvatarId(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setAvatarId(null);
    setLoading(true);

    const load = async () => {
      try {
        const pathId = usernameToPathSegment(userId);
        const resp = await fetch(
          `${import.meta.env.VITE_API_URL}/profile/avatar/${encodeURIComponent(pathId)}`,
        );
        if (!resp.ok) {
          if (!cancelled) {
            setAvatarId(null);
          }
          return;
        }

        const data: { avatarId?: string } = await resp.json();
        const nextId = data.avatarId;
        if (!cancelled) {
          setAvatarId(nextId && isAvatarId(nextId) ? nextId : null);
        }
      } catch {
        if (!cancelled) {
          setAvatarId(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { avatarId, loading };
}
