import React from "react";
import { Box, Typography } from "@mui/material";
import { CoxExtraInfo } from "../utils/fightGroupExtraInfo";
import {
  formatCoxPoints,
  formatCoxRaidScale,
  hasCoxRaidData,
} from "../utils/coxExtraInfo";

interface CoxRaidInfoProps {
  cox: CoxExtraInfo | null | undefined;
}

const CoxRaidInfo: React.FC<CoxRaidInfoProps> = ({ cox }) => {
  if (!hasCoxRaidData(cox)) {
    return null;
  }

  const playerLabel = cox.playerName?.trim() || "Player points";

  return (
    <Box className="cox-raid-info">
      <Box className="cox-raid-info__stat">
        <Typography component="p" className="cox-raid-info__label">
          Raid scale
        </Typography>
        <Typography component="p" className="cox-raid-info__value">
          {formatCoxRaidScale(cox.partySize)}
        </Typography>
      </Box>
      <Box className="cox-raid-info__stat">
        <Typography component="p" className="cox-raid-info__label">
          Party points
        </Typography>
        <Typography component="p" className="cox-raid-info__value">
          {formatCoxPoints(cox.teamPoints)}
        </Typography>
      </Box>
      <Box className="cox-raid-info__stat">
        <Typography component="p" className="cox-raid-info__label">
          {playerLabel}
        </Typography>
        <Typography component="p" className="cox-raid-info__value">
          {formatCoxPoints(cox.playerPoints)}
        </Typography>
      </Box>
    </Box>
  );
};

export default CoxRaidInfo;
