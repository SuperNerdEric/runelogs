import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Box,
  Button,
  CircularProgress,
  Link,
  Pagination,
  Rating,
  Typography,
} from "@mui/material";
import IosShareIcon from "@mui/icons-material/IosShare";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";

import { colors } from "../../theme";
import {
  GearSetupListItem,
  GearSetupSort,
  GearSetupsResponse,
} from "../../models/GearSetup";
import {
  LEADERBOARD_CONTENT_OPTIONS,
  buildLeaderboardHref,
  getLeaderboardContentSpriteKey,
} from "../../utils/leaderboardContent";
import { getEncounterHref } from "../../utils/encounterTableRow";
import { ticksToTime } from "../../utils/utils";
import FilterSelect from "../filters/FilterSelect";
import FilterToolbar from "../filters/FilterToolbar";
import { filterFieldCompactSx } from "../filters/filterStyles";
import HiscoreSpriteIcon from "../HiscoreSpriteIcon";
import PercentileRankBadge from "../badges/PercentileRankBadge";
import GearSetupPanels from "./GearSetupPanels";
import GearSetupExportModal from "./GearSetupExportModal";

/** Font size shared by the rank badge digit and the time link. */
export const gearSetupRankTimeFontSize = { xs: "1rem", sm: "1.15rem" } as const;

const ALL_CONTENT = "all";
const ANY_PLAYER_COUNT = 0;
const PAGE_SIZE = 12;

const SORT_OPTIONS: Array<{ value: GearSetupSort; label: string }> = [
  { value: "fastest", label: "Fastest" },
  { value: "topRated", label: "Top rated" },
];

const paginationSx = {
  "& .MuiPaginationItem-root": { color: "white" },
  "& .MuiPaginationItem-root.Mui-selected": {
    backgroundColor: "white",
    color: "black",
    borderRadius: "4px",
  },
} as const;

// Content that never has meaningful auto gear setups (the player starts the
// (Corrupted) Gauntlet with nothing), so it is hidden from the filter here
// without affecting the shared options used by other pages.
const GEAR_SETUP_EXCLUDED_CONTENT = new Set<string>([
  "The Gauntlet",
  "Corrupted Gauntlet",
]);

const contentFilterOptions = [
  { value: ALL_CONTENT, label: "All Content", spriteKey: "overall" },
  ...LEADERBOARD_CONTENT_OPTIONS.filter(
    (option) => !GEAR_SETUP_EXCLUDED_CONTENT.has(option.value),
  ).map((option) => ({
    value: option.value,
    label: option.label,
    spriteKey: option.spriteKey,
  })),
];

function buildPlayerCountOptions(
  content: string,
): Array<{ value: number; label: string }> {
  const option = LEADERBOARD_CONTENT_OPTIONS.find((o) => o.value === content);
  const counts = option?.playerCounts ?? [];
  return [
    { value: ANY_PLAYER_COUNT, label: "Any" },
    ...counts.map((pc) => ({ value: pc, label: String(pc) })),
  ];
}

interface RankBadgeProps {
  rank: number | null;
  percentile: number | null;
  contentName: string;
  playerCount: number;
}

/** Time-leaderboard rank badge matching the /run summary, linking to the leaderboard. */
export const RankBadge: React.FC<RankBadgeProps> = ({
  rank,
  percentile,
  contentName,
  playerCount,
}) => {
  if (rank == null) {
    return (
      <Typography
        sx={{
          color: colors.text.primary,
          fontWeight: 700,
          fontSize: gearSetupRankTimeFontSize,
        }}
      >
        Unranked
      </Typography>
    );
  }
  return (
    <PercentileRankBadge
      rank={rank}
      category="time"
      label=""
      percentile={percentile ?? undefined}
      href={buildLeaderboardHref({
        mode: "time",
        leaderboard: contentName,
        playerCount,
        highlightRank: rank,
      })}
    />
  );
};

interface GearSetupCardProps {
  item: GearSetupListItem;
  onRate: (item: GearSetupListItem, halfStars: number | null) => void;
  canRate: boolean;
}

