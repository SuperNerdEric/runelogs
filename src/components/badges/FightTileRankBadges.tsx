import React from "react";
import { Box } from "@mui/material";
import PercentileRankBadge from "./PercentileRankBadge";

export interface FightTileRankBadge {
  playerId: string;
  rank: number;
  percentile?: number;
}

interface FightTileRankBadgesProps {
  badges: FightTileRankBadge[];
}

const FightTileRankBadges: React.FC<FightTileRankBadgesProps> = ({
  badges,
}) => {
  if (badges.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 0.5,
        mt: 0.5,
        justifyContent: "center",
      }}
    >
      {badges.map((badge) => (
        <PercentileRankBadge
          key={badge.playerId}
          rank={badge.rank}
          category="dps"
          percentile={badge.percentile}
          label={badge.playerId}
          compact
        />
      ))}
    </Box>
  );
};

export default FightTileRankBadges;
