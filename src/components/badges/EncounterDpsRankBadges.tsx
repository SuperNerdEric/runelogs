import React, { useMemo } from "react";
import PercentileRankBadge from "./PercentileRankBadge";
import RankBadgeCallout from "./RankBadgeCallout";
import { isUnknownPlayer } from "../../utils/actorUtils";
import { buildFightDpsRankLeaderboardHref } from "../../utils/leaderboardContent";

interface EncounterDpsRankBadgesProps {
  dpsRanks: Record<string, number>;
  dpsPercentiles: Record<string, number>;
  leaderboardName: string | null;
  playerCount: number;
  dpsLeaderboardKey: string | null;
  fightName: string;
}

const EncounterDpsRankBadges: React.FC<EncounterDpsRankBadgesProps> = ({
  dpsRanks,
  dpsPercentiles,
  leaderboardName,
  playerCount,
  dpsLeaderboardKey,
  fightName,
}) => {
  const badges = useMemo(
    () =>
      Object.entries(dpsRanks)
        .filter(([playerId]) => !isUnknownPlayer(playerId))
        .map(([playerId, rank]) => ({
          playerId,
          rank,
          percentile: dpsPercentiles[playerId],
          href: buildFightDpsRankLeaderboardHref(
            rank,
            leaderboardName,
            playerCount,
            dpsLeaderboardKey,
          ),
        }))
        .sort((a, b) => a.rank - b.rank),
    [dpsRanks, dpsPercentiles, leaderboardName, playerCount, dpsLeaderboardKey],
  );

  if (badges.length === 0) {
    return null;
  }

  return (
    <RankBadgeCallout sx={{ alignSelf: "center" }}>
      {badges.map((badge) => (
        <PercentileRankBadge
          key={badge.playerId}
          rank={badge.rank}
          category="dps"
          percentile={badge.percentile}
          label={badge.playerId}
          tooltipFightName={fightName}
          href={badge.href}
        />
      ))}
    </RankBadgeCallout>
  );
};

export default EncounterDpsRankBadges;
