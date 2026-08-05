import React, { useCallback, useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Box,
  Button,
  CircularProgress,
  Link,
  Rating,
  Typography,
} from "@mui/material";
import IosShareIcon from "@mui/icons-material/IosShare";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { format } from "date-fns";

import { colors, contentColumnSx, media } from "../theme";
import { usePageMeta } from "../hooks/usePageMeta";
import { GearSetupListItem } from "../models/GearSetup";
import { getLeaderboardContentSpriteKey } from "../utils/leaderboardContent";
import { getEncounterHref } from "../utils/encounterTableRow";
import { ticksToTime } from "../utils/utils";
import HiscoreSpriteIcon from "./HiscoreSpriteIcon";
import PageBreadcrumbs from "./PageBreadcrumbs";
import GearSetupPanels from "./gear/GearSetupPanels";
import GearSetupExportModal from "./gear/GearSetupExportModal";
import { RankBadge, gearSetupRankTimeFontSize } from "./gear/GearSetupsList";

const GearSetupPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();

  const [item, setItem] = useState<GearSetupListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  usePageMeta({
    title: item
      ? `${item.contentName} gear setup - Runelogs`
      : "Gear Setup - Runelogs",
    description:
      "An OSRS gear setup with equipment, inventory, rune pouch, and spellbook, exportable to RuneLite Bank Tags or the Inventory Setups plugin.",
  });

  const fetchData = useCallback(async () => {
    if (!id) {
      return;
    }
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const headers: Record<string, string> = {};
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently();
          headers.Authorization = `Bearer ${token}`;
        } catch {
          // Fall through as an anonymous request.
        }
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/gear-setups/${id}`,
        { headers },
      );
      if (res.status === 404) {
        setNotFound(true);
        setItem(null);
        return;
      }
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      setItem((await res.json()) as GearSetupListItem);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated, getAccessTokenSilently]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRate = useCallback(
    async (halfStars: number | null) => {
      if (!item) {
        return;
      }
      const previous = item;
      try {
        const token = await getAccessTokenSilently();
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/gear-setups/${item.id}/rating`,
          {
            method: halfStars == null ? "DELETE" : "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: halfStars == null ? undefined : JSON.stringify({ halfStars }),
          },
        );
        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }
        const result: {
          ratingAverage: number | null;
          ratingCount: number;
          viewerRating: number | null;
        } = await res.json();
        setItem((current) =>
          current
            ? {
                ...current,
                ratingAverage: result.ratingAverage,
                ratingCount: result.ratingCount,
                viewerRating: result.viewerRating,
              }
            : current,
        );
      } catch {
        setItem(previous);
      }
    },
    [item, getAccessTokenSilently],
  );

  const spriteKey = item
    ? getLeaderboardContentSpriteKey(item.contentName)
    : "";

  return (
    <Box
      sx={{
        ...contentColumnSx,
        mt: 2,
        px: 2,
        pb: 4,
        [media.mobileDown]: { px: 1 },
      }}
    >
      <PageBreadcrumbs
        segments={[
          { label: "Gear Setups", href: "/gear-setups" },
          {
            label: item ? item.contentName : "Gear setup",
            spriteKey: item
              ? getLeaderboardContentSpriteKey(item.contentName)
              : undefined,
          },
        ]}
      />

      {loading && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress color="inherit" />
        </Box>
      )}

      {!loading && notFound && (
        <Box display="flex" justifyContent="center" py={6}>
          <Typography color="white">Gear setup not found.</Typography>
        </Box>
      )}

      {!loading && error && (
        <Box display="flex" justifyContent="center" py={6}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {!loading && !error && item && (
        <>
          <Box className="log-info-box" sx={{ mt: 2 }}>
            <Typography className="log-info-label">Log</Typography>
            <Link
              component={RouterLink}
              to={`/log/${item.logId}`}
              variant="body1"
              underline="hover"
              className="log-info-value log-info-id"
              sx={{ color: colors.text.link }}
            >
              {item.logId}
            </Link>

            <Typography className="log-info-label">
              {item.encounterType === "fightGroup" ? "Run" : "Encounter"}
            </Typography>
            <Link
              component={RouterLink}
              to={getEncounterHref(item.encounterId, {
                durationResultType: item.encounterType as
                  "fight" | "fightGroup",
              })}
              variant="body1"
              underline="hover"
              className="log-info-value log-info-id"
              sx={{ color: colors.text.link }}
            >
              {item.encounterId}
            </Link>

            <Typography className="log-info-label">Uploaded</Typography>
            <Typography className="log-info-value">
              {item.uploadedAt
                ? format(new Date(item.uploadedAt), "PPpp")
                : "Unknown"}
            </Typography>
          </Box>

          <Box
            sx={{
              border: `1px solid ${colors.border.default}`,
              borderRadius: 2,
              bgcolor: colors.background.surfaceAlt,
              p: { xs: 2, sm: 3 },
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {spriteKey && (
                  <HiscoreSpriteIcon spriteKey={spriteKey} height={26} />
                )}
                <Typography
                  variant="h5"
                  sx={{ color: colors.text.primary, fontWeight: 600 }}
                >
                  {item.contentName}
                </Typography>
                <Typography sx={{ color: colors.text.iconHover, fontSize: 15 }}>
                  {item.playerCount === 1
                    ? "Solo"
                    : `${item.playerCount} players`}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <RankBadge
                  rank={item.rank}
                  percentile={item.percentile}
                  contentName={item.contentName}
                  playerCount={item.playerCount}
                />
                <Link
                  component={RouterLink}
                  to={getEncounterHref(item.encounterId, {
                    durationResultType: item.encounterType as
                      "fight" | "fightGroup",
                  })}
                  underline="hover"
                  sx={{
                    color: colors.upload.dragActive,
                    fontWeight: 700,
                    fontSize: gearSetupRankTimeFontSize,
                  }}
                >
                  {ticksToTime(item.durationTicks)}
                </Link>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                flexWrap: "wrap",
              }}
            >
              <Rating
                value={
                  isAuthenticated
                    ? (item.viewerRating ?? 0)
                    : (item.ratingAverage ?? 0)
                }
                precision={0.5}
                readOnly={!isAuthenticated}
                icon={<StarIcon fontSize="inherit" />}
                emptyIcon={
                  <StarBorderIcon
                    fontSize="inherit"
                    sx={{ color: "#8f8f8f" }}
                  />
                }
                onChange={(_event, value) => {
                  if (!isAuthenticated) {
                    return;
                  }
                  handleRate(value == null ? null : Math.round(value * 2));
                }}
              />
              <Typography sx={{ color: colors.text.iconHover, fontSize: 13 }}>
                {item.ratingCount > 0
                  ? `${(item.ratingAverage ?? 0).toFixed(1)} (${item.ratingCount})`
                  : "No ratings yet"}
              </Typography>
              {!isAuthenticated && (
                <Typography sx={{ color: colors.text.iconHover, fontSize: 12 }}>
                  Log in to rate
                </Typography>
              )}
            </Box>

            <Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<IosShareIcon />}
                onClick={() => setExportOpen(true)}
              >
                Export
              </Button>
            </Box>

            <GearSetupPanels
              gearSetup={{
                player: item.player,
                equipment: item.equipment,
                inventory: item.inventory,
                runePouch: item.runePouch,
                spellbook: item.spellbook ?? undefined,
              }}
            />

            <GearSetupExportModal
              open={exportOpen}
              onClose={() => setExportOpen(false)}
              gearSetup={{
                player: item.player,
                equipment: item.equipment,
                inventory: item.inventory,
                runePouch: item.runePouch,
                spellbook: item.spellbook ?? undefined,
              }}
              name={item.contentName}
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default GearSetupPage;
