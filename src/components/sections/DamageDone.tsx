import React, { useMemo } from "react";
import HitDistributionChart from "../charts/HitDistributionChart";
import Results from "../Results";
import DPSChart from "../charts/DPSChart";
import { Fight } from "../../models/Fight";
import EventsTable from "../EventsTable";
import DPSMeterTable from "../charts/DPSMeterTable";
import DamageDoneDrillBanner from "../charts/DamageDoneDrillBanner";
import SectionBox from "../SectionBox";
import { filterByType, LogTypes, DamageLog } from "../../models/LogLine";
import { BOAT_IDS } from "../../utils/constants";
import { ActorFilter, matchesActorFilter } from "../../utils/actorFilter";
import { matchesMonsterTargetFilter } from "../../utils/targetDrillDown";
import {
  buildEquipmentTimelines,
  EquipmentFilter,
  matchesEquipmentFilter,
} from "../../utils/equipmentFilter";
import {
  buildPrayerTimelines,
  matchesPrayerFilter,
  PrayerFilter,
} from "../../utils/prayerFilter";
import {
  HitsplatFilter,
  matchesHitsplatFilter,
} from "../../utils/hitsplatFilter";
import {
  HitsplatTypeFilter,
  matchesHitsplatTypeFilter,
} from "../../utils/hitsplatTypeFilter";
import { isDamageDoneDrilledIn } from "../../utils/damageDoneDrillDown";

interface LogsSelectionProps {
  fight: Fight;
  type: "damage-done" | "damage-taken";
  sourceFilter: ActorFilter | null;
  targetFilter: ActorFilter | null;
  equipmentFilter?: EquipmentFilter | null;
  prayerFilter?: PrayerFilter | null;
  hitsplatFilter?: HitsplatFilter | null;
  hitsplatTypeFilter?: HitsplatTypeFilter | null;
  onSelectSourceFilter: (filter: ActorFilter) => void;
  onSelectTargetFilter: (filter: ActorFilter) => void;
  onSelectEquipmentFilter?: (filter: EquipmentFilter) => void;
  onSelectPrayerFilter?: (filter: PrayerFilter) => void;
  onSelectHitsplatFilter?: (filter: HitsplatFilter) => void;
  onSelectHitsplatTypeFilter?: (filter: HitsplatTypeFilter) => void;
  onClearSourceFilter: () => void;
  onClearTargetFilter: () => void;
  onClearEquipmentFilter?: () => void;
  onClearPrayerFilter?: () => void;
  onClearHitsplatFilter?: () => void;
  onClearHitsplatTypeFilter?: () => void;
  dpsPercentiles?: Record<string, number>;
  showPercentile?: boolean;
}

