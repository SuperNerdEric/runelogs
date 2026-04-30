import React from 'react';
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

interface LogsSelectionProps {
    fight: Fight;
    type: "damage-done" | "damage-taken";
    sourceFilter: ActorFilter | null;
    targetFilter: ActorFilter | null;
    onSelectSourceFilter: (filter: ActorFilter) => void;
    onSelectTargetFilter: (filter: ActorFilter) => void;
    onClearSourceFilter: () => void;
    onClearTargetFilter: () => void;
}

const DamageDone: React.FC<LogsSelectionProps> = ({
    fight,
    type,
    sourceFilter,
    targetFilter,
    onSelectSourceFilter,
    onSelectTargetFilter,
    onClearSourceFilter,
    onClearTargetFilter,
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

    const fightWithActorFilters = {
        ...fightWithFilteredLogs,
        data: fightWithFilteredLogs.data.filter((log) => {
            if (log.type !== LogTypes.DAMAGE) {
                return false;
            }

            const damageLog = log as DamageLog;
            return matchesActorFilter(damageLog.source, sourceFilter) && matchesActorFilter(damageLog.target, targetFilter);
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
                        maxHeight={'60vh'}
                        sourceFilter={sourceFilter}
                        targetFilter={targetFilter}
                        onSelectSourceFilter={onSelectSourceFilter}
                        onSelectTargetFilter={onSelectTargetFilter}
                        onClearSourceFilter={onClearSourceFilter}
                        onClearTargetFilter={onClearTargetFilter}
                    />
                </div>
            )}
        </div>
    );
};

export default DamageDone;