const GearSetupCard: React.FC<GearSetupCardProps> = ({
  item,
  onRate,
  canRate,
}) => {
  const [exportOpen, setExportOpen] = useState(false);
  const spriteKey = getLeaderboardContentSpriteKey(item.contentName);
  const contentLabel = item.contentName;
  const href = getEncounterHref(item.encounterId, {
    durationResultType: item.encounterType,
  });
  const gearSetup = {
    player: item.player,
    equipment: item.equipment,
    inventory: item.inventory,
    runePouch: item.runePouch,
    spellbook: item.spellbook ?? undefined,
  };

  return (
    <Box
      sx={{
        border: `1px solid ${colors.border.default}`,
        borderRadius: 2,
        bgcolor: colors.background.surfaceAlt,
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
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
          {spriteKey && <HiscoreSpriteIcon spriteKey={spriteKey} height={22} />}
          <Link
            component={RouterLink}
            to={`/gear-setups/${item.id}`}
            underline="hover"
            variant="h6"
            sx={{ color: colors.text.primary, fontWeight: 600 }}
          >
            {contentLabel}
          </Link>
          <Typography sx={{ color: colors.text.iconHover, fontSize: 14 }}>
            {item.playerCount === 1 ? "Solo" : `${item.playerCount} players`}
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
            to={href}
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
          value={canRate ? (item.viewerRating ?? 0) : (item.ratingAverage ?? 0)}
          precision={0.5}
          readOnly={!canRate}
          icon={<StarIcon fontSize="inherit" />}
          emptyIcon={
            <StarBorderIcon fontSize="inherit" sx={{ color: "#8f8f8f" }} />
          }
          onChange={(_event, value) => {
            if (!canRate) {
              return;
            }
            onRate(item, value == null ? null : Math.round(value * 2));
          }}
        />
        <Typography sx={{ color: colors.text.iconHover, fontSize: 13 }}>
          {item.ratingCount > 0
            ? `${(item.ratingAverage ?? 0).toFixed(1)} (${item.ratingCount})`
            : "No ratings yet"}
        </Typography>
        {!canRate && (
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

      <GearSetupPanels gearSetup={gearSetup} />

      <GearSetupExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        gearSetup={gearSetup}
        name={item.contentName}
      />
    </Box>
  );
};

const DEFAULT_SORT: GearSetupSort = "fastest";

function parseSort(value: string | null): GearSetupSort {
  return SORT_OPTIONS.some((option) => option.value === value)
    ? (value as GearSetupSort)
    : DEFAULT_SORT;
}

const GearSetupsList: React.FC = () => {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();

  const [searchParams, setSearchParams] = useSearchParams();

  const content = searchParams.get("content") ?? ALL_CONTENT;
  const playerCount =
    Number(searchParams.get("playerCount")) || ANY_PLAYER_COUNT;
  const sort = parseSort(searchParams.get("sort"));
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  // Filters/sort/page live in the URL (pushed to history, like the leaderboards
  // page) so views are shareable, survive reloads, and support back/forward.
  const updateParams = useCallback(
    (updates: Record<string, string | number | null>, resetPage = false) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(updates)) {
          if (value == null || value === "") {
            next.delete(key);
          } else {
            next.set(key, String(value));
          }
        }
        if (resetPage) {
          next.delete("page");
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const [items, setItems] = useState<GearSetupListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("sort", sort);
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));
      if (content !== ALL_CONTENT) {
        params.set("content", content);
      }
      if (playerCount !== ANY_PLAYER_COUNT) {
        params.set("playerCount", String(playerCount));
      }

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
        `${import.meta.env.VITE_API_URL}/gear-setups?${params.toString()}`,
        { headers },
      );
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const data: GearSetupsResponse = await res.json();
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    content,
    playerCount,
    sort,
    page,
    isAuthenticated,
    getAccessTokenSilently,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRate = useCallback(
    async (item: GearSetupListItem, halfStars: number | null) => {
      const previous = items;
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
        setItems((current) =>
          current.map((row) =>
            row.id === item.id
              ? {
                  ...row,
                  ratingAverage: result.ratingAverage,
                  ratingCount: result.ratingCount,
                  viewerRating: result.viewerRating,
                }
              : row,
          ),
        );
      } catch {
        setItems(previous);
      }
    },
    [items, getAccessTokenSilently],
  );

  const playerCountOptions = useMemo(
    () => buildPlayerCountOptions(content),
    [content],
  );

  const showPlayerCountFilter =
    content !== ALL_CONTENT && playerCountOptions.length > 2;

  return (
    <Box>
      <FilterToolbar
        leadingFilters={
          <>
            <FilterSelect
              field="content"
              value={content}
              options={contentFilterOptions}
              sx={{ minWidth: { xs: 120, sm: 180 } }}
              onChange={(next) => {
                updateParams(
                  {
                    content: next === ALL_CONTENT ? null : next,
                    playerCount: null,
                  },
                  true,
                );
              }}
            />
            {showPlayerCountFilter && (
              <FilterSelect
                field="team"
                value={playerCount}
                compact
                sx={filterFieldCompactSx}
                options={playerCountOptions}
                onChange={(count) => {
                  updateParams(
                    {
                      playerCount: count === ANY_PLAYER_COUNT ? null : count,
                    },
                    true,
                  );
                }}
              />
            )}
            <FilterSelect
              value={sort}
              options={SORT_OPTIONS}
              sx={{ minWidth: { xs: 110, sm: 130 } }}
              onChange={(next) => {
                updateParams(
                  { sort: next === DEFAULT_SORT ? null : next },
                  true,
                );
              }}
            />
          </>
        }
      />

      {loading && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress color="inherit" />
        </Box>
      )}

      {!loading && error && (
        <Box display="flex" justifyContent="center" py={6}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {!loading && !error && items.length === 0 && (
        <Box display="flex" justifyContent="center" py={6}>
          <Typography color="white">No gear setups yet.</Typography>
        </Box>
      )}

      {!loading && !error && items.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {items.map((item) => (
            <GearSetupCard
              key={item.id}
              item={item}
              onRate={handleRate}
              canRate={isAuthenticated}
            />
          ))}
        </Box>
      )}

      {!loading && total > PAGE_SIZE && (
        <Box display="flex" justifyContent="center" pt={2} pb={1}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, value) =>
              updateParams({ page: value === 1 ? null : value })
            }
            sx={paginationSx}
          />
        </Box>
      )}
    </Box>
  );
};

export default GearSetupsList;
