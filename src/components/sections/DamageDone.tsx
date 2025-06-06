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
    console.log("Rendering DamageDone component with selectedLogs:", selectedLogs);
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
                        <div style={{display: 'flex'}}>
                            <div style={{flex: '30%', marginRight: '20px'}}>
                                <Results fight={selectedLogs}/>
                            </div>
                            <div style={{flex: '70%'}}>
                                {selectedLogs && selectedLogs.data && selectedLogs.data.length > 0 && (
                                    <HitDistributionChart fight={selectedLogs}/>
                                )}
                            </div>
                        </div>
                    </SectionBox>
                    <DPSMeterTable fight={selectedLogs} actor={actor}/>
                    <EventsTable fight={selectedLogs}/>
                </div>
            )}
        </div>
    );
};

export default DamageDone;
