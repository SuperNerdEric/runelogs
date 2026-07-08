import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { Fight } from "../../models/Fight";
import {
  isEncounterFightInProgress,
  resolveFightOutcomeColor,
} from "../../utils/fightDisplayStatus";
import { DeathEvent } from "../../utils/deathEvents";
import { formatHHmmss } from "../../utils/utils";
import {
  getSummaryDuration,
  hasSummaryDuration,
} from "../../utils/summaryDuration";
import DeathCounter from "./DeathCounter";
import EncounterDpsRankBadges from "../badges/EncounterDpsRankBadges";

interface SummaryHeaderProps {
  fight: Fight;
  receivingData?: boolean;
  deaths: DeathEvent[];
  getDeathLinkSearch?: (death: DeathEvent) => string;
  dpsRanks?: Record<string, number>;
  dpsPercentiles?: Record<string, number>;
  leaderboardName?: string | null;
  playerCount?: number;
  dpsLeaderboardKey?: string | null;
}

const SummaryHeader: React.FC<SummaryHeaderProps> = ({
  fight,
  receivingData = false,
  deaths,
  getDeathLinkSearch,
  dpsRanks = {},
  dpsPercentiles = {},
  leaderboardName = null,
  playerCount = 0,
  dpsLeaderboardKey = null,
}) => {
  const duration = useMemo(() => {
    if (fight.metaData.fightDurationTicks > 0) {
      return formatHHmmss(fight.metaData.fightDurationTicks * 600, false);
    }

    return getSummaryDuration(fight);
  }, [fight]);
  const inProgress = isEncounterFightInProgress(
    receivingData,
    fight.metaData.success,
  );
  const showDuration = hasSummaryDuration(fight);
  const durationColor = resolveFightOutcomeColor(
    fight.metaData.success,
    inProgress,
  );

  return (
    <Box className="summary-header">
      <Box className="summary-header__duration-block">
        {(showDuration || !inProgress) && (
          <Typography
            component="p"
            sx={{
              color: durationColor,
              fontWeight: 700,
              fontSize: { xs: "1.25rem", sm: "1.75rem" },
              m: 0,
            }}
          >
            {duration}
          </Typography>
        )}
        {inProgress && (
          <Typography
            component="p"
            variant="body2"
            sx={{
              color: durationColor,
              fontWeight: 600,
              mt: showDuration ? 0.5 : 0,
              mb: 0,
            }}
          >
            In Progress
          </Typography>
        )}
      </Box>
      <EncounterDpsRankBadges
        dpsRanks={dpsRanks}
        dpsPercentiles={dpsPercentiles}
        leaderboardName={leaderboardName}
        playerCount={playerCount}
        dpsLeaderboardKey={dpsLeaderboardKey}
        fightName={dpsLeaderboardKey ?? fight.name}
      />
      <DeathCounter deaths={deaths} getDeathLinkSearch={getDeathLinkSearch} />
    </Box>
  );
};

export default SummaryHeader;
