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

interface LogsSelectionProps {
    fight: Fight;
    type: "damage-done" | "damage-taken";
}

const DamageDone: React.FC<LogsSelectionProps> = ({fight, type}) => {
    const filteredLogs = filterByType(fight.data, LogTypes.DAMAGE);

    let fightWithFilteredLogs;
    if (type === "damage-done") {
        fightWithFilteredLogs = {
            ...fight,
            data: filteredLogs.filter(log => {
                const damageLog = log as DamageLog;
                // Include if target has index (monster) AND target is NOT a boat
                return damageLog.target.index && 
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
                       (damageLog.target.id && BOAT_IDS.includes(damageLog.target.id));
            }),
        };
    }

    return (
        <div>
            {fight && (
                <div>
                    <SectionBox>
                        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400'}}>
                            {fight && fight.data && fight.data.length > 1 && (
                                <DPSChart fight={fightWithFilteredLogs}/>
                            )}
                        </div>
                    </SectionBox>
                    <SectionBox>
                        <div className="results-chart-container">
                                <Results fight={fightWithFilteredLogs}/>
                                {fightWithFilteredLogs && fightWithFilteredLogs.data && fightWithFilteredLogs.data.length > 0 && (
                                    <HitDistributionChart fight={fightWithFilteredLogs}/>
                                )}
                        </div>
                    </SectionBox>
                    <DPSMeterTable fight={fight} filteredFight={fightWithFilteredLogs} type={type}/>
                    <EventsTable fight={fightWithFilteredLogs} maxHeight={'60vh'}/>
                </div>
            )}
        </div>
    );
};

export default DamageDone;
