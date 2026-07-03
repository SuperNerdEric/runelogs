import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import AppTooltip from "../AppTooltip";
import { colors } from "../../theme";
import { getPercentileAccentColor } from "../../utils/percentile";
import { CrownIcon } from "../CrownIcon";
import MedalIcon from "../MedalIcon";
import RankBadgeCategoryIcon, {
  RankBadgeCategory,
} from "./RankBadgeCategoryIcon";

export interface PercentileRankBadgeProps {
  rank: number;
  label: string;
  category: RankBadgeCategory;
  percentile?: number;
  compact?: boolean;
  href?: string;
  tooltipFightName?: string;
}

const nonSelectableSx = {
  userSelect: "none",
  WebkitUserSelect: "none",
} as const;

const linkableSx = {
  cursor: "pointer",
  textDecoration: "none",
  color: "inherit",
  "&:hover": {
    filter: "brightness(1.1)",
  },
} as const;

function buildBadgeTooltip(
  category: RankBadgeCategory,
  rank: number,
  label: string,
  tooltipFightName?: string,
): string {
  if (category === "time") {
    return `Ranked #${rank} on the Time leaderboard`;
  }

  if (category === "high-score") {
    return `Ranked #${rank} on the Deep Delve leaderboard`;
  }

  if (label.includes("Overall")) {
    const playerName = label.replace(/\s*—\s*Overall$/, "").trim();
    return playerName
      ? `${playerName} — Ranked #${rank} on the overall DPS leaderboard`
      : `Ranked #${rank} on the overall DPS leaderboard`;
  }

  if (label && tooltipFightName) {
    return `${label} — Ranked #${rank} on the ${tooltipFightName} DPS leaderboard`;
  }

  return label
    ? `${label} — Ranked #${rank} on the DPS leaderboard`
    : `Ranked #${rank} on the DPS leaderboard`;
}

const PercentileRankBadge: React.FC<PercentileRankBadgeProps> = ({
  rank,
  label,
  category,
  percentile,
  compact = false,
  href,
  tooltipFightName,
}) => {
  const accentColor = getPercentileAccentColor(percentile);
  const showGlow = !compact && percentile !== undefined && percentile >= 99;
  const categoryIconSize = compact ? 16 : 24;
  const categoryLabel =
    category === "time"
      ? "Time"
      : category === "high-score"
        ? "Deep Delve"
        : "DPS";

  const inner = compact ? (
    <>
      <RankBadgeCategoryIcon category={category} size={categoryIconSize} />
      <Typography
        component="span"
        sx={{
          color: accentColor,
          fontWeight: 700,
          fontSize: "0.7rem",
          lineHeight: 1.2,
        }}
      >
        #{rank}
      </Typography>
      {label && (
        <Typography
          component="span"
          sx={{
            color: colors.text.primary,
            fontSize: "0.65rem",
            lineHeight: 1.2,
          }}
        >
          {label}
        </Typography>
      )}
    </>
  ) : (
    <>
      <RankBadgeCategoryIcon category={category} size={categoryIconSize} />
      <Typography
        component="span"
        sx={{
          color: accentColor,
          fontWeight: 700,
          fontSize: { xs: "1rem", sm: "1.15rem" },
        }}
      >
        #{rank}
      </Typography>
      {rank === 1 && <CrownIcon />}
      {rank === 2 && <MedalIcon color={colors.medal.silver} />}
      {rank === 3 && <MedalIcon color={colors.medal.bronze} />}
      {label && (
        <Typography
          component="span"
          sx={{
            color: colors.text.primary,
            fontSize: { xs: "0.8rem", sm: "0.9rem" },
          }}
        >
          {label}
        </Typography>
      )}
    </>
  );

  const sx = compact
    ? {
        ...nonSelectableSx,
        ...(href ? linkableSx : {}),
        display: "inline-flex",
        alignItems: "center",
        gap: 0.35,
        px: 0.6,
        py: 0.2,
        borderRadius: 0.5,
        border: `1px solid ${accentColor}`,
        background: `linear-gradient(135deg, rgba(22, 27, 34, 0.95) 0%, ${accentColor}22 100%)`,
        verticalAlign: "middle",
      }
    : {
        ...nonSelectableSx,
        ...(href ? linkableSx : {}),
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.5,
        py: 0.75,
        borderRadius: 1,
        border: `2px solid ${accentColor}`,
        background: `linear-gradient(135deg, rgba(22, 27, 34, 0.95) 0%, ${accentColor}22 100%)`,
        boxShadow: showGlow ? `0 0 12px ${accentColor}55` : undefined,
      };

  const ariaLabel = label
    ? `${categoryLabel} rank #${rank} — ${label}`
    : `${categoryLabel} rank #${rank}`;

  const badge = !href ? (
    <Box
      component="span"
      className="fight-group-rank-badge"
      aria-label={ariaLabel}
      sx={sx}
    >
      {inner}
    </Box>
  ) : (
    <Box
      component={RouterLink}
      to={href}
      className="fight-group-rank-badge"
      aria-label={ariaLabel}
      sx={sx}
    >
      {inner}
    </Box>
  );

  if (compact) {
    return badge;
  }

  return (
    <AppTooltip
      title={buildBadgeTooltip(category, rank, label, tooltipFightName)}
      arrow
      placement="top"
      disableTouch
    >
      <Box component="span" sx={{ display: "inline-flex" }}>
        {badge}
      </Box>
    </AppTooltip>
  );
};

export default PercentileRankBadge;
