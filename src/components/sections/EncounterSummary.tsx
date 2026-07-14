import React, { useCallback, useMemo } from "react";

import { Box } from "@mui/material";

import { useSearchParams } from "react-router-dom";

import { Fight } from "../../models/Fight";

import { ActorFilter } from "../../utils/actorFilter";

import { AttackAnimationEvent } from "../../utils/attackAnimationBreakdown";

import { getDeathEvents } from "../../utils/deathEvents";
import {
  getBloatDownEvents,
  BloatDownEvent,
} from "../../utils/bloatDownEvents";
import {
  buildAttackEventSearch,
  buildBloatDownEventSearch,
  buildDamageDoneSourceSearch,
  buildDeathEventSearch,
} from "../../utils/encounterSummaryLinks";
import Boosts from "../charts/Boosts";
import SummaryHeader from "../summary/SummaryHeader";
import AttackAnimationBreakdown from "../summary/AttackAnimationBreakdown";
import SummaryDamageDoneSection from "../summary/SummaryDamageDoneSection";
import { DeathEvent } from "../../utils/deathEvents";
import { layout } from "../../theme";

interface EncounterSummaryProps {
  fight: Fight;
  receivingData?: boolean;
  dpsPercentiles?: Record<string, number>;
  dpsRanks?: Record<string, number>;
  leaderboardName?: string | null;
  playerCount?: number;
  dpsLeaderboardKey?: string | null;
}

const EncounterSummary: React.FC<EncounterSummaryProps> = ({
  fight,
  receivingData = false,
  dpsPercentiles,
  dpsRanks = {},
  leaderboardName = null,
  playerCount = 0,
  dpsLeaderboardKey = null,
}) => {
  const [searchParams] = useSearchParams();

  const deaths = useMemo(() => getDeathEvents(fight), [fight]);
  const bloatDowns = useMemo(() => getBloatDownEvents(fight), [fight]);

  const getDeathLinkSearch = useCallback(
    (death: DeathEvent) => buildDeathEventSearch(searchParams, death),
    [searchParams],
  );

  const getBloatDownLinkSearch = useCallback(
    (down: BloatDownEvent) => buildBloatDownEventSearch(searchParams, down),
    [searchParams],
  );

  const getAttackEventLinkSearch = useCallback(
    (event: AttackAnimationEvent) =>
      buildAttackEventSearch(searchParams, event),
    [searchParams],
  );

  const getDamageDoneSourceLinkSearch = useCallback(
    (filter: ActorFilter) => buildDamageDoneSourceSearch(searchParams, filter),
    [searchParams],
  );

  return (
    <Box sx={{ maxWidth: layout.contentMaxWidth, width: "100%" }}>
      <SummaryHeader
        fight={fight}
        receivingData={receivingData}
        deaths={deaths}
        getDeathLinkSearch={getDeathLinkSearch}
        bloatDowns={bloatDowns}
        getBloatDownLinkSearch={getBloatDownLinkSearch}
        dpsRanks={dpsRanks}
        dpsPercentiles={dpsPercentiles}
        leaderboardName={leaderboardName}
        playerCount={playerCount}
        dpsLeaderboardKey={dpsLeaderboardKey}
      />
      <SummaryDamageDoneSection
        fight={fight}

        dpsPercentiles={dpsPercentiles}

        showPercentile={dpsLeaderboardKey != null}

        getSourceFilterLinkSearch={getDamageDoneSourceLinkSearch}
      />

      <AttackAnimationBreakdown
        fight={fight}

        getAttackEventLinkSearch={getAttackEventLinkSearch}
      />

      <Boosts fight={fight} />
    </Box>
  );
};

export default EncounterSummary;