const DamageDone: React.FC<LogsSelectionProps> = ({
  fight,
  type,
  sourceFilter,
  targetFilter,
  equipmentFilter = null,
  prayerFilter = null,
  hitsplatFilter = null,
  hitsplatTypeFilter = null,
  onSelectSourceFilter,
  onSelectTargetFilter,
  onSelectEquipmentFilter,
  onSelectPrayerFilter,
  onSelectHitsplatFilter,
  onSelectHitsplatTypeFilter,
  onClearSourceFilter,
  onClearTargetFilter,
  onClearEquipmentFilter,
  onClearPrayerFilter,
  onClearHitsplatFilter,
  onClearHitsplatTypeFilter,
  dpsPercentiles,
  showPercentile = false,
}) => {
  const filteredLogs = useMemo(
    () => filterByType(fight.data, LogTypes.DAMAGE),
    [fight.data],
  );

  const fightWithFilteredLogs = useMemo(() => {
    if (type === "damage-done") {
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
    }

    return {
      ...fight,
      data: filteredLogs.filter((log) => {
        const damageLog = log as DamageLog;
        return (
          !damageLog.target.index ||
          (Boolean(damageLog.target.id) &&
            BOAT_IDS.includes(damageLog.target.id!))
        );
      }),
    };
  }, [fight, filteredLogs, type]);

  const equipmentTimelines = useMemo(
    () => buildEquipmentTimelines(fight.data),
    [fight.data],
  );

  const prayerTimelines = useMemo(
    () => buildPrayerTimelines(fight.data),
    [fight.data],
  );

  const fightWithActorFilters = useMemo(
    () => ({
      ...fightWithFilteredLogs,
      data: fightWithFilteredLogs.data.filter((log) => {
        if (log.type !== LogTypes.DAMAGE) {
          return false;
        }

        const damageLog = log as DamageLog;
        if (!matchesActorFilter(damageLog.source, sourceFilter)) {
          return false;
        }

        const matchesTarget =
          type === "damage-done"
            ? matchesMonsterTargetFilter(damageLog.target, targetFilter)
            : matchesActorFilter(damageLog.target, targetFilter);
        if (!matchesTarget) {
          return false;
        }

        if (
          !matchesEquipmentFilter(
            log,
            equipmentTimelines,
            equipmentFilter ?? null,
            sourceFilter,
            targetFilter,
          )
        ) {
          return false;
        }

        return (
          matchesPrayerFilter(
            log,
            prayerTimelines,
            prayerFilter ?? null,
            sourceFilter,
            targetFilter,
          ) &&
          matchesHitsplatFilter(log, hitsplatFilter ?? null) &&
          matchesHitsplatTypeFilter(log, hitsplatTypeFilter ?? null)
        );
      }),
    }),
    [
      fightWithFilteredLogs,
      type,
      sourceFilter,
      targetFilter,
      equipmentFilter,
      prayerFilter,
      hitsplatFilter,
      hitsplatTypeFilter,
      equipmentTimelines,
      prayerTimelines,
    ],
  );

  const drillDownLogs = useMemo(
    () =>
      fightWithFilteredLogs.data.filter((log) => {
        if (log.type !== LogTypes.DAMAGE) {
          return false;
        }

        const damageLog = log as DamageLog;
        return matchesActorFilter(damageLog.source, sourceFilter);
      }) as DamageLog[],
    [fightWithFilteredLogs.data, sourceFilter],
  );

  return (
    <div>
      {fight && (
        <div>
          <SectionBox>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "400",
              }}
            >
              {fight && fight.data && fight.data.length > 1 && (
                <DPSChart fight={fightWithActorFilters} />
              )}
            </div>
          </SectionBox>
          <SectionBox>
            <div className="results-chart-container">
              <Results fight={fightWithActorFilters} />
              {fightWithActorFilters &&
                fightWithActorFilters.data &&
                fightWithActorFilters.data.length > 0 && (
                  <HitDistributionChart
                    fight={fightWithActorFilters}
                    hitsplatFilter={hitsplatFilter}
                    onSelectHitsplatFilter={onSelectHitsplatFilter}
                  />
                )}
            </div>
          </SectionBox>
          {type === "damage-done" ? (
            <div
              className={
                isDamageDoneDrilledIn(sourceFilter)
                  ? "damage-done-dps-stack damage-done-dps-stack--drilled"
                  : "damage-done-dps-stack"
              }
            >
              <DamageDoneDrillBanner
                sourceFilter={sourceFilter}
                targetFilter={targetFilter}
                onSelectSourceFilter={onSelectSourceFilter}
                onSelectTargetFilter={onSelectTargetFilter}
                onClearSourceFilter={onClearSourceFilter}
                onClearTargetFilter={onClearTargetFilter}
              />
              <DPSMeterTable
                fight={fight}
                filteredFight={fightWithActorFilters}
                drillDownLogs={drillDownLogs}
                type={type}
                sourceFilter={sourceFilter}
                targetFilter={targetFilter}
                dpsPercentiles={dpsPercentiles}
                showPercentile={showPercentile}
                onSelectSourceFilter={onSelectSourceFilter}
                onSelectTargetFilter={onSelectTargetFilter}
              />
            </div>
          ) : (
            <DPSMeterTable
              fight={fight}
              filteredFight={fightWithActorFilters}
              drillDownLogs={drillDownLogs}
              type={type}
              sourceFilter={sourceFilter}
              targetFilter={targetFilter}
              dpsPercentiles={dpsPercentiles}
              showPercentile={showPercentile}
              onSelectSourceFilter={onSelectSourceFilter}
              onSelectTargetFilter={onSelectTargetFilter}
            />
          )}
          <EventsTable
            fight={fightWithActorFilters}
            allLogs={fight.data}
            maxHeight={"60vh"}
            variant="damage"
            sourceFilter={sourceFilter}
            targetFilter={targetFilter}
            equipmentFilter={equipmentFilter}
            prayerFilter={prayerFilter}
            hitsplatFilter={hitsplatFilter}
            hitsplatTypeFilter={hitsplatTypeFilter}
            onSelectSourceFilter={onSelectSourceFilter}
            onSelectTargetFilter={onSelectTargetFilter}
            onSelectEquipmentFilter={onSelectEquipmentFilter}
            onSelectPrayerFilter={onSelectPrayerFilter}
            onSelectHitsplatFilter={onSelectHitsplatFilter}
            onSelectHitsplatTypeFilter={onSelectHitsplatTypeFilter}
            onClearSourceFilter={onClearSourceFilter}
            onClearTargetFilter={onClearTargetFilter}
            onClearEquipmentFilter={onClearEquipmentFilter}
            onClearPrayerFilter={onClearPrayerFilter}
            onClearHitsplatFilter={onClearHitsplatFilter}
            onClearHitsplatTypeFilter={onClearHitsplatTypeFilter}
          />
        </div>
      )}
    </div>
  );
};

export default DamageDone;
