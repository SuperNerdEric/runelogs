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
  FailureEvent,
  getEncounterFailureSeries,
} from "../../utils/failureEvents";
import {
  buildAttackEventSearch,
  buildBloatDownEventSearch,
  buildDamageDoneSourceSearch,
  buildDeathEventSearch,
  buildFailureEventSearch,
} from "../../utils/encounterSummaryLinks";
import Boosts from "../charts/Boosts";
import SummaryHeader from "../summary/SummaryHeader";
import AttackAnimationBreakdown from "../summary/AttackAnimationBreakdown";
import SummaryDamageDoneSection from "../summary/SummaryDamageDoneSection";
import GearSetupDisplay from "../gear/GearSetupDisplay";
import { DeathEvent } from "../../utils/deathEvents";
import { resolveGearSetups } from "../../utils/gearSetup/deriveGearSetup";
import { layout } from "../../theme";
import { stripFightGroupNumber } from "../../utils/leaderboardContent";

interface EncounterSummaryProps {
  fight: Fight;
  receivingData?: boolean;
  dpsPercentiles?: Record<string, number>;
  dpsRanks?: Record<string, number>;
  leaderboardName?: string | null;
  playerCount?: number;
  dpsLeaderboardKey?: string | null;
  /** Name of the run this fight belongs to, if any. */
  runName?: string | null;
}

const EncounterSummary: React.FC<EncounterSummaryProps> = ({
  fight,
  receivingData = false,
  dpsPercentiles,
  dpsRanks = {},
  leaderboardName = null,
  playerCount = 0,
  dpsLeaderboardKey = null,
  runName = null,
}) => {
  const [searchParams] = useSearchParams();

  const deaths = useMemo(() => getDeathEvents(fight), [fight]);
  const bloatDowns = useMemo(() => getBloatDownEvents(fight), [fight]);
  const failureSeries = useMemo(
    () => getEncounterFailureSeries(fight),
    [fight],
  );

  const getDeathLinkSearch = useCallback(
    (death: DeathEvent) => buildDeathEventSearch(searchParams, death),
    [searchParams],
  );

  const getBloatDownLinkSearch = useCallback(
    (down: BloatDownEvent) => buildBloatDownEventSearch(searchParams, down),
    [searchParams],
  );

  const getFailureEventLinkSearch = useCallback(
    (event: FailureEvent) => buildFailureEventSearch(searchParams, event),
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

  const gearSetups = useMemo(() => resolveGearSetups(fight), [fight]);

  const gearSetupName = runName
    ? `${stripFightGroupNumber(runName)} - ${fight.name}`
    : fight.name;

  return (
    <Box sx={{ maxWidth: layout.contentMaxWidth, width: "100%" }}>
      <SummaryHeader
        fight={fight}
        receivingData={receivingData}
        deaths={deaths}
        getDeathLinkSearch={getDeathLinkSearch}
        bloatDowns={bloatDowns}
        getBloatDownLinkSearch={getBloatDownLinkSearch}
        failureSeries={failureSeries}
        getFailureEventLinkSearch={getFailureEventLinkSearch}
        dpsRanks={dpsRanks}
        dpsPercentiles={dpsPercentiles}
        leaderboardName={leaderboardName}
        playerCount={playerCount}
        dpsLeaderboardKey={dpsLeaderboardKey}
      />
      {gearSetups.length > 0 && (
        <GearSetupDisplay gearSetups={gearSetups} name={gearSetupName} />
      )}

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
