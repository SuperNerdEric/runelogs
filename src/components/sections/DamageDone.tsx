import React, {useMemo} from 'react';
import HitDistributionChart from "../charts/HitDistributionChart";
import Results from "../Results";
import DPSChart from "../charts/DPSChart";
import {Fight} from "../../models/Fight";
import EventsTable from "../EventsTable";
import DPSMeterTable from "../charts/DPSMeterTable";
import SectionBox from "../SectionBox";
import {filterByType, LogTypes, DamageLog} from "../../models/LogLine";
import {BOAT_IDS} from "../../utils/constants";
import {ActorFilter, matchesActorFilter} from "../../utils/actorFilter";
import {buildEquipmentTimelines, EquipmentFilter, matchesEquipmentFilter} from "../../utils/equipmentFilter";

interface LogsSelectionProps {
    fight: Fight;
    type: "damage-done" | "damage-taken";
    sourceFilter: ActorFilter | null;
    targetFilter: ActorFilter | null;
    equipmentFilter?: EquipmentFilter | null;
    onSelectSourceFilter: (filter: ActorFilter) => void;
    onSelectTargetFilter: (filter: ActorFilter) => void;
    onSelectEquipmentFilter?: (filter: EquipmentFilter) => void;
    onClearSourceFilter: () => void;
    onClearTargetFilter: () => void;
    onClearEquipmentFilter?: () => void;
}

const DamageDone: React.FC<LogsSelectionProps> = ({
    fight,
    type,
    sourceFilter,
    targetFilter,
    equipmentFilter = null,
    onSelectSourceFilter,
    onSelectTargetFilter,
    onSelectEquipmentFilter,
    onClearSourceFilter,
    onClearTargetFilter,
    onClearEquipmentFilter,
}) => {
    const filteredLogs = filterByType(fight.data, LogTypes.DAMAGE);

    let fightWithFilteredLogs;
    if (type === "damage-done") {
        fightWithFilteredLogs = {
            ...fight,
            data: filteredLogs.filter(log => {
                const damageLog = log as DamageLog;
                // Include if target has index (monster) AND target is NOT a boat
                return Boolean(damageLog.target.index) &&
                    (!damageLog.target.id || !BOAT_IDS.includes(damageLog.target.id));
            }),
        };
    } else {
        fightWithFilteredLogs = {
            ...fight,
            data: filteredLogs.filter(log => {
                const damageLog = log as DamageLog;
                // Include if target has no index (player) OR target IS a boat
                return !damageLog.target.index ||
                    (Boolean(damageLog.target.id) && BOAT_IDS.includes(damageLog.target.id!));
            }),
        };
    }

    const equipmentTimelines = useMemo(
        () => buildEquipmentTimelines(fight.data),
        [fight.data]
    );

    const fightWithActorFilters = {
        ...fightWithFilteredLogs,
        data: fightWithFilteredLogs.data.filter((log) => {
            if (log.type !== LogTypes.DAMAGE) {
                return false;
            }

            const damageLog = log as DamageLog;
            if (!matchesActorFilter(damageLog.source, sourceFilter) || !matchesActorFilter(damageLog.target, targetFilter)) {
                return false;
            }

            return matchesEquipmentFilter(log, equipmentTimelines, equipmentFilter ?? null, sourceFilter, targetFilter);
        }),
    };

    return (
        <div>
            {fight && (
                <div>
                    <SectionBox>
                        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400'}}>
                            {fight && fight.data && fight.data.length > 1 && (
                                <DPSChart fight={fightWithActorFilters}/>
                            )}
                        </div>
                    </SectionBox>
                    <SectionBox>
                        <div className="results-chart-container">
                                <Results fight={fightWithActorFilters}/>
                                {fightWithActorFilters && fightWithActorFilters.data && fightWithActorFilters.data.length > 0 && (
                                    <HitDistributionChart fight={fightWithActorFilters}/>
                                )}
                        </div>
                    </SectionBox>
                    <DPSMeterTable
                        fight={fight}
                        filteredFight={fightWithActorFilters}
                        type={type}
                        onSelectSourceFilter={onSelectSourceFilter}
                        onSelectTargetFilter={onSelectTargetFilter}
                    />
                    <EventsTable
                        fight={fightWithActorFilters}
                        allLogs={fight.data}
                        maxHeight={'60vh'}
                        sourceFilter={sourceFilter}
                        targetFilter={targetFilter}
                        equipmentFilter={equipmentFilter}
                        onSelectSourceFilter={onSelectSourceFilter}
                        onSelectTargetFilter={onSelectTargetFilter}
                        onSelectEquipmentFilter={onSelectEquipmentFilter}
                        onClearSourceFilter={onClearSourceFilter}
                        onClearTargetFilter={onClearTargetFilter}
                        onClearEquipmentFilter={onClearEquipmentFilter}
                    />
                </div>
            )}
        </div>
    );
};

export default DamageDone;
