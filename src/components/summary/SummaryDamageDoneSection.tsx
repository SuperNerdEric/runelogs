import React, { useMemo } from "react";
import { Box } from "@mui/material";
import { Fight } from "../../models/Fight";
import { DamageLog, filterByType, LogTypes } from "../../models/LogLine";
import { BOAT_IDS } from "../../utils/constants";
import { ActorFilter } from "../../utils/actorFilter";
import DPSChart from "../charts/DPSChart";
import DPSMeterTable from "../charts/DPSMeterTable";
import SummarySection from "./SummarySection";

interface SummaryDamageDoneSectionProps {
  fight: Fight;
  dpsPercentiles?: Record<string, number>;
  onSelectSourceFilter?: (filter: ActorFilter) => void;
  onSelectTargetFilter?: (filter: ActorFilter) => void;
  getSourceFilterLinkSearch?: (filter: ActorFilter) => string;
}

const noop = () => undefined;

const SummaryDamageDoneSection: React.FC<SummaryDamageDoneSectionProps> = ({
  fight,
  dpsPercentiles,
  onSelectSourceFilter = noop,
  onSelectTargetFilter = noop,
  getSourceFilterLinkSearch,
}) => {
  const fightWithDamageDoneLogs = useMemo(() => {
    const filteredLogs = filterByType(fight.data, LogTypes.DAMAGE);
    return {
      ...fight,
      data: filteredLogs.filter((log) => {
        const damageLog = log as DamageLog;
        return (
          Boolean(damageLog.target.index) &&
          (!damageLog.target.id || !BOAT_IDS.includes(damageLog.target.id))
        );
      }),
    };
  }, [fight]);

  const drillDownLogs = useMemo(
    () => fightWithDamageDoneLogs.data as DamageLog[],
    [fightWithDamageDoneLogs.data],
  );

  const hasChart = fight.data.length > 1;
  const hasTable = fightWithDamageDoneLogs.data.length > 0;

  if (!hasChart && !hasTable) {
    return null;
  }

  return (
    <SummarySection title="Damage Done" className="summary-damage-done-section">
      <Box className="summary-damage-done-section__body">
        {hasChart && (
          <Box className="summary-damage-done-section__chart">
            <DPSChart fight={fightWithDamageDoneLogs} height={140} />
          </Box>
        )}
        {hasTable && (
          <Box className="summary-damage-done-section__table">
            <DPSMeterTable
              fight={fight}
              filteredFight={fightWithDamageDoneLogs}
              drillDownLogs={drillDownLogs}
              type="damage-done"
              sourceFilter={null}
              targetFilter={null}
              dpsPercentiles={dpsPercentiles}
              onSelectSourceFilter={onSelectSourceFilter}
              onSelectTargetFilter={onSelectTargetFilter}
              getSourceFilterLinkSearch={getSourceFilterLinkSearch}
            />
          </Box>
        )}
      </Box>
    </SummarySection>
  );
};

export default SummaryDamageDoneSection;
