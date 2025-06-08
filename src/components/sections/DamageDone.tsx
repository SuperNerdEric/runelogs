import React from 'react';
import HitDistributionChart from "../charts/HitDistributionChart";
import Results from "../Results";
import DPSChart from "../charts/DPSChart";
import {Fight} from "../../models/Fight";
import EventsTable from "../EventsTable";
import DPSMeterTable from "../charts/DPSMeterTable";
import SectionBox from "../SectionBox";

interface LogsSelectionProps {
    selectedLogs: Fight;
    actor: "source" | "target";
}

const DamageDone: React.FC<LogsSelectionProps> = ({selectedLogs, actor}) => {
    return (
        <div>
            {selectedLogs && (
                <div>
                    <SectionBox>
                        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400'}}>
                            {selectedLogs && selectedLogs.data && selectedLogs.data.length > 1 && (
                                <DPSChart fight={selectedLogs}/>
                            )}
                        </div>
                    </SectionBox>
                    <SectionBox>
                        <div className="results-chart-container">
                                <Results fight={selectedLogs}/>
                                {selectedLogs && selectedLogs.data && selectedLogs.data.length > 0 && (
                                    <HitDistributionChart fight={selectedLogs}/>
                                )}
                        </div>
                    </SectionBox>
                    <DPSMeterTable fight={selectedLogs} actor={actor}/>
                    <EventsTable fight={selectedLogs} maxHeight={'60vh'}/>
                </div>
            )}
        </div>
    );
};

export default DamageDone;
