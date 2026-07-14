import { useEffect, useState } from "react";
import { AvatarId, isAvatarId } from "../utils/avatars";

export function usePublicAvatarId(userId: string | undefined): AvatarId | null {
  const [avatarId, setAvatarId] = useState<AvatarId | null>(null);

  useEffect(() => {
    if (!userId) {
      setAvatarId(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const resp = await fetch(
          `${import.meta.env.VITE_API_URL}/profile/avatar/${encodeURIComponent(userId)}`,
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
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return avatarId;
}
